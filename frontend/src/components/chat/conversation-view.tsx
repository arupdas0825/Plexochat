"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Lock,
  Send,
  Smile,
  Sparkles,
  Repeat,
  CheckCheck,
  Check,
  Clock,
  AlertCircle,
  MoreVertical,
  Paperclip,
  Image as ImageIcon,
  Globe2,
  ChevronDown,
  Copy,
  Reply,
  Trash2,
  X,
  ShieldCheck,
  Info,
  Phone,
  Video,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { ChatThread, ChatMessage } from "@/lib/mock-chat-data";
import { useVisualViewport } from "@/lib/use-visual-viewport";
import { useCall } from "@/lib/call-context";
import { useChat } from "@/lib/chat-context";
import { formatMessageTime } from "@/lib/utils";
import { ChatInfoPanel } from "./chat-info-panel";

interface ConversationViewProps {
  thread: ChatThread;
  onBack: () => void;
  onSendMessage: (threadId: string, text: string) => void | Promise<void>;
}

export function ConversationView({
  thread,
  onBack,
  onSendMessage,
}: ConversationViewProps) {
  const [inputText, setInputText] = useState("");
  const [revealedMessages, setRevealedMessages] = useState<Record<string, boolean>>({});
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [deletedMsgIds, setDeletedMsgIds] = useState<Record<string, boolean>>({});
  const [extraMessages, setExtraMessages] = useState<ChatMessage[]>([]);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [autoTranslateEnabled, setAutoTranslateEnabled] = useState(true);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  const securityRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const viewport = useVisualViewport();
  const participant = thread.participant;

  const { startCall, callState } = useCall();
  const { markMessagesAsRead, clearChat } = useChat();
  const isCallActive = callState !== "IDLE";

  const allMessages = React.useMemo(() => {
    return [...thread.messages, ...extraMessages].filter((m) => !deletedMsgIds[m.id]);
  }, [thread.messages, extraMessages, deletedMsgIds]);

  // Viewport IntersectionObserver: Batch mark incoming messages as read when viewed
  const reportedReadIdsRef = useRef<Set<string>>(new Set());
  const readBatchQueueRef = useRef<Set<string>>(new Set());
  const readDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const flushReadBatch = useCallback(() => {
    if (readBatchQueueRef.current.size === 0) return;
    if (typeof document !== "undefined" && document.visibilityState !== "visible") return;

    const idsToMark = Array.from(readBatchQueueRef.current);
    readBatchQueueRef.current.clear();
    markMessagesAsRead(thread.id, idsToMark);
  }, [markMessagesAsRead, thread.id]);

  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      return;
    }

    const container = scrollContainerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let hasNew = false;
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.25) {
            const msgId = entry.target.getAttribute("data-message-id");
            const senderId = entry.target.getAttribute("data-sender-id");
            if (msgId && senderId !== "me" && !reportedReadIdsRef.current.has(msgId)) {
              reportedReadIdsRef.current.add(msgId);
              readBatchQueueRef.current.add(msgId);
              hasNew = true;
            }
          }
        });

        if (hasNew) {
          if (readDebounceTimerRef.current) clearTimeout(readDebounceTimerRef.current);
          readDebounceTimerRef.current = setTimeout(() => {
            flushReadBatch();
          }, 150);
        }
      },
      {
        root: container,
        threshold: [0.25, 0.5],
      }
    );

    const messageElements = container.querySelectorAll("[data-message-id]");
    messageElements.forEach((el) => {
      const msgId = el.getAttribute("data-message-id");
      const senderId = el.getAttribute("data-sender-id");
      if (msgId && senderId !== "me" && !reportedReadIdsRef.current.has(msgId)) {
        observer.observe(el);
      }
    });

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        flushReadBatch();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);

    return () => {
      observer.disconnect();
      if (readDebounceTimerRef.current) clearTimeout(readDebounceTimerRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
    };
  }, [allMessages, flushReadBatch]);

  // Click outside for security popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (securityRef.current && !securityRef.current.contains(e.target as Node)) {
        setIsSecurityOpen(false);
      }
    };
    if (isSecurityOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSecurityOpen]);

  // Track scroll position for "New message ↓" pill
  const [showNewMsgPill, setShowNewMsgPill] = useState(false);
  const prevMsgCountRef = useRef(allMessages.length);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distFromBottom = scrollHeight - scrollTop - clientHeight;
    setShowNewMsgPill(distFromBottom > 160);
  };

  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
      setShowNewMsgPill(false);
    }
  }, []);

  useEffect(() => {
    if (allMessages.length > prevMsgCountRef.current) {
      scrollToBottom(true);
    }
    prevMsgCountRef.current = allMessages.length;
  }, [allMessages.length, scrollToBottom]);

  // Adjust scroll when virtual keyboard opens or visual viewport resizes
  useEffect(() => {
    if (viewport?.height) {
      scrollToBottom(false);
    }
  }, [viewport?.height, scrollToBottom]);

  // Toggle reveal between translated and original text
  const toggleReveal = (id: string) => {
    setRevealedMessages((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSend = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || isEncrypting) return;

    setInputText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    setIsEncrypting(true);
    setReplyingTo(null);

    try {
      await onSendMessage(thread.id, trimmed);
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setIsEncrypting(false);
      scrollToBottom(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopyText = (msg: ChatMessage) => {
    const isOriginalShown = !!revealedMessages[msg.id];
    const text = isOriginalShown ? msg.originalText : msg.translatedText;
    navigator.clipboard?.writeText(text);
  };

  const handleDeleteMsg = (msgId: string) => {
    setDeletedMsgIds((prev) => ({ ...prev, [msgId]: true }));
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    const target = e.target;
    target.style.height = "auto";
    target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
  };

  // Header options menu items
  const headerMenuItems: DropdownMenuItem[] = [
    {
      id: "contact-info",
      label: "Contact info",
      icon: Info,
      onClick: () => setIsInfoOpen(true),
    },
    {
      id: "toggle-translation",
      label: autoTranslateEnabled ? "Pause auto-translate" : "Enable auto-translate",
      icon: Globe2,
      onClick: () => setAutoTranslateEnabled((prev) => !prev),
    },
    {
      id: "clear-chat",
      label: "Clear conversation",
      icon: Trash2,
      destructive: true,
      onClick: async () => {
        const confirmed = window.confirm(
          `This clears your local copy of this conversation on this device. It does not affect ${participant.displayName}'s copy.`
        );
        if (confirmed) {
          await clearChat(thread.id);
          const allIds = allMessages.reduce((acc, m) => ({ ...acc, [m.id]: true }), {});
          setDeletedMsgIds(allIds);
        }
      },
    },
  ];

  return (
    <div className="flex-1 h-full flex flex-row bg-background relative overflow-hidden">
      <div className="flex-1 h-full flex flex-col min-w-0 relative overflow-hidden">
        {/* 1. Header (Fix Problem 5: simplified, clean information hierarchy) */}
        <header className="h-14 px-3.5 sm:px-5 border-b border-border/70 bg-card/95 backdrop-blur-md flex items-center justify-between z-10 shrink-0 select-none pt-[max(0rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Mobile Back Button */}
          <button
            type="button"
            onClick={onBack}
            className="md:hidden p-1.5 -ml-1 text-muted-foreground hover:text-foreground rounded-lg active:bg-secondary cursor-pointer"
            aria-label="Back to chat list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Participant Avatar & Name (Click to open Chat Info) */}
          <div
            onClick={() => setIsInfoOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsInfoOpen(true);
              }
            }}
            className="flex items-center gap-2.5 min-w-0 cursor-pointer hover:opacity-85 transition-opacity"
            title={`View ${participant.displayName}'s info`}
          >
            <UserAvatar
              name={participant.displayName}
              avatarBg={participant.avatarBg}
              photoUrl={participant.photoUrl}
              size="md"
              online={participant.online}
            />

            {/* Participant Details */}
            <div className="flex flex-col text-left min-w-0 leading-tight">
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-bold text-xs sm:text-sm text-foreground truncate">
                  {participant.displayName}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground font-mono">
                <span className="flex items-center gap-1">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      participant.online ? "bg-emerald-500" : "bg-muted-foreground/50"
                    }`}
                  />
                  <span>{participant.online ? "Online" : "Offline"}</span>
                </span>

                <span className="text-muted-foreground/40">•</span>

                {/* Security info popover trigger */}
                <div
                  ref={securityRef}
                  className="relative inline-block"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => setIsSecurityOpen((prev) => !prev)}
                    className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title="View encryption details"
                  >
                    <Lock className="w-2.5 h-2.5 text-emerald-500" />
                    <span>E2EE</span>
                  </button>

                  <AnimatePresence>
                    {isSecurityOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 4 }}
                        className="absolute left-0 mt-2 w-72 p-3 rounded-2xl bg-card border border-border shadow-xl z-50 text-left text-xs space-y-1.5 select-text"
                      >
                        <div className="flex items-center gap-1.5 font-bold text-foreground">
                          <ShieldCheck className="w-4 h-4 text-emerald-500" />
                          <span>End-to-End Encrypted</span>
                        </div>
                        <p className="text-muted-foreground text-[11px] leading-relaxed">
                          Messages and media in this chat are encrypted client-side via the Olm Double-Ratchet protocol. Only your device and {participant.displayName}&apos;s device have the decryption keys.
                        </p>
                        <div className="pt-1 text-[10px] text-muted-foreground font-mono">
                          Target Language: {participant.preferredLanguage || "Direct"}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Right Header Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setAutoTranslateEnabled((prev) => !prev)}
            className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer border ${
              autoTranslateEnabled
                ? "bg-secondary text-foreground border-border/80"
                : "bg-transparent text-muted-foreground border-border/50"
            }`}
            title="Toggle translation display"
          >
            <Globe2 className="w-3 h-3 text-muted-foreground" />
            <span>{autoTranslateEnabled ? "Auto-Translate" : "Direct"}</span>
          </button>

          {/* WebRTC Voice Call Ghost Button */}
          <button
            type="button"
            onClick={() => startCall(participant, "voice")}
            disabled={isCallActive}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            title={`Voice call with ${participant.displayName}`}
            aria-label="Voice call"
          >
            <Phone className="w-4 h-4" />
          </button>

          {/* WebRTC Video Call Ghost Button */}
          <button
            type="button"
            onClick={() => startCall(participant, "video")}
            disabled={isCallActive}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            title={`Video call with ${participant.displayName}`}
            aria-label="Video call"
          >
            <Video className="w-4 h-4" />
          </button>

          <DropdownMenu
            trigger={
              <button
                type="button"
                className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                title="Conversation menu"
                aria-label="More options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            }
            items={headerMenuItems}
            align="right"
          />
        </div>
      </header>

      {/* 2. Messages List (Fix Problem 2 & 3: compact bubbles, high density) */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto momentum-scroll p-3 sm:p-5 space-y-2 bg-mesh-gradient relative"
      >
        {/* Sticky Date Pill */}
        <div className="sticky top-0 z-5 flex justify-center pointer-events-none py-1">
          <span className="px-2.5 py-0.5 rounded-full bg-secondary/90 dark:bg-card/90 backdrop-blur-md border border-border/60 text-[10px] font-medium text-muted-foreground shadow-xs">
            Today
          </span>
        </div>

        {allMessages.map((msg) => {
          const isMe = msg.senderId === "me";
          const isOriginalShown = !!revealedMessages[msg.id];
          const hasTranslation = msg.translatedText && msg.originalText && msg.translatedText !== msg.originalText;
          const displayBody = isOriginalShown ? msg.originalText : (autoTranslateEnabled ? msg.translatedText : msg.originalText);

          const msgMenuItems: DropdownMenuItem[] = [
            {
              id: "copy",
              label: "Copy text",
              icon: Copy,
              onClick: () => handleCopyText(msg),
            },
            ...(hasTranslation
              ? [
                  {
                    id: "toggle-reveal",
                    label: isOriginalShown ? "Show translated text" : "Show original source",
                    icon: Repeat,
                    onClick: () => toggleReveal(msg.id),
                  },
                ]
              : []),
            {
              id: "reply",
              label: "Reply",
              icon: Reply,
              onClick: () => {
                setReplyingTo(msg);
                textareaRef.current?.focus();
              },
            },
            {
              id: "delete",
              label: "Delete",
              icon: Trash2,
              destructive: true,
              onClick: () => handleDeleteMsg(msg.id),
            },
          ];

          return (
            <div
              key={msg.id}
              data-message-id={msg.id}
              data-sender-id={msg.senderId}
              className={`flex flex-col group/row ${isMe ? "items-end" : "items-start"}`}
            >
              <div className="flex items-center gap-1.5 max-w-[85%] sm:max-w-[70%]">
                {/* Message Bubble */}
                <div
                  onDoubleClick={() => hasTranslation && toggleReveal(msg.id)}
                  tabIndex={0}
                  role="button"
                  title="Double click/tap to toggle original text"
                  className={`relative rounded-2xl px-3 py-2 sm:px-3.5 sm:py-2.5 text-sm transition-all select-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring ${
                    isMe
                      ? isOriginalShown
                        ? "bg-primary/20 text-foreground border border-primary/35 rounded-br-xs shadow-xs"
                        : "bg-primary text-primary-foreground rounded-br-xs shadow-xs"
                      : isOriginalShown
                        ? "bg-secondary text-foreground border border-border rounded-bl-xs shadow-xs"
                        : "bg-card text-foreground border border-border/80 rounded-bl-xs shadow-xs"
                  }`}
                >
                  {/* Subtle Original tag if revealed */}
                  {isOriginalShown && (
                    <div className="text-[10px] font-mono font-semibold uppercase tracking-wider mb-1 opacity-75 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>Original • {msg.originalLang || "Source"}</span>
                    </div>
                  )}

                  {/* Message Text */}
                  <p className="leading-relaxed text-xs sm:text-sm whitespace-pre-wrap break-words">
                    {displayBody}
                  </p>

                  {/* Compact Bubble Footer */}
                  <div
                    className={`mt-1 flex items-center justify-end gap-1.5 text-[10px] ${
                      isMe && !isOriginalShown ? "text-primary-foreground/75" : "text-muted-foreground"
                    }`}
                  >
                    {/* Translation indicator tag */}
                    {hasTranslation && (
                      <span className="font-mono text-[9px] opacity-80">
                        {isOriginalShown ? "Original" : `Translated • ${msg.targetLangCode || "EN"}`}
                      </span>
                    )}

                    <span className="font-mono text-[9px]">
                      {formatMessageTime(msg.timestamp)}
                    </span>

                    {/* Delivery ticks - Only on sender's own outgoing messages */}
                    {isMe && (
                      <span title={msg.status} className="inline-flex items-center">
                        {msg.status === "read" ? (
                          <CheckCheck
                            className="w-3.5 h-3.5 transition-colors"
                            style={{ color: "var(--read-tick, #38bdf8)" }}
                          />
                        ) : msg.status === "delivered" ? (
                          <CheckCheck className="w-3.5 h-3.5 opacity-70" />
                        ) : msg.status === "failed" ? (
                          <AlertCircle className="w-3.5 h-3.5 text-destructive" />
                        ) : msg.status === "sending" ? (
                          <Clock className="w-3 h-3 opacity-60 animate-pulse" />
                        ) : (
                          <Check className="w-3.5 h-3.5 opacity-70" />
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {/* Hover Message Actions Dropdown */}
                <div className="opacity-0 group-hover/row:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
                  <DropdownMenu
                    trigger={
                      <button
                        type="button"
                        className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
                        title="Message actions"
                        aria-label="Message actions"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    }
                    items={msgMenuItems}
                    align={isMe ? "right" : "left"}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {/* Encrypting micro-state */}
        {isEncrypting && (
          <div className="flex flex-col items-end">
            <div className="px-3 py-1 rounded-xl bg-primary/15 border border-primary/25 text-[11px] text-foreground flex items-center gap-1.5 animate-pulse">
              <Sparkles className="w-3 h-3 text-primary" />
              <span>Translating &amp; encrypting...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Floating "New Message ↓" Pill */}
      <AnimatePresence>
        {showNewMsgPill && (
          <motion.button
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            onClick={() => scrollToBottom(true)}
            className="absolute bottom-16 right-4 z-20 px-3 py-1.5 rounded-full bg-primary text-primary-foreground font-semibold text-xs shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <span>Latest</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* 4. Replying-To Banner */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 py-2 bg-secondary/80 border-t border-border/80 flex items-center justify-between text-xs z-10 shrink-0"
          >
            <div className="border-l-3 border-primary pl-2.5 min-w-0">
              <div className="font-semibold text-primary text-[11px]">
                Replying to {replyingTo.senderId === "me" ? "yourself" : participant.displayName}
              </div>
              <div className="text-muted-foreground truncate text-xs">
                {replyingTo.translatedText || replyingTo.originalText}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="Cancel reply"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. Fixed Message Composer */}
      <div className="p-2.5 sm:p-3 bg-card border-t border-border/80 z-20 shrink-0 select-none pb-[max(0.65rem,env(safe-area-inset-bottom))]">
        <div className="flex items-end gap-1.5 sm:gap-2 max-w-4xl mx-auto">
          {/* Photo / Attachment trigger */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={() => {}}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer shrink-0"
            title="Share encrypted photo"
            aria-label="Add attachment"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Textarea Input */}
          <div className="flex-1 relative min-h-[38px] rounded-2xl bg-secondary/50 border border-border/80 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-ring transition-colors flex items-center px-3 py-1">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setTimeout(() => scrollToBottom(true), 150)}
              placeholder={`Message ${participant.displayName}...`}
              rows={1}
              className="w-full bg-transparent text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none leading-relaxed max-h-28"
            />
          </div>

          {/* Send Action */}
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!inputText.trim() || isEncrypting}
            className="h-9 w-9 p-0 rounded-xl shadow-xs shrink-0 cursor-pointer disabled:opacity-40"
            title="Send encrypted message"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>

      {/* Slide-in Chat Info Panel */}
      <AnimatePresence>
        {isInfoOpen && (
          <motion.div
            key="chat-info-panel-container"
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 350 }}
            className="fixed inset-0 md:static md:inset-auto z-40 md:z-20 h-full shrink-0 flex overflow-hidden"
          >
            <ChatInfoPanel
              thread={thread}
              onClose={() => setIsInfoOpen(false)}
              autoTranslateEnabled={autoTranslateEnabled}
              onToggleAutoTranslate={() => setAutoTranslateEnabled((prev) => !prev)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
