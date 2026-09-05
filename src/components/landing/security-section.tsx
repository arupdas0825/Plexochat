"use client";

/**
 * Design Source: 21st.dev high-contrast dark security showcase section
 * Breaks visual monotony with a rich dark aesthetic and clear, honest threat model
 */
import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  FileCode2,
  KeyRound,
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function SecuritySection() {
  return (
    <section
      id="security"
      className="w-full py-24 sm:py-32 bg-[#0c0d14] text-white relative overflow-hidden border-y border-white/10"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none -z-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-indigo-300 border border-white/15 mb-4">
            <Lock className="w-3.5 h-3.5" />
            <span>Honest Security & Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            Why privacy matters — and how we protect it.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-zinc-400 leading-relaxed">
            Most messaging platforms that offer &quot;translation&quot; send your unencrypted plaintext to third-party cloud translation APIs. PlexoChat was architected from the ground up to prevent that.
          </p>
        </div>

        {/* 3 Major Pillars of Our Architecture */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          
          {/* Pillar 1: Local-first translation */}
          <div className="rounded-3xl bg-white/[0.04] border border-white/10 p-8 hover:bg-white/[0.06] transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6 ring-1 ring-white/10">
              <KeyRound className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">
              Local Translation Before Encryption
            </h3>
            <p className="text-sm text-zinc-400 leading-relaxed mb-4">
              If an external server receives your plaintext message to translate it, that conversation is no longer end-to-end encrypted. In PlexoChat, translation runs client-side before encryption so that plaintext never hits the wire.
            </p>
            <div className="text-xs text-indigo-300 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Zero server-side plaintext logs</span>
            </div>
          </div>

          {/* Pillar 2: No custom crypto */}
          <div className="rounded-3xl bg-white/[0.04] border border-white/10 p-8 hover:bg-white/[0.06] transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6 ring-1 ring-white/10">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">
              Standard Cryptographic Protocols
            </h3>
            <p className="text-sm text-zinc-400 leading-relaxed mb-4">
              We never invent proprietary encryption algorithms. PlexoChat uses vetted, audited cryptographic primitives via the Web Crypto API, device-generated keys, forward secrecy, and authenticated encryption.
            </p>
            <div className="text-xs text-indigo-300 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Standard, audited libraries only</span>
            </div>
          </div>

          {/* Pillar 3: Honest threat model */}
          <div className="rounded-3xl bg-white/[0.04] border border-white/10 p-8 hover:bg-white/[0.06] transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6 ring-1 ring-white/10">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">
              Honest Security Claims
            </h3>
            <p className="text-sm text-zinc-400 leading-relaxed mb-4">
              We will never call PlexoChat &quot;100% unhackable&quot; or &quot;bulletproof&quot;. Because web applications rely on server-delivered JavaScript, we document our exact threat model openly so you know exactly what is protected.
            </p>
            <div className="text-xs text-indigo-300 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Transparent, documented threat model</span>
            </div>
          </div>

        </div>

        {/* Security Checklist Box */}
        <div className="rounded-3xl bg-gradient-to-r from-white/[0.06] to-white/[0.02] border border-white/15 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h4 className="text-lg font-bold text-white flex items-center gap-2">
              <FileCode2 className="w-5 h-5 text-indigo-400" />
              <span>Explore the Complete Security Specification</span>
            </h4>
            <p className="text-sm text-zinc-400 max-w-2xl">
              Learn how we implement tiered rate limiting with Redis, strict input validation, isolated blob storage for photos, and dependency hygiene audits.
            </p>
          </div>
          <Link href="/security" className="shrink-0">
            <Button className="bg-white text-zinc-950 hover:bg-zinc-200 font-semibold gap-2 shadow-lg">
              <span>Read Security Docs</span>
              <ArrowUpRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

      </div>
    </section>
  );
}
