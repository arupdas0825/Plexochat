"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { ChatThread, ChatMessage, ChatUser } from "./mock-chat-data";
import { useAuth, getWebSocketUrl } from "./auth-context";
import { useConnections } from "./connections-context";

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
  const { user, firebaseUser } = useAuth();
  const { connections, refreshConnections } = useConnections();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Sync threads with accepted connections
  useEffect(() => {
    if (!user) {
      setThreads([]);
      setActiveThreadId(null);
      return;
    }

    // Load persisted local thread message history
    let existingThreads: ChatThread[] = [];
    try {
      const storageKey = `plexochat_threads_${user.id}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        existingThreads = JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to load threads from storage", e);
    }

    // Ensure every accepted connection has a thread
    const connectionIds = new Set(connections.map((c) => c.userId));
    const mergedThreads: ChatThread[] = [...existingThreads];

    connections.forEach((conn) => {
      const foundIdx = mergedThreads.findIndex(
        (t) => t.participant.id === conn.userId || t.participant.username === conn.username
      );
      const participant: ChatUser = {
        id: conn.userId,
        username: conn.username,
        displayName: conn.displayName,
        plexoChatId: `@${conn.username}`,
        avatarBg: conn.avatarBg || "from-blue-600 to-indigo-600",
        preferredLanguage: conn.languagesSpoken?.[0] || "English",
        languageCode: "en",
        online: conn.online,
      };

      if (foundIdx === -1) {
        // Create new empty thread for accepted connection
        const newThread: ChatThread = {
          id: `chat-${conn.userId}`,
          participant,
          lastMessage: {
            id: `welcome-${conn.id}`,
            senderId: "system",
            senderName: "PlexoChat",
            originalText: "Connected! End-to-end encrypted messaging unlocked.",
            translatedText: "Connected! End-to-end encrypted messaging unlocked.",
            originalLang: "English",
            targetLangCode: "EN",
            timestamp: new Date().toISOString(),
            status: "delivered",
          },
          unreadCount: 0,
          messages: [],
        };
        mergedThreads.push(newThread);
      } else {
        // Update participant details
        mergedThreads[foundIdx] = {
          ...mergedThreads[foundIdx],
          participant,
        };
      }
    });

    setThreads(mergedThreads);
    setActiveThreadId((prev) => (mergedThreads.length > 0 && !prev ? mergedThreads[0].id : prev));
  }, [user, connections]);

  // Connect to WebSocket relay
  useEffect(() => {
    if (!firebaseUser) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    let isSubscribed = true;
    let socket: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connectWebSocket = async () => {
      try {
        const token = await firebaseUser.getIdToken();
        if (!isSubscribed) return;

        const wsBase = getWebSocketUrl();
        const fullWsUrl = `${wsBase}?token=${encodeURIComponent(token)}`;
        socket = new WebSocket(fullWsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          console.info("[PlexoChat WS] Connected to message relay");
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === "message") {
              const fromUserId = data.from_user_id;
              const newMsg: ChatMessage = {
                id: data.client_message_id || `msg-${Date.now()}`,
                senderId: fromUserId,
                senderName: "Peer",
                originalText: data.text,
                translatedText: data.text,
                originalLang: "English",
                targetLangCode: "EN",
                timestamp: data.timestamp || new Date().toISOString(),
                status: "delivered",
              };

              setThreads((prev) => {
                let matched = false;
                const updated = prev.map((th) => {
                  if (th.participant.id === fromUserId) {
                    matched = true;
                    return {
                      ...th,
                      lastMessage: newMsg,
                      messages: [...th.messages, newMsg],
                      unreadCount: th.id === activeThreadId ? 0 : (th.unreadCount || 0) + 1,
                    };
                  }
                  return th;
                });
                return updated;
              });

              // Send delivery ack back to server
              if (socket && socket.readyState === WebSocket.OPEN && data.client_message_id) {
                socket.send(
                  JSON.stringify({
                    type: "ack",
                    client_message_id: data.client_message_id,
                  })
                );
              }
            } else if (
              data.type === "CONNECTION_REQUEST_RECEIVED" ||
              data.type === "CONNECTION_ACCEPTED" ||
              data.type === "CONNECTION_REVOKED"
            ) {
              refreshConnections();
            } else if (data.type === "presence") {
              setThreads((prev) =>
                prev.map((th) =>
                  th.participant.id === data.user_id
                    ? { ...th, participant: { ...th.participant, online: data.status === "online" } }
                    : th
                )
              );
            }
          } catch (err) {
            console.warn("[PlexoChat WS] Error processing message frame:", err);
          }
        };

        socket.onclose = () => {
          console.info("[PlexoChat WS] Closed — attempting reconnect in 3s");
          if (isSubscribed) {
            reconnectTimeout = setTimeout(connectWebSocket, 3000);
          }
        };

        socket.onerror = (err) => {
          console.warn("[PlexoChat WS] Socket error:", err);
        };
      } catch (err) {
        console.warn("[PlexoChat WS] Connection error:", err);
        if (isSubscribed) {
          reconnectTimeout = setTimeout(connectWebSocket, 3000);
        }
      }
    };

    connectWebSocket();

    return () => {
      isSubscribed = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (socket) socket.close();
      wsRef.current = null;
    };
  }, [firebaseUser, refreshConnections, activeThreadId]);

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
      const updated = threads.map((th) => (th.id === id ? { ...th, unreadCount: 0 } : th));
      saveThreads(updated);
    }
  };

  const sendMessage = (threadId: string, text: string, isPhoto = false, photoUrl?: string) => {
    const thread = threads.find((t) => t.id === threadId);
    if (!thread) return;

    const clientMsgId = "msg-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);

    const newMsg: ChatMessage = {
      id: clientMsgId,
      senderId: "me",
      senderName: user?.displayName || "You",
      originalText: text,
      translatedText: text,
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

    // Relay through WebSocket if open
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "message",
          to_user_id: thread.participant.id,
          text,
          client_message_id: clientMsgId,
        })
      );
    }
  };

  const startChatWithUser = (targetUser: ChatUser, initialText?: string): string => {
    const existing = threads.find((t) => t.participant.id === targetUser.id);
    if (existing) {
      selectThread(existing.id);
      return existing.id;
    }

    const newId = `chat-${targetUser.id}`;
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
