"use client";

/**
 * Design Source: 21st.dev interactive chat preview card & script-morphing motif
 * Demonstrates natural multilingual conversation (Banglish -> German translation)
 * Allows users to preview the double-click / accessible reveal feature directly.
 */
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Eye, Repeat } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DemoMessage {
  id: string;
  sender: "user" | "peer";
  senderName: string;
  originalText: string;
  translatedText: string;
  originalLang: string;
  targetLang: string;
  targetLangCode: string;
}

const DEMO_CONVERSATION: DemoMessage[] = [
  {
    id: "msg-1",
    sender: "user",
    senderName: "You",
    originalText: "Ami ajke আসতে parbo na because amar class ache.",
    translatedText: "Ich kann heute nicht kommen, weil ich Unterricht habe.",
    originalLang: "Banglish / বাংলা",
    targetLang: "German",
    targetLangCode: "DE",
  },
  {
    id: "msg-2",
    sender: "peer",
    senderName: "Greta",
    originalText: "Alles klar, kein Problem! Melde dich einfach später.",
    translatedText: "All good, no worries! Just ping me whenever you're free.",
    originalLang: "German",
    targetLang: "English",
    targetLangCode: "EN",
  },
];

export function MultilingualHeroMotif() {
  // Store toggled state per message (whether showing original or translated)
  const [revealedOriginals, setRevealedOriginals] = useState<Record<string, boolean>>({});

  const toggleReveal = (id: string) => {
    setRevealedOriginals((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="w-full max-w-md mx-auto my-6">
      {/* Container card with subtle border glow and 21st.dev glass styling */}
      <div className="relative rounded-3xl border border-border/80 bg-card/70 backdrop-blur-xl p-4 sm:p-5 shadow-xl shadow-primary/5 dark:shadow-black/40 overflow-hidden">
        {/* Subtle decorative mesh gradient behind bubbles */}
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header indicator explaining the live translation preview */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/50 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Live Translation Demo</span>
          </div>
          <span className="text-[10px] text-muted-foreground/80">
            Double-tap or click &quot;Original&quot; to toggle
          </span>
        </div>

        {/* Message stream */}
        <div className="space-y-3.5">
          {DEMO_CONVERSATION.map((msg) => {
            const isOriginalShown = !!revealedOriginals[msg.id];
            const isUser = msg.sender === "user";

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
              >
                {/* Sender label & indicator */}
                <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-muted-foreground">
                  <span className="font-medium text-foreground/80">{msg.senderName}</span>
                  <span>•</span>
                  <span>{isUser ? `Typed in ${msg.originalLang}` : `Speaks ${msg.originalLang}`}</span>
                </div>

                {/* Message Bubble */}
                <div
                  onDoubleClick={() => toggleReveal(msg.id)}
                  tabIndex={0}
                  role="button"
                  aria-label={`${isOriginalShown ? "Original" : "Translated"} message from ${msg.senderName}. Double click or press enter to toggle.`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleReveal(msg.id);
                    }
                  }}
                  className={`group relative max-w-[90%] sm:max-w-[85%] rounded-2xl p-3 sm:p-3.5 text-sm transition-all duration-200 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    isUser
                      ? isOriginalShown
                        ? "bg-primary/20 text-foreground border border-primary/40 rounded-br-sm shadow-sm"
                        : "bg-primary text-primary-foreground rounded-br-sm shadow-md shadow-primary/20"
                      : isOriginalShown
                        ? "bg-secondary text-foreground border border-border/80 rounded-bl-sm"
                        : "bg-secondary/90 text-secondary-foreground border border-border/40 rounded-bl-sm"
                  }`}
                >
                  {/* Status header inside bubble when in original mode */}
                  <AnimatePresence mode="wait">
                    {isOriginalShown ? (
                      <motion.div
                        key="original-badge"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="flex items-center gap-1 text-[10px] font-semibold tracking-wide uppercase opacity-75 mb-1 text-primary dark:text-primary-foreground"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Original Text ({msg.originalLang})</span>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  {/* Bubble text with smooth crossfade */}
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={isOriginalShown ? "orig" : "trans"}
                      initial={{ opacity: 0, y: 2 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -2 }}
                      transition={{ duration: 0.15 }}
                      className="leading-relaxed font-normal"
                    >
                      {isOriginalShown ? msg.originalText : msg.translatedText}
                    </motion.p>
                  </AnimatePresence>

                  {/* Translation pill footer */}
                  <div
                    className={`mt-2 pt-1.5 flex items-center justify-between gap-3 text-[10px] border-t ${
                      isUser && !isOriginalShown
                        ? "border-white/20 text-white/80"
                        : "border-border/50 text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-mono">
                      {isOriginalShown ? (
                        <span>Source: {msg.originalLang}</span>
                      ) : (
                        <>
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>Translated • {msg.targetLangCode}</span>
                        </>
                      )}
                    </div>

                    {/* Accessible fallback toggle button (non-gesture path) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleReveal(msg.id);
                      }}
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                        isUser && !isOriginalShown
                          ? "bg-white/15 hover:bg-white/25 text-white"
                          : "bg-background hover:bg-secondary text-foreground border border-border/50"
                      }`}
                      title={isOriginalShown ? "Show translated version" : "View original source text"}
                      aria-label={isOriginalShown ? "Switch to translated version" : "View original source text"}
                    >
                      <Repeat className="w-2.5 h-2.5" />
                      <span>{isOriginalShown ? "Show Translated" : "View Original"}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Interactive hint callout */}
        <div className="mt-4 pt-3 border-t border-border/40 text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
          <Badge variant="accent" className="text-[10px] py-0 px-2">
            PlexoChat Rule
          </Badge>
          <span>Both sender and recipient see the translated message by default.</span>
        </div>
      </div>
    </div>
  );
}
