"use client";

/**
 * Screen 4: Chat Box / Conversation View (WhatsApp/Messenger-grade Mobile Polish)
 * 
 * CORE PRODUCT RULES:
 * 1. Default bubble state = TRANSLATED text for both sender and receiver.
 * 2. Double-click/double-tap to toggle original text.
 * 3. Accessible non-gesture "View original" control on every translated bubble.
 * 4. Micro-state showing client encryption on send.
 * 
 * MOBILE INTERACTION FEATURES:
 * - VisualViewport API integration for rock-solid on-screen keyboard positioning.
 * - Auto-expanding textarea with >=16px font (eliminates iOS Safari auto-zoom).
 * - Left-edge swipe-back gesture to pop screen back to chat list.
 * - Long-press mobile context bottom sheet (Original toggle, Copy, Reply, Delete).
 * - Sticky date separator pill.
 * - Floating "New message ↓" pill when scrolled up.
 * - Full-screen photo viewer / lightbox with dismiss.
 * - Replying-to quote banner above composer.
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Lock,
  Send,
  Smile,
  Sparkles,
  Repeat,
  Eye,
  CheckCheck,
  Check,
  MoreVertical,
  Camera,
  Globe2,
  ChevronDown,
  Copy,
  Reply,
  Trash2,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChatThread, ChatMessage } from "@/lib/mock-chat-data";

interface ConversationViewProps {
  thread: ChatThread;
  onBack: () => void;
  onSendMessage: (threadId: string, text: string) => void;
}

// 1. VisualViewport Hook for keyboard tracking
function useVisualViewport() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;

    const updateKeyboard = () => {
      if (!window.visualViewport) return;
      // Calculate how much height is taken up by the virtual keyboard
      const currentHeight = window.visualViewport.height;
      const windowHeight = window.innerHeight;
      const diff = windowHeight - currentHeight;

      if (diff > 100) {
        setKeyboardHeight(diff);
      } else {
        setKeyboardHeight(0);
      }
    };

    window.visualViewport.addEventListener("resize", updateKeyboard);
    window.visualViewport.addEventListener("scroll", updateKeyboard);
    return () => {
      window.visualViewport?.removeEventListener("resize", updateKeyboard);
      window.visualViewport?.removeEventListener("scroll", updateKeyboard);
    };
  }, []);

  return keyboardHeight;
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
  const [activeContextMenuMsg, setActiveContextMenuMsg] = useState<ChatMessage | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [extraMessages, setExtraMessages] = useState<ChatMessage[]>([]);
  const [deletedMsgIds, setDeletedMsgIds] = useState<Record<string, boolean>>({});

  const allMessages = React.useMemo(() => {
    return [...thread.messages, ...extraMessages].filter((m) => !deletedMsgIds[m.id]);
  }, [thread.messages, extraMessages, deletedMsgIds]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const keyboardHeight = useVisualViewport();
  const participant = thread.participant;

  // Track scroll position for "New message ↓" pill
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [showNewMsgPill, setShowNewMsgPill] = useState(false);
  const prevMsgCountRef = useRef(allMessages.length);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distFromBottom = scrollHeight - scrollTop - clientHeight;
    const scrolledUp = distFromBottom > 160;
    setIsScrolledUp(scrolledUp);
    if (!scrolledUp) {
      setShowNewMsgPill(false);
    }
  };

  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
      setShowNewMsgPill(false);
    }
  }, []);

  // Auto-scroll on initial load or new message
  useEffect(() => {
    if (allMessages.length > prevMsgCountRef.current) {
      if (isScrolledUp) {
        const timer = setTimeout(() => setShowNewMsgPill(true), 0);
        return () => clearTimeout(timer);
      } else {
        scrollToBottom(true);
      }
    }
    prevMsgCountRef.current = allMessages.length;
  }, [allMessages.length, isScrolledUp, scrollToBottom]);

  // When keyboard opens, scroll to bottom
  useEffect(() => {
    if (keyboardHeight > 0) {
      const timer = setTimeout(() => {
        scrollToBottom(true);
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [keyboardHeight, scrollToBottom]);

  // 2. Left-Edge Swipe Back Gesture
  const [swipeOffset, setSwipeOffset] = useState(0);
  const touchStartRef = useRef<{ x: number; y: number; isEdge: boolean }>({
    x: 0,
    y: 0,
    isEdge: false,
  });

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const isEdge = touch.clientX <= 35;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, isEdge };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current.isEdge) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = Math.abs(touch.clientY - touchStartRef.current.y);

    if (dy > dx && dx < 20) {
      touchStartRef.current.isEdge = false;
      setSwipeOffset(0);
      return;
    }

    if (dx > 0) {
      setSwipeOffset(Math.min(dx, 200));
    }
  };

  const handleTouchEnd = () => {
    if (touchStartRef.current.isEdge && swipeOffset > 85) {
      onBack();
    }
    setSwipeOffset(0);
    touchStartRef.current.isEdge = false;
  };

  // 3. Long-press on message bubble for mobile bottom sheet
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startLongPress = (msg: ChatMessage) => {
    longPressTimerRef.current = setTimeout(() => {
      setActiveContextMenuMsg(msg);
      if (typeof window !== "undefined" && window.navigator?.vibrate) {
        window.navigator.vibrate(30);
      }
    }, 450);
  };

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  };

  const toggleReveal = (msgId: string) => {
    setRevealedMessages((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  // 4. Auto-expanding Textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 130)}px`;
    }
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    setIsEncrypting(true);
    const textToSend = inputText;
    setInputText("");
    setReplyingTo(null);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    // Simulate client-side translation + encryption
    setTimeout(() => {
      onSendMessage(thread.id, textToSend);
      setIsEncrypting(false);
      scrollToBottom(true);
    }, 350);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Copy text to clipboard
  const handleCopyText = (msg: ChatMessage) => {
    const isOriginalShown = !!revealedMessages[msg.id];
    const text = isOriginalShown ? msg.originalText : msg.translatedText;
    navigator.clipboard?.writeText(text);
    setActiveContextMenuMsg(null);
  };

  // Delete message
  const handleDeleteMsg = (msgId: string) => {
    setDeletedMsgIds((prev) => ({ ...prev, [msgId]: true }));
    setActiveContextMenuMsg(null);
  };

  // Photo upload simulation
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const imageUrl = reader.result as string;
      const photoMessage: ChatMessage = {
        id: `photo-${Date.now()}`,
        senderId: "me",
        senderName: "You",
        originalText: "📷 [Photo Attachment]",
        originalLang: "Auto",
        translatedText: "📷 [Photo Attachment]",
        targetLangCode: participant.languageCode || "EN",
        timestamp: "Just now",
        status: "sent",
        isPhoto: true,
        photoUrl: imageUrl,
      };
      setExtraMessages((prev) => [...prev, photoMessage]);
      setLightboxImage(imageUrl);
      scrollToBottom(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: swipeOffset > 0 ? `translateX(${swipeOffset}px)` : undefined,
        transition: swipeOffset === 0 ? "transform 0.2s cubic-bezier(0.32, 0.72, 0, 1)" : "none",
      }}
      className="flex-1 h-full flex flex-col bg-background relative overflow-hidden"
    >
      {/* 1. Header with Safe Area Top Clearance */}
      <header className="h-16 px-4 border-b border-border bg-card/90 backdrop-blur-md flex items-center justify-between z-10 shrink-0 pt-[max(0rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Back button with touch manipulation */}
          <button
            type="button"
            onClick={onBack}
            className="md:hidden p-2 -ml-1 text-muted-foreground hover:text-foreground rounded-xl active:bg-secondary touch-manipulation transition-colors"
            aria-label="Back to chat list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Recipient Avatar */}
          <div className="relative shrink-0">
            <div
              className={`w-10 h-10 rounded-full bg-gradient-to-br ${participant.avatarBg} text-white font-bold text-sm flex items-center justify-center shadow-sm`}
            >
              {participant.displayName.substring(0, 2).toUpperCase()}
            </div>
            {participant.online && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
            )}
          </div>

          {/* Participant Details */}
          <div className="flex flex-col text-left min-w-0">
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-bold text-sm text-foreground truncate">
                {participant.displayName}
              </span>
              <Badge variant="accent" className="text-[10px] py-0 px-1.5 font-normal shrink-0">
                {participant.preferredLanguage}
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
              <Lock className="w-3 h-3 text-emerald-500 shrink-0" />
              <span className="truncate">E2EE • Translating {participant.languageCode}</span>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary text-[11px] text-muted-foreground font-mono">
            <Globe2 className="w-3 h-3 text-primary" />
            <span>Auto-Translate</span>
          </div>

          <button
            type="button"
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary active:scale-95 transition-all touch-manipulation"
            title="Conversation settings"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. Messages Momentum Scroll Area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto momentum-scroll p-3.5 sm:p-6 space-y-3 bg-mesh-gradient relative"
      >
        {/* Sticky Date Pill Header */}
        <div className="sticky top-1 z-10 flex justify-center pointer-events-none my-1">
          <span className="px-3 py-1 rounded-full bg-secondary/90 backdrop-blur-md border border-border/60 text-[10px] font-medium text-muted-foreground shadow-sm">
            Today • End-to-End Encrypted
          </span>
        </div>

        {/* Encryption Banner */}
        <div className="w-full max-w-xs mx-auto p-2 rounded-2xl bg-secondary/60 border border-border/50 text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
          <Lock className="w-3 h-3 text-emerald-500 shrink-0" />
          <span>Device keys active. Only you &amp; {participant.displayName} can read.</span>
        </div>

        {allMessages.map((msg) => {
          const isMe = msg.senderId === "me";
          const isOriginalShown = !!revealedMessages[msg.id];

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
            >
              <div className="text-[10px] text-muted-foreground mb-0.5 px-1 font-mono">
                {isMe ? "You" : participant.displayName}
              </div>

              {/* Message Bubble with Long-Press and Double-Tap Toggle */}
              <div
                onDoubleClick={() => toggleReveal(msg.id)}
                onTouchStart={() => startLongPress(msg)}
                onTouchEnd={cancelLongPress}
                onTouchMove={cancelLongPress}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setActiveContextMenuMsg(msg);
                }}
                tabIndex={0}
                role="button"
                aria-label={`${isOriginalShown ? "Original" : "Translated"} message. Double tap to toggle.`}
                className={`group max-w-[85%] sm:max-w-[70%] rounded-2xl p-3 text-sm transition-all duration-150 select-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring touch-manipulation active:scale-[0.99] ${
                  isMe
                    ? isOriginalShown
                      ? "bg-primary/20 text-foreground border border-primary/40 rounded-br-sm shadow-sm"
                      : "bg-primary text-primary-foreground rounded-br-sm shadow-md shadow-primary/20"
                    : isOriginalShown
                      ? "bg-secondary text-foreground border border-border rounded-bl-sm"
                      : "bg-card text-foreground border border-border/80 rounded-bl-sm shadow-sm"
                }`}
              >
                {/* Original mode indicator */}
                <AnimatePresence mode="wait">
                  {isOriginalShown && (
                    <motion.div
                      key="badge"
                      initial={{ opacity: 0, y: -2 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider mb-1 ${
                        isMe ? "text-primary dark:text-primary-foreground" : "text-muted-foreground"
                      }`}
                    >
                      <Eye className="w-3 h-3" />
                      <span>Original Text ({msg.originalLang})</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Message Text */}
                <p className="leading-relaxed text-[14px] sm:text-sm whitespace-pre-wrap break-words">
                  {isOriginalShown ? msg.originalText : msg.translatedText}
                </p>

                {/* Bubble Footer */}
                <div
                  className={`mt-1.5 pt-1.5 flex items-center justify-between gap-2.5 text-[10px] border-t ${
                    isMe && !isOriginalShown
                      ? "border-white/20 text-white/80"
                      : "border-border/50 text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-1 font-mono">
                    {isOriginalShown ? (
                      <span>Source: {msg.originalLang}</span>
                    ) : (
                      <>
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>Translated • {msg.targetLangCode}</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Accessible toggle button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleReveal(msg.id);
                      }}
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors touch-manipulation ${
                        isMe && !isOriginalShown
                          ? "bg-white/15 hover:bg-white/25 text-white"
                          : "bg-secondary hover:bg-secondary/80 text-foreground border border-border/50"
                      }`}
                      title={isOriginalShown ? "Show translation" : "View original source"}
                    >
                      <Repeat className="w-2.5 h-2.5" />
                      <span>{isOriginalShown ? "Translation" : "Original"}</span>
                    </button>

                    {/* Delivery ticks */}
                    {isMe && (
                      <span title={msg.status}>
                        {msg.status === "read" ? (
                          <CheckCheck className="w-3.5 h-3.5 text-sky-400" />
                        ) : (
                          <Check className="w-3.5 h-3.5 opacity-80" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Local encryption animation */}
        {isEncrypting && (
          <div className="flex flex-col items-end">
            <div className="px-3 py-1.5 rounded-2xl bg-primary/20 text-xs text-foreground flex items-center gap-2 border border-primary/30 animate-pulse">
              <Sparkles className="w-3 h-3 text-primary" />
              <span>Translating &amp; encrypting locally...</span>
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
            className="absolute bottom-20 right-4 z-20 px-3 py-1.5 rounded-full bg-primary text-primary-foreground font-semibold text-xs shadow-lg flex items-center gap-1.5 active:scale-95 touch-manipulation"
          >
            <span>New message</span>
            <ChevronDown className="w-4 h-4 animate-bounce" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* 4. Replying-To Quote Banner (WhatsApp/Messenger Style) */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 py-2 bg-secondary/80 border-t border-border flex items-center justify-between text-xs z-10 shrink-0"
          >
            <div className="border-l-4 border-primary pl-2.5 min-w-0">
              <div className="font-semibold text-primary">
                Replying to {replyingTo.senderId === "me" ? "yourself" : participant.displayName}
              </div>
              <div className="text-muted-foreground truncate text-[11px]">
                {replyingTo.translatedText}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="p-1 text-muted-foreground hover:text-foreground touch-manipulation"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. Message Composer with VisualViewport Keyboard Pinning & Safe Area */}
      <div
        style={{
          // When keyboard is open, offset bottom; otherwise respect safe area
          marginBottom: keyboardHeight > 0 ? `${keyboardHeight}px` : undefined,
          transition: "margin-bottom 0.15s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
        className="p-2.5 sm:p-4 border-t border-border bg-card/95 backdrop-blur-md z-10 shrink-0 pb-[max(0.6rem,env(safe-area-inset-bottom))]"
      >
        <form onSubmit={handleSend} className="flex items-end gap-2">
          {/* Photo Attach Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary active:scale-95 transition-all touch-manipulation shrink-0 mb-0.5"
            title="Attach photo (E2EE)"
          >
            <Camera className="w-5 h-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />

          {/* Auto-expanding Textarea (Font >= 16px to prevent iOS auto-zoom) */}
          <div className="flex-1 min-w-0 relative">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputText}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={`Message (${participant.displayName} receives in ${participant.preferredLanguage})...`}
              className="w-full min-h-[42px] max-h-[130px] py-2.5 px-3.5 rounded-2xl border border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground text-[16px] sm:text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Emoji button */}
          <button
            type="button"
            onClick={() => setInputText((prev) => prev + " 😊")}
            className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary active:scale-95 transition-all touch-manipulation shrink-0 mb-0.5"
            title="Insert emoji"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Send Button */}
          <Button
            type="submit"
            disabled={!inputText.trim() || isEncrypting}
            size="icon"
            className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl shadow-md shadow-primary/20 shrink-0 active:scale-95 touch-manipulation mb-0.5"
            title="Send encrypted message"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>

      {/* 6. Long-Press Mobile Context Menu Bottom Sheet */}
      <AnimatePresence>
        {activeContextMenuMsg && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 350 }}
              className="w-full sm:max-w-sm bg-card border border-border rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
            >
              {/* Drag Handle on Mobile */}
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto -mt-1 sm:hidden" />

              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <span className="text-xs font-semibold text-muted-foreground">Message Actions</span>
                <button
                  onClick={() => setActiveContextMenuMsg(null)}
                  className="p-1 rounded-full hover:bg-secondary text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Message preview snippet */}
              <div className="p-2.5 rounded-xl bg-secondary/50 text-xs text-muted-foreground truncate border border-border/40">
                &quot;{activeContextMenuMsg.translatedText}&quot;
              </div>

              <div className="grid grid-cols-1 gap-1.5">
                {/* Toggle Original */}
                <button
                  type="button"
                  onClick={() => {
                    toggleReveal(activeContextMenuMsg.id);
                    setActiveContextMenuMsg(null);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium flex items-center gap-3 hover:bg-secondary transition-colors text-foreground text-left"
                >
                  <Repeat className="w-4 h-4 text-primary" />
                  <span>
                    {revealedMessages[activeContextMenuMsg.id]
                      ? "Show Translated Version"
                      : "View Original Text"}
                  </span>
                </button>

                {/* Copy Text */}
                <button
                  type="button"
                  onClick={() => handleCopyText(activeContextMenuMsg)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium flex items-center gap-3 hover:bg-secondary transition-colors text-foreground text-left"
                >
                  <Copy className="w-4 h-4 text-emerald-500" />
                  <span>Copy Message Text</span>
                </button>

                {/* Reply */}
                <button
                  type="button"
                  onClick={() => {
                    setReplyingTo(activeContextMenuMsg);
                    setActiveContextMenuMsg(null);
                    textareaRef.current?.focus();
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium flex items-center gap-3 hover:bg-secondary transition-colors text-foreground text-left"
                >
                  <Reply className="w-4 h-4 text-sky-500" />
                  <span>Reply</span>
                </button>

                {/* Delete (only for own messages) */}
                {activeContextMenuMsg.senderId === "me" && (
                  <button
                    type="button"
                    onClick={() => handleDeleteMsg(activeContextMenuMsg.id)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium flex items-center gap-3 hover:bg-destructive/10 transition-colors text-destructive text-left"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete for me</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. Full-Screen Photo Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4"
          >
            <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white touch-manipulation"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxImage}
              alt="Photo preview"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
            />

            <div className="mt-4 text-xs text-white/70 flex items-center gap-1.5 font-mono">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Encrypted with AES-256-GCM Session Key</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
