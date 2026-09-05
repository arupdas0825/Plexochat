"use client";

/**
 * Screen 4: Chat Box / Conversation View
 * Design Source: 21st.dev messaging chat stream & responsive composer
 * 
 * CORE PRODUCT RULES:
 * 1. Default bubble state = TRANSLATED text for both sender and receiver.
 * 2. Double-click/double-tap to toggle original text.
 * 3. Accessible non-gesture "View original" control on every translated bubble.
 * 4. Micro-state showing client encryption on send.
 */
import React, { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Lock,
  Send,
  Plus,
  Smile,
  Sparkles,
  Repeat,
  Eye,
  CheckCheck,
  Check,
  MoreVertical,
  Camera,
  Globe2,
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

export function ConversationView({
  thread,
  onBack,
  onSendMessage,
}: ConversationViewProps) {
  const [inputText, setInputText] = useState("");
  const [revealedMessages, setRevealedMessages] = useState<Record<string, boolean>>({});
  const [isEncrypting, setIsEncrypting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const participant = thread.participant;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread.messages]);

  const toggleReveal = (msgId: string) => {
    setRevealedMessages((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setIsEncrypting(true);
    const textToSend = inputText;
    setInputText("");

    // Simulate client-side translation + encryption micro-state
    setTimeout(() => {
      onSendMessage(thread.id, textToSend);
      setIsEncrypting(false);
    }, 400);
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-background relative">
      
      {/* Conversation Header */}
      <div className="h-16 px-4 border-b border-border bg-card/80 backdrop-blur-md flex items-center justify-between z-10">
        
        <div className="flex items-center gap-3">
          {/* Back button on mobile */}
          <button
            type="button"
            onClick={onBack}
            className="md:hidden p-1.5 -ml-1 text-muted-foreground hover:text-foreground rounded-lg"
            aria-label="Back to chat list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Recipient Avatar */}
          <div className="relative">
            <div
              className={`w-10 h-10 rounded-full bg-gradient-to-br ${participant.avatarBg} text-white font-bold text-sm flex items-center justify-center shadow-sm`}
            >
              {participant.displayName.substring(0, 2).toUpperCase()}
            </div>
            {participant.online && (
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-card" />
            )}
          </div>

          {/* Participant Information */}
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-foreground">
                {participant.displayName}
              </span>
              <Badge variant="accent" className="text-[10px] py-0 px-1.5 font-normal">
                Receives: {participant.preferredLanguage}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Lock className="w-3 h-3 text-emerald-500" />
              <span>End-to-End Encrypted Session</span>
            </div>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary text-[11px] text-muted-foreground font-mono">
            <Globe2 className="w-3 h-3 text-primary" />
            <span>Auto-Translating to {participant.languageCode}</span>
          </div>

          <button
            type="button"
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary"
            title="Conversation settings"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-mesh-gradient">
        
        {/* Encryption banner callout */}
        <div className="w-full max-w-sm mx-auto p-2.5 rounded-2xl bg-secondary/70 border border-border/60 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
          <Lock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>Messages are end-to-end encrypted with device keys.</span>
        </div>

        {thread.messages.map((msg) => {
          const isMe = msg.senderId === "me";
          const isOriginalShown = !!revealedMessages[msg.id];

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
            >
              <div className="text-[11px] text-muted-foreground mb-1 px-1">
                {isMe ? "You" : participant.displayName}
              </div>

              {/* Message Bubble with Double Click / Double Tap Toggle */}
              <div
                onDoubleClick={() => toggleReveal(msg.id)}
                tabIndex={0}
                role="button"
                aria-label={`${isOriginalShown ? "Original" : "Translated"} message. Double click to toggle.`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleReveal(msg.id);
                  }
                }}
                className={`group max-w-[85%] sm:max-w-[70%] rounded-2xl p-3.5 text-sm transition-all duration-150 select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring ${
                  isMe
                    ? isOriginalShown
                      ? "bg-primary/20 text-foreground border border-primary/40 rounded-br-sm shadow-sm"
                      : "bg-primary text-primary-foreground rounded-br-sm shadow-md shadow-primary/20"
                    : isOriginalShown
                      ? "bg-secondary text-foreground border border-border rounded-bl-sm"
                      : "bg-card text-foreground border border-border/80 rounded-bl-sm shadow-sm"
                }`}
              >
                {/* Original mode visual cue */}
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
                <p className="leading-relaxed">
                  {isOriginalShown ? msg.originalText : msg.translatedText}
                </p>

                {/* Footer with timestamp, translation indicator & accessible toggle button */}
                <div
                  className={`mt-2 pt-1.5 flex items-center justify-between gap-3 text-[10px] border-t ${
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

                  <div className="flex items-center gap-2">
                    {/* Accessible non-gesture toggle button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleReveal(msg.id);
                      }}
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                        isMe && !isOriginalShown
                          ? "bg-white/15 hover:bg-white/25 text-white"
                          : "bg-secondary hover:bg-secondary/80 text-foreground border border-border/50"
                      }`}
                      title={isOriginalShown ? "Show translated version" : "View original source text"}
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

        {isEncrypting && (
          <div className="flex flex-col items-end">
            <div className="px-3.5 py-2 rounded-2xl bg-primary/30 text-xs text-foreground flex items-center gap-2 border border-primary/40 animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Translating & encrypting locally...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Composer Bottom Area */}
      <div className="p-3 sm:p-4 border-t border-border bg-card/90 backdrop-blur-md">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          
          {/* Photo attach button */}
          <button
            type="button"
            onClick={() => alert("Photo encryption: Selected photos are encrypted with AES-GCM client-side before relay.")}
            className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Attach photo (encrypted)"
          >
            <Camera className="w-5 h-5" />
          </button>

          {/* Auto-expanding Input Field */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Write in your language — ${participant.displayName} will read in ${participant.preferredLanguage}...`}
              className="w-full h-11 px-4 rounded-xl border border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Emoji button */}
          <button
            type="button"
            onClick={() => setInputText((prev) => prev + " 😊")}
            className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Insert emoji"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Send Button */}
          <Button
            type="submit"
            disabled={!inputText.trim() || isEncrypting}
            size="icon"
            className="h-11 w-11 rounded-xl shadow-md shadow-primary/20 shrink-0"
            title="Send encrypted message"
          >
            <Send className="w-4 h-4" />
          </Button>

        </form>
      </div>

    </div>
  );
}
