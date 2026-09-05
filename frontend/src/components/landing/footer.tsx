"use client";

/**
 * Design Source: 21st.dev full-width multi-column footer pattern
 * Layout: Full-bleed (100vw) background with max-w-7xl multi-column grid
 */
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, ExternalLink } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="w-full bg-card border-t border-border/80 pt-16 pb-12 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Multi-column Grid (4 Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12 border-b border-border/60">
          
          {/* Col 1 & 2: Brand & Mission */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 relative flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="PlexoChat Logo"
                  width={36}
                  height={36}
                  className="w-9 h-9 object-contain"
                />
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">
                PlexoChat
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              A private, end-to-end encrypted 1-to-1 multilingual messenger. Communicate naturally across languages while preserving total privacy.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-secondary text-foreground border border-border/60">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span>Client-side encryption • Zero plaintext storage</span>
            </div>
          </div>

          {/* Col 3: Product */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Product
            </h4>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li>
                <a href="#features" className="hover:text-foreground transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-foreground transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#use-cases" className="hover:text-foreground transition-colors">
                  Use Cases
                </a>
              </li>
              <li>
                <Link href="/login" className="hover:text-foreground transition-colors">
                  Web Messenger
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Security & Trust */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Security & Trust
            </h4>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li>
                <a href="#security" className="hover:text-foreground transition-colors">
                  Privacy Philosophy
                </a>
              </li>
              <li>
                <Link href="/security" className="hover:text-foreground transition-colors">
                  Threat Model & Audit
                </Link>
              </li>
              <li>
                <span className="text-muted-foreground/70">
                  Rate Limiting & Anti-Spam
                </span>
              </li>
              <li>
                <span className="text-muted-foreground/70">
                  Encrypted Photo Storage
                </span>
              </li>
            </ul>
          </div>

          {/* Col 5: Legal & Open Source */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Legal & Open Source
            </h4>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li>
                <Link href="/license" className="hover:text-foreground transition-colors">
                  License
                </Link>
              </li>
              <li>
                <Link href="/trademark" className="hover:text-foreground transition-colors">
                  Trademark Policy
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/arupdas0825/plexochat"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors inline-flex items-center gap-1.5"
                >
                  <svg
                    className="w-3.5 h-3.5 fill-current"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    />
                  </svg>
                  <span>GitHub Repository</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
          <p>
            © {new Date().getFullYear()} PlexoChat™. All rights reserved. Built with privacy and linguistic inclusivity.
          </p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All Systems Normal</span>
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}
