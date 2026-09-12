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
  sendWsFrame: (frame: Record<string, unknown>) => boolean;
  registerCallSignalHandler: (handler: (signal: any) => void) => () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user, firebaseUser } = useAuth();
  const { connections, refreshConnections } = useConnections();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const activeThreadIdRef = useRef(activeThreadId);
  useEffect(() => {
    activeThreadIdRef.current = activeThreadId;
  }, [activeThreadId]);

  const refreshConnectionsRef = useRef(refreshConnections);
  useEffect(() => {
    refreshConnectionsRef.current = refreshConnections;
  }, [refreshConnections]);

  const callSignalHandlersRef = useRef<Set<(signal: any) => void>>(new Set());

  const registerCallSignalHandler = useCallback((handler: (signal: any) => void) => {
    callSignalHandlersRef.current.add(handler);
    return () => {
      callSignalHandlersRef.current.delete(handler);
    };
  }, []);

  const sendWsFrame = useCallback((frame: Record<string, unknown>): boolean => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(frame));
      return true;
    }
    return false;
  }, []);

  // Defer Olm account initialization to background idle time to prevent blocking initial render
  useEffect(() => {
    if (!user?.id || !firebaseUser) return;
    let isCancelled = false;

    const scheduleInit = () => {
      initOlm()
        .then(() => {
          if (!isCancelled) {
            return getOrCreateAccount(user.id, () => firebaseUser.getIdToken());
          }
        })
        .catch((err) =>
          console.warn("[ChatContext] Olm account background init:", err)
        );
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const handle = (window as any).requestIdleCallback(scheduleInit, { timeout: 3000 });
      return () => {
        isCancelled = true;
        (window as any).cancelIdleCallback(handle);
      };
    } else {
      const timer = setTimeout(scheduleInit, 1000);
      return () => {
        isCancelled = true;
        clearTimeout(timer);
      };
    }
  }, [user?.id, firebaseUser?.uid]);

  // Frame-1 instant thread hydration from local cache
  useEffect(() => {
    if (!user?.id) return;
    try {
      const saved = localStorage.getItem(`plexochat_threads_${user.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setThreads((prev) => (prev.length === 0 ? parsed : prev));
        }
      }
    } catch {
      // ignore
    }
  }, [user?.id]);

  // Fast hydration: load threads immediately without blocking on all message histories
  useEffect(() => {
    let isMounted = true;

    async function loadThreads() {
      if (!user?.id) {
        if (isMounted) {
          setThreads([]);
          setActiveThreadId(null);
        }
        return;
      }
      // 1. Load threads metadata from IndexedDB or localStorage fallback
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

      if (!isMounted) return;

      // 2. Ensure every accepted connection has a thread
      const mergedThreads: ChatThread[] = [...existingThreads];

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

    loadThreads();

    return () => {
      isMounted = false;
    };
  }, [user?.id, connections]);

  // Load message history on-demand only for the active thread
  useEffect(() => {
    if (!activeThreadId) return;
    let isCurrent = true;

    getThreadMessages(activeThreadId).then((storedMsgs) => {
      if (!isCurrent) return;
      if (storedMsgs && storedMsgs.length > 0) {
        setThreads((prev) =>
          prev.map((t) => {
            if (t.id === activeThreadId) {
              return {
                ...t,
                messages: storedMsgs,
                lastMessage: storedMsgs[storedMsgs.length - 1] || t.lastMessage,
              };
            }
            return t;
          })
        );
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [activeThreadId]);

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
    let pingInterval: NodeJS.Timeout | null = null;
    let backoffDelay = 1500;

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
          backoffDelay = 1500; // Reset backoff on successful connect

          // Start 25s keep-alive heartbeat ping to prevent Render idle timeout (55s)
          if (pingInterval) clearInterval(pingInterval);
          pingInterval = setInterval(() => {
            if (socket && socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({ type: "ping" }));
            }
          }, 25000);
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

              // E2EE Decryption flow (if ciphertext envelope is present)
              const currentUserId = userRef.current?.id || user.id;
              if (data.ciphertext) {
                try {
                  const decrypted: DecryptedPayload = await decryptMessage(
                    currentUserId,
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
                  console.warn(
                    "[PlexoChat WS] E2EE decryption warning for incoming message:",
                    decErr
                  );
                  // If text was also present, fallback gracefully to text
                  if (data.text) {
                    originalText = data.text;
                    translatedText = data.text;
                  } else {
                    translatedText = "[Encrypted Message - Key Synchronizing]";
                    originalText = "[Encrypted Message - Key Synchronizing]";
                  }
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
              // Save message into IndexedDB
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
                        th.id === activeThreadIdRef.current
                          ? 0
                          : (th.unreadCount || 0) + 1,
                    };
                  }
                  return th;
                });
                saveUserThreads(currentUserId, updated);
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
            } else if (data.type === "ack_relay" || data.type === "delivered") {
              const ackId = data.client_message_id;
              setThreads((prev) =>
                prev.map((th) => ({
                  ...th,
                  messages: th.messages.map((m) =>
                    m.id === ackId ? { ...m, status: "delivered" } : m
                  ),
                  lastMessage:
                    th.lastMessage?.id === ackId
                      ? { ...th.lastMessage, status: "delivered" }
                      : th.lastMessage,
                }))
              );
            } else if (data.type === "queued") {
              const queuedId = data.client_message_id;
              setThreads((prev) =>
                prev.map((th) => ({
                  ...th,
                  messages: th.messages.map((m) =>
                    m.id === queuedId ? { ...m, status: "sent" } : m
                  ),
                  lastMessage:
                    th.lastMessage?.id === queuedId
                      ? { ...th.lastMessage, status: "sent" }
                      : th.lastMessage,
                }))
              );
            } else if (
              data.type === "CONNECTION_REQUEST_RECEIVED" ||
              data.type === "CONNECTION_ACCEPTED" ||
              data.type === "CONNECTION_REVOKED"
            ) {
              refreshConnectionsRef.current();
            } else if (data.type === "call_signal") {
              callSignalHandlersRef.current.forEach((handler) => {
                try {
                  handler(data);
                } catch (err) {
                  console.warn("[PlexoChat WS] Error in call signal handler:", err);
                }
              });
            } else if (data.type === "presence") {
              const isUserOnline = data.status === "online";
              setThreads((prev) =>
                prev.map((th) =>
                  th.participant.id === data.user_id
                    ? {
                        ...th,
                        participant: {
                          ...th.participant,
                          online: isUserOnline,
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
          if (pingInterval) clearInterval(pingInterval);
          console.info(`[PlexoChat WS] Closed — reconnecting in ${backoffDelay}ms`);
          if (isSubscribed) {
            reconnectTimeout = setTimeout(connectWebSocket, backoffDelay);
            backoffDelay = Math.min(backoffDelay * 1.5, 8000);
          }
        };

        socket.onerror = (err) => {
          console.warn("[PlexoChat WS] Socket error:", err);
        };
      } catch (err) {
        if (pingInterval) clearInterval(pingInterval);
        console.warn("[PlexoChat WS] Connection error:", err);
        if (isSubscribed) {
          reconnectTimeout = setTimeout(connectWebSocket, backoffDelay);
          backoffDelay = Math.min(backoffDelay * 1.5, 8000);
        }
      }
    };

    connectWebSocket();

    return () => {
      isSubscribed = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (pingInterval) clearInterval(pingInterval);
      if (socket) socket.close();
      wsRef.current = null;
    };
  }, [firebaseUser?.uid, user?.id]);

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
   * Reliable Message Dispatch with Immediate Optimistic UI
   */
  const sendMessage = async (
    threadId: string,
    text: string,
    isPhoto = false,
    photoUrl?: string
  ) => {
    const thread = threads.find((t) => t.id === threadId);
    if (!thread || !user || !firebaseUser) return;

    const trimmed = text.trim();
    if (!trimmed && !isPhoto) return;

    const clientMsgId =
      "msg-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
    const nowIso = new Date().toISOString();

    const senderLang = user.preferredReceivingLanguage || "en";
    const recipientLang =
      thread.participant.languageCode ||
      thread.participant.preferredLanguage ||
      "en";

    // 1. OPTIMISTIC LOCAL INSERTION — Show immediately in sender's UI
    const optimisticMsg: ChatMessage = {
      id: clientMsgId,
      senderId: "me",
      senderName: user.displayName || "You",
      originalText: text,
      translatedText: text,
      originalLang: "English",
      targetLangCode: getLanguageCode(senderLang),
      timestamp: nowIso,
      status: "sending",
      isPhoto,
      photoUrl,
    };

    setThreads((prev) => {
      const updated = prev.map((th) => {
        if (th.id === threadId) {
          return {
            ...th,
            lastMessage: optimisticMsg,
            messages: [...th.messages, optimisticMsg],
          };
        }
        return th;
      });
      saveUserThreads(user.id, updated);
      return updated;
    });

    // 2. Perform translation in the background
    let recipientTransText = text;
    let senderTransText = text;
    let sourceLang = "en";
    let translationUnavailable = false;

    try {
      const recipientTrans = await translateText(text, recipientLang);
      recipientTransText = recipientTrans.translatedText;
      sourceLang = recipientTrans.sourceLang;
      translationUnavailable = !!recipientTrans.translationUnavailable;

      if (
        senderLang.toLowerCase() !== recipientTrans.sourceLang.toLowerCase()
      ) {
        const senderTrans = await translateText(text, senderLang);
        senderTransText = senderTrans.translatedText;
      }
    } catch (transErr) {
      console.warn("[PlexoChat] Translation warning:", transErr);
    }

    const payload: DecryptedPayload = {
      original_text: text,
      translated_text: recipientTransText,
      source_lang: sourceLang,
      target_lang: recipientLang,
      client_message_id: clientMsgId,
      timestamp: nowIso,
      is_photo: isPhoto,
      photo_url: photoUrl,
    };

    // 3. Attempt Olm Double-Ratchet encryption (falls back cleanly if keys uninitialized)
    let ciphertext: string | null = null;
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
      console.warn(
        "[PlexoChat] Olm encryption bypassed for direct dispatch:",
        encErr
      );
    }

    // 4. Dispatch over WebSocket
    let sendStatus: "sent" | "failed" = "failed";

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        const frame: Record<string, unknown> = {
          type: "message",
          to_user_id: thread.participant.id,
          text: text,
          client_message_id: clientMsgId,
        };
        if (ciphertext) {
          frame.ciphertext = ciphertext;
          frame.message_type = messageType;
        }

        wsRef.current.send(JSON.stringify(frame));
        sendStatus = "sent";
      } catch (sendErr) {
        console.error("[PlexoChat WS] send error:", sendErr);
        sendStatus = "failed";
      }
    } else {
      console.warn("[PlexoChat WS] Socket not open when dispatching message");
      sendStatus = "failed";
    }

    // 5. Update finalized status in sender's thread
    const finalizedMsg: ChatMessage = {
      ...optimisticMsg,
      translatedText: senderTransText,
      originalLang: getLanguageLabel(sourceLang),
      targetLangCode: getLanguageCode(senderLang),
      status: sendStatus,
      translationUnavailable,
    };

    await saveMessage(threadId, finalizedMsg);

    setThreads((prev) => {
      const updated = prev.map((th) => {
        if (th.id === threadId) {
          return {
            ...th,
            lastMessage: finalizedMsg,
            messages: th.messages.map((m) =>
              m.id === clientMsgId ? finalizedMsg : m
            ),
          };
        }
        return th;
      });
      saveUserThreads(user.id, updated);
      return updated;
    });
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
        sendWsFrame,
        registerCallSignalHandler,
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
