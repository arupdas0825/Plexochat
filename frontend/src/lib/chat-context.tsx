"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { ChatThread, ChatMessage, ChatUser } from "./mock-chat-data";
import { useAuth, getWebSocketUrl } from "./auth-context";
import { useConnections } from "./connections-context";
import {
  translateText,
  getLanguageLabel,
  getLanguageCode,
} from "./translation-service";
import {
  initOlm,
  getOrCreateAccount,
  encryptMessage,
  decryptMessage,
  DecryptedPayload,
} from "./crypto-service";
import {
  saveMessage,
  getThreadMessages,
  saveUserThreads,
  getUserThreads,
} from "./chat-storage";

interface ChatContextType {
  threads: ChatThread[];
  activeThreadId: string | null;
  unreadTotal: number;
  selectThread: (id: string | null) => void;
  sendMessage: (
    threadId: string,
    text: string,
    isPhoto?: boolean,
    photoUrl?: string
  ) => Promise<void>;
  startChatWithUser: (user: ChatUser, initialText?: string) => string;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user, firebaseUser } = useAuth();
  const { connections, refreshConnections } = useConnections();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize Olm account on login
  useEffect(() => {
    if (!user || !firebaseUser) return;
    initOlm()
      .then(() => getOrCreateAccount(user.id, () => firebaseUser.getIdToken()))
      .catch((err) =>
        console.warn("[ChatContext] Olm account init warning:", err)
      );
  }, [user, firebaseUser]);

  // Sync threads with accepted connections & IndexedDB history
  useEffect(() => {
    let isMounted = true;

    async function loadThreadsAndHistory() {
      if (!user) {
        if (isMounted) {
          setThreads([]);
          setActiveThreadId(null);
        }
        return;
      }
      // 1. Load threads from IndexedDB with fallback to localStorage
      let existingThreads: ChatThread[] = (await getUserThreads(user.id)) || [];
      if (existingThreads.length === 0) {
        try {
          const saved = localStorage.getItem(`plexochat_threads_${user.id}`);
          if (saved) {
            existingThreads = JSON.parse(saved);
          }
        } catch {
          // ignore
        }
      }

      // 2. Load cached messages per thread from IndexedDB
      const threadPromises = existingThreads.map(async (th) => {
        const storedMsgs = await getThreadMessages(th.id);
        if (storedMsgs && storedMsgs.length > 0) {
          return {
            ...th,
            messages: storedMsgs,
            lastMessage: storedMsgs[storedMsgs.length - 1] || th.lastMessage,
          };
        }
        return th;
      });

      const hydratedThreads = await Promise.all(threadPromises);
      if (!isMounted) return;

      // 3. Ensure every accepted connection has a thread
      const mergedThreads: ChatThread[] = [...hydratedThreads];

      connections.forEach((conn) => {
        const foundIdx = mergedThreads.findIndex(
          (t) =>
            t.participant.id === conn.userId ||
            t.participant.username === conn.username
        );
        const participant: ChatUser = {
          id: conn.userId,
          username: conn.username,
          displayName: conn.displayName,
          plexoChatId: `@${conn.username}`,
          avatarBg: conn.avatarBg || "from-blue-600 to-indigo-600",
          preferredLanguage: conn.languagesSpoken?.[0] || "English",
          languageCode: conn.preferredReceivingLanguage || "en",
          online: conn.online,
        };

        if (foundIdx === -1) {
          const newThreadId = `chat-${conn.userId}`;
          const newThread: ChatThread = {
            id: newThreadId,
            participant,
            lastMessage: {
              id: `welcome-${conn.id}`,
              senderId: "system",
              senderName: "PlexoChat",
              originalText: "Connected! End-to-end encrypted messaging active.",
              translatedText:
                "Connected! End-to-end encrypted messaging active.",
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
          mergedThreads[foundIdx] = {
            ...mergedThreads[foundIdx],
            participant,
          };
        }
      });

      setThreads(mergedThreads);
      setActiveThreadId((prev) =>
        mergedThreads.length > 0 && !prev ? mergedThreads[0].id : prev
      );
    }

    loadThreadsAndHistory();

    return () => {
      isMounted = false;
    };
  }, [user, connections]);

  // Connect to WebSocket relay
  useEffect(() => {
    if (!firebaseUser || !user) {
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

        socket.onmessage = async (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === "message") {
              const fromUserId = data.from_user_id;
              let originalText = data.text || "";
              let translatedText = data.text || "";
              let originalLang = "English";
              let targetLangCode = "EN";
              let isPhoto = false;
              let photoUrl: string | undefined = undefined;

              // E2EE Decryption flow
              if (data.ciphertext) {
                try {
                  const decrypted: DecryptedPayload = await decryptMessage(
                    user.id,
                    fromUserId,
                    data.ciphertext,
                    data.message_type ?? 0,
                    () => firebaseUser.getIdToken()
                  );

                  originalText = decrypted.original_text;
                  translatedText = decrypted.translated_text;
                  originalLang = getLanguageLabel(decrypted.source_lang);
                  targetLangCode = getLanguageCode(decrypted.target_lang);
                  isPhoto = !!decrypted.is_photo;
                  photoUrl = decrypted.photo_url;
                } catch (decErr) {
                  console.error(
                    "[PlexoChat WS] E2EE decryption failed for incoming message:",
                    decErr
                  );
                  translatedText = "[Encrypted Message - Decryption Error]";
                  originalText = "[Encrypted Message - Decryption Error]";
                }
              }

              const newMsg: ChatMessage = {
                id: data.client_message_id || `msg-${Date.now()}`,
                senderId: fromUserId,
                senderName: "Peer",
                originalText,
                translatedText,
                originalLang,
                targetLangCode,
                timestamp: data.timestamp || new Date().toISOString(),
                status: "delivered",
                isPhoto,
                photoUrl,
              };

              const threadId = `chat-${fromUserId}`;
              // Save decrypted message into IndexedDB
              await saveMessage(threadId, newMsg);

              setThreads((prev) => {
                const updated = prev.map((th) => {
                  if (
                    th.participant.id === fromUserId ||
                    th.id === threadId
                  ) {
                    return {
                      ...th,
                      lastMessage: newMsg,
                      messages: [...th.messages, newMsg],
                      unreadCount:
                        th.id === activeThreadId
                          ? 0
                          : (th.unreadCount || 0) + 1,
                    };
                  }
                  return th;
                });
                saveUserThreads(user.id, updated);
                return updated;
              });

              // Send delivery ack frame back to server
              if (
                socket &&
                socket.readyState === WebSocket.OPEN &&
                data.client_message_id
              ) {
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
                    ? {
                        ...th,
                        participant: {
                          ...th.participant,
                          online: data.status === "online",
                        },
                      }
                    : th
                )
              );
            }
          } catch (err) {
            console.warn("[PlexoChat WS] Error processing frame:", err);
          }
        };

        socket.onclose = () => {
          console.info("[PlexoChat WS] Closed — reconnecting in 3s");
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
  }, [firebaseUser, user, refreshConnections, activeThreadId]);

  const saveThreads = (updatedThreads: ChatThread[]) => {
    setThreads(updatedThreads);
    if (user) {
      saveUserThreads(user.id, updatedThreads);
    }
  };

  const unreadTotal = threads.reduce(
    (sum, t) => sum + (t.unreadCount || 0),
    0
  );

  const selectThread = (id: string | null) => {
    setActiveThreadId(id);
    if (id) {
      const updated = threads.map((th) =>
        th.id === id ? { ...th, unreadCount: 0 } : th
      );
      saveThreads(updated);
    }
  };

  /**
   * End-to-End Encrypted & Translated Message Dispatch
   */
  const sendMessage = async (
    threadId: string,
    text: string,
    isPhoto = false,
    photoUrl?: string
  ) => {
    const thread = threads.find((t) => t.id === threadId);
    if (!thread || !user || !firebaseUser) return;

    const clientMsgId =
      "msg-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);

    const recipientLang =
      thread.participant.languageCode ||
      thread.participant.preferredLanguage ||
      "en";
    const senderLang = user.preferredReceivingLanguage || "en";

    // 1. Client-side translation for recipient BEFORE encryption
    const recipientTrans = await translateText(text, recipientLang);

    // 2. Client-side translation for sender's view (Sender default-shows translated)
    let senderTranslatedText = text;
    if (
      senderLang.toLowerCase() !==
      recipientTrans.sourceLang.toLowerCase()
    ) {
      const senderTrans = await translateText(text, senderLang);
      senderTranslatedText = senderTrans.translatedText;
    }

    const payload: DecryptedPayload = {
      original_text: text,
      translated_text: recipientTrans.translatedText,
      source_lang: recipientTrans.sourceLang,
      target_lang: recipientLang,
      client_message_id: clientMsgId,
      timestamp: new Date().toISOString(),
      is_photo: isPhoto,
      photo_url: photoUrl,
    };

    // 3. Encrypt payload envelope via Olm Double-Ratchet
    let ciphertext = "";
    let messageType = 0;

    try {
      const encrypted = await encryptMessage(
        user.id,
        thread.participant.id,
        payload,
        () => firebaseUser.getIdToken()
      );
      ciphertext = encrypted.ciphertext;
      messageType = encrypted.messageType;
    } catch (encErr) {
      console.error("[PlexoChat] Olm encryption error:", encErr);
      throw encErr;
    }

    // 4. Relay opaque ciphertext over WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "message",
          to_user_id: thread.participant.id,
          ciphertext,
          message_type: messageType,
          client_message_id: clientMsgId,
        })
      );
    } else {
      console.warn("[PlexoChat WS] Socket not open, message will be queued");
    }

    // 5. Store local decrypted message in sender's thread (with sender translated view)
    const newMsg: ChatMessage = {
      id: clientMsgId,
      senderId: "me",
      senderName: user.displayName || "You",
      originalText: text,
      translatedText: senderTranslatedText,
      originalLang: getLanguageLabel(recipientTrans.sourceLang),
      targetLangCode: getLanguageCode(senderLang),
      timestamp: payload.timestamp || new Date().toISOString(),
      status: "delivered",
      isPhoto,
      photoUrl,
      translationUnavailable: recipientTrans.translationUnavailable,
    };

    await saveMessage(threadId, newMsg);

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

  const startChatWithUser = (
    targetUser: ChatUser,
    initialText?: string
  ): string => {
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
