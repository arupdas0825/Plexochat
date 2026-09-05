"use client";

/**
 * Design Source: 21st.dev step-flow explainer card pattern
 * Full-width section with distinct background tint to break visual monotony
 */
import React from "react";
import { MessageSquare, Cpu, ShieldCheck, SendHorizontal, ArrowRight } from "lucide-react";

interface StepItem {
  number: string;
  title: string;
  tagline: string;
  description: string;
  icon: React.ElementType;
}

const STEPS: StepItem[] = [
  {
    number: "01",
    title: "Type Naturally",
    tagline: "No language picker needed",
    description: "Write in Bengali, Banglish, German, English, or mixed slang. PlexoChat automatically detects the nuances of your sentence.",
    icon: MessageSquare,
  },
  {
    number: "02",
    title: "Client Translation",
    tagline: "Translated on your device",
    description: "The semantic meaning is translated locally into the recipient's preferred receiving language before any data leaves your browser.",
    icon: Cpu,
  },
  {
    number: "03",
    title: "End-to-End Encrypted",
    tagline: "Locked with device keys",
    description: "Your browser encrypts the message payload using standard cryptographic protocols. Private keys never leave your machine.",
    icon: ShieldCheck,
  },
  {
    number: "04",
    title: "Ciphertext Delivered",
    tagline: "Zero plaintext on the server",
    description: "The backend acts strictly as an encrypted relay. The recipient decrypts locally and reads the conversation in their language.",
    icon: SendHorizontal,
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="w-full py-20 sm:py-28 bg-secondary/40 border-b border-border/60 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary mb-3 block">
            How It Works
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
            From your thoughts to their language in milliseconds.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground">
            No copy-pasting into external translators. Here is what happens every time you hit send.
          </p>
        </div>

        {/* 4-Step Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="relative flex flex-col p-6 sm:p-7 rounded-3xl bg-card border border-border/80 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 group"
              >
                {/* Step number badge */}
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-2xl font-black text-muted-foreground/30 font-mono">
                    {step.number}
                  </span>
                </div>

                <div className="text-xs font-semibold text-primary mb-1 uppercase tracking-wide">
                  {step.tagline}
                </div>

                <h3 className="text-xl font-bold text-foreground mb-3">
                  {step.title}
                </h3>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>

                {/* Arrow indicator between steps on desktop */}
                {idx < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground shadow-sm">
                    <ArrowRight className="w-3 h-3" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
