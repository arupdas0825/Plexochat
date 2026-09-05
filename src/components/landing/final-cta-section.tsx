"use client";

/**
 * Design Source: 21st.dev high-conversion final CTA band pattern
 * Full-width section with ambient glow and focused call-to-action
 */
import React from "react";
import Link from "next/link";
import { ArrowRight, UserPlus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FinalCtaSection() {
  return (
    <section className="relative w-full py-24 sm:py-32 bg-secondary/30 overflow-hidden border-b border-border/40">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-r from-primary/15 via-indigo-500/20 to-purple-500/15 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-6">
          <ShieldCheck className="w-4 h-4" />
          <span>Private, 1-to-1 Web Messaging</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
          Ready to break down language barriers?
        </h2>

        <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Create your account in less than a minute. No phone numbers, no public feeds, just private encrypted communication.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/signup" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto text-base px-9 h-13 gap-2.5 shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all">
              <UserPlus className="w-5 h-5" />
              <span>Create Your Account</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/login" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto text-base px-7 h-13 border-border/80 hover:bg-secondary">
              Log in to existing account
            </Button>
          </Link>
        </div>

        <div className="mt-8 text-xs text-muted-foreground">
          Works directly in your desktop and mobile web browser. Zero software to install.
        </div>

      </div>
    </section>
  );
}
