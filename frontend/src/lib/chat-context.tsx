"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { ChatThread, ChatMessage, ChatUser } from "./mock-chat-data";
import { useAuth } from "./auth-context";

interface ChatContextType {
  threads: ChatThread[];
  activeThreadId: string | null;
  unreadTotal: number;
  selectThread: (id: string | null) => void;
  sendMessage: (threadId: string, text: string, isPhoto?: boolean, photoUrl?: string) => void;
  startChatWithUser: (user: ChatUser, initialText?: string) => string;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

  // Load threads for the authenticated user
  useEffect(() => {
    if (!user) {
      queueMicrotask(() => {
        setThreads([]);
        setActiveThreadId(null);
      });
      return;
    }

    try {
      const storageKey = `plexochat_threads_${user.id}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        queueMicrotask(() => {
          setThreads(parsed);
          setActiveThreadId((prev) => (parsed.length > 0 && !prev ? parsed[0].id : prev));
        });
      } else {
        queueMicrotask(() => {
          setThreads([]);
          setActiveThreadId(null);
        });
      }
    } catch (e) {
      console.error("Failed to load threads", e);
      queueMicrotask(() => setThreads([]));
    }
  }, [user]);

  const saveThreads = (updatedThreads: ChatThread[]) => {
    setThreads(updatedThreads);
    if (user) {
      try {
        localStorage.setItem(`plexochat_threads_${user.id}`, JSON.stringify(updatedThreads));
      } catch (e) {
        console.error("Failed to save threads", e);
      }
    }
  };

  const unreadTotal = threads.reduce((sum, t) => sum + (t.unreadCount || 0), 0);

  const selectThread = (id: string | null) => {
    setActiveThreadId(id);
    if (id) {
      // Mark as read
      const updated = threads.map((th) => (th.id === id ? { ...th, unreadCount: 0 } : th));
      saveThreads(updated);
    }
  };

  const sendMessage = (threadId: string, text: string, isPhoto = false, photoUrl?: string) => {
    const thread = threads.find((t) => t.id === threadId);
    if (!thread) return;

    const newMsg: ChatMessage = {
      id: "msg-" + Date.now(),
      senderId: "me",
      senderName: user?.displayName || "You",
      originalText: text,
      translatedText: text, // In local demo/production, plaintext is encrypted and delivered
      originalLang: user?.preferredLanguageName || "English",
      targetLangCode: thread.participant.languageCode || "EN",
      timestamp: new Date().toISOString(),
      status: "delivered",
      isPhoto,
      photoUrl,
    };

    const updated = threads.map((th) => {
      if (th.id === threadId) {
        return {
          ...th,
          lastMessage: newMsg,
          messages: [...th.messages, newMsg],
        };
      }
      return th;
    });

    saveThreads(updated);
  };

  const startChatWithUser = (targetUser: ChatUser, initialText?: string): string => {
    const existing = threads.find((t) => t.participant.id === targetUser.id);
    if (existing) {
      selectThread(existing.id);
      return existing.id;
    }

    const newId = "chat-" + Date.now();
    const welcomeMsg: ChatMessage = {
      id: "msg-" + Date.now(),
      senderId: "me",
      senderName: user?.displayName || "You",
      originalText: initialText || "Hello! Connected via PlexoChat.",
      translatedText: initialText || "Hello! Connected via PlexoChat.",
      originalLang: user?.preferredLanguageName || "English",
      targetLangCode: targetUser.languageCode || "EN",
      timestamp: new Date().toISOString(),
      status: "delivered",
    };

    const newThread: ChatThread = {
      id: newId,
      participant: targetUser,
      lastMessage: welcomeMsg,
      unreadCount: 0,
      messages: [welcomeMsg],
    };

    const updated = [newThread, ...threads];
    saveThreads(updated);
    selectThread(newId);
    return newId;
  };

  return (
    <ChatContext.Provider
      value={{
        threads,
        activeThreadId,
        unreadTotal,
        selectThread,
        sendMessage,
        startChatWithUser,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
