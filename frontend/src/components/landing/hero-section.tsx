"use client";

/**
 * Design Source: 21st.dev split-hero SaaS marketing pattern
 * Features:
 * - Full-bleed width with ambient background glow
 * - Asymmetrical desktop split: left copy + CTAs, right large interactive chat demo
 * - Tactile micro-interactions and instant translation reveal
 */
import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Lock,
  Repeat,
  Eye,
  CheckCircle2,
  Globe2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function HeroSection() {
  // State for interactive demo card in the hero
  const [showOriginalA, setShowOriginalA] = useState(false);
  const [showOriginalB, setShowOriginalB] = useState(false);

  return (
    <section className="relative w-full overflow-hidden bg-background pt-28 pb-20 sm:pt-36 sm:pb-28 lg:pt-40 lg:pb-36 border-b border-border/40">
      {/* Ambient background glow & blurred mesh blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[900px] h-[450px] bg-gradient-to-tr from-primary/15 via-indigo-500/10 to-violet-500/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 -right-20 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Asymmetrical 2-Column Split on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* LEFT COLUMN: Value Proposition & CTAs (lg:col-span-7) */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            
            {/* Trust Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-6 shadow-sm">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>Private Multilingual Messenger • End-to-End Encrypted</span>
            </div>

            {/* High-Impact Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.12]">
              Speak your language.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-500 to-violet-600">
                They’ll hear theirs.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="mt-6 text-base sm:text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-2xl font-normal">
              PlexoChat automatically translates conversations into each person’s preferred language in real time. Write naturally, mix scripts, use slang — with client-side end-to-end encryption that keeps your words private.
            </p>

            {/* Dual CTAs */}
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto text-base px-8 h-13 gap-2.5 shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all">
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-base px-7 h-13 border-border/80 hover:bg-secondary">
                  See how it works
                </Button>
              </a>
            </div>

            {/* Honest Trust Signals & Architecture Highlights */}
            <div className="mt-10 pt-8 border-t border-border/60 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-muted-foreground w-full">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Client-side translation</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Zero plaintext relay</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>No phone number required</span>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Interactive Live Chat Translation Demo Card (lg:col-span-5) */}
          <div className="lg:col-span-5 relative w-full flex justify-center lg:justify-end">
            
            {/* Soft decorative glow behind the card */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-violet-500/20 rounded-3xl blur-2xl -z-10" />

            {/* Chat Mockup Card Container */}
            <div className="w-full max-w-lg rounded-3xl border border-border/80 bg-card/90 backdrop-blur-2xl shadow-2xl shadow-primary/10 overflow-hidden ring-1 ring-white/10">
              
              {/* Messenger Header */}
              <div className="px-5 py-4 border-b border-border/60 bg-secondary/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                      GR
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-card" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">Greta</span>
                      <Badge variant="accent" className="text-[10px] py-0 px-1.5 h-4">
                        German
                      </Badge>
                    </div>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Lock className="w-3 h-3 text-emerald-500" />
                      <span>E2EE Active Session</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-background/80 px-2.5 py-1 rounded-full border border-border/50">
                  <Globe2 className="w-3.5 h-3.5 text-primary" />
                  <span>DE ⇄ EN</span>
                </div>
              </div>

              {/* Message Stream */}
              <div className="p-5 space-y-4 bg-card/40">
                
                {/* Message 1: Sent by User (Banglish -> German) */}
                <div className="flex flex-col items-end">
                  <div className="text-[11px] text-muted-foreground mb-1 px-1">
                    You (Bengali / Banglish input)
                  </div>
                  <div
                    onDoubleClick={() => setShowOriginalA(!showOriginalA)}
                    className={`group max-w-[90%] rounded-2xl p-3.5 text-sm transition-all duration-200 cursor-pointer select-none ${
                      showOriginalA
                        ? "bg-primary/20 text-foreground border border-primary/40 rounded-br-sm shadow-sm"
                        : "bg-primary text-primary-foreground rounded-br-sm shadow-md shadow-primary/20"
                    }`}
                  >
                    <AnimatePresence mode="wait">
                      {showOriginalA && (
                        <motion.div
                          key="orig-tag"
                          initial={{ opacity: 0, y: -3 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-primary dark:text-primary-foreground mb-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Original Input</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <p className="leading-relaxed">
                      {showOriginalA
                        ? "Ami ajke আসতে parbo na because amar class ache."
                        : "Ich kann heute nicht kommen, weil ich Unterricht habe."}
                    </p>

                    <div className={`mt-2 pt-1.5 flex items-center justify-between gap-3 text-[10px] border-t ${
                      showOriginalA ? "border-primary/20 text-muted-foreground" : "border-white/20 text-white/80"
                    }`}>
                      <div className="flex items-center gap-1 font-mono">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>{showOriginalA ? "Banglish" : "Translated • DE"}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowOriginalA(!showOriginalA);
                        }}
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                          showOriginalA
                            ? "bg-background hover:bg-secondary text-foreground border border-border/60"
                            : "bg-white/15 hover:bg-white/25 text-white"
                        }`}
                      >
                        <Repeat className="w-2.5 h-2.5" />
                        <span>{showOriginalA ? "Show Translated" : "View Original"}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Message 2: Greta replies in German (German -> English) */}
                <div className="flex flex-col items-start">
                  <div className="text-[11px] text-muted-foreground mb-1 px-1">
                    Greta (Typed in German)
                  </div>
                  <div
                    onDoubleClick={() => setShowOriginalB(!showOriginalB)}
                    className={`group max-w-[90%] rounded-2xl p-3.5 text-sm transition-all duration-200 cursor-pointer select-none ${
                      showOriginalB
                        ? "bg-secondary text-foreground border border-border rounded-bl-sm"
                        : "bg-secondary/90 text-secondary-foreground border border-border/50 rounded-bl-sm"
                    }`}
                  >
                    <AnimatePresence mode="wait">
                      {showOriginalB && (
                        <motion.div
                          key="orig-b"
                          initial={{ opacity: 0, y: -3 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Original German</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <p className="leading-relaxed">
                      {showOriginalB
                        ? "Alles klar, kein Problem! Melde dich einfach wenn du Zeit hast."
                        : "All good, no problem at all! Just reach out whenever you have time."}
                    </p>

                    <div className="mt-2 pt-1.5 flex items-center justify-between gap-3 text-[10px] border-t border-border/50 text-muted-foreground">
                      <div className="flex items-center gap-1 font-mono">
                        <Sparkles className="w-2.5 h-2.5 text-primary" />
                        <span>{showOriginalB ? "Source • DE" : "Translated • EN"}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowOriginalB(!showOriginalB);
                        }}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-background hover:bg-secondary text-foreground border border-border/50 transition-colors"
                      >
                        <Repeat className="w-2.5 h-2.5" />
                        <span>{showOriginalB ? "Show Translated" : "View Original"}</span>
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              {/* Card Footer: Interactive cue */}
              <div className="px-5 py-3 bg-secondary/60 border-t border-border/60 text-center text-[11px] text-muted-foreground flex items-center justify-center gap-2">
                <Badge variant="accent" className="text-[10px] py-0 px-2 font-mono">
                  Double Click
                </Badge>
                <span>Click &quot;View Original&quot; above to toggle source text</span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
