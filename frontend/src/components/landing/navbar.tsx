"use client";

/**
 * Design Source: 21st.dev full-width SaaS sticky navbar pattern
 * Layout: Full-bleed (100vw) header with max-w-7xl centered content
 */
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 w-full z-50 transition-all duration-250 ${
        scrolled
          ? "bg-background/85 backdrop-blur-md border-b border-border/80 shadow-sm shadow-black/5"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        {/* Left: Brand logo & wordmark */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
            <Image
              src="/logo.png"
              alt="PlexoChat Logo"
              width={40}
              height={40}
              className="w-10 h-10 object-contain drop-shadow-md"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-foreground flex items-center gap-1.5">
              PlexoChat
              <span className="w-2 h-2 rounded-full bg-primary" />
            </span>
            <span className="text-[10px] text-muted-foreground font-medium tracking-wide uppercase">
              Private Messenger
            </span>
          </div>
        </Link>

        {/* Center: Desktop navigation links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <a
            href="#features"
            className="hover:text-foreground transition-colors"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="hover:text-foreground transition-colors"
          >
            How it works
          </a>
          <a
            href="#security"
            className="hover:text-foreground transition-colors"
          >
            Security & Trust
          </a>
          <a
            href="#use-cases"
            className="hover:text-foreground transition-colors"
          >
            Use Cases
          </a>
        </nav>

        {/* Right: Actions (Theme toggle, Login, Get Started) */}
        <div className="hidden sm:flex items-center gap-3">
          <ThemeToggle />
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-sm font-medium">
              Log In
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm" className="gap-2 shadow-md shadow-primary/20">
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Mobile menu hamburger toggle */}
        <div className="flex sm:hidden items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden w-full bg-card/95 backdrop-blur-xl border-b border-border p-5 shadow-xl animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col gap-4 text-base font-medium">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-secondary transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-secondary transition-colors"
            >
              How it works
            </a>
            <a
              href="#security"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-secondary transition-colors"
            >
              Security & Trust
            </a>
            <a
              href="#use-cases"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-secondary transition-colors"
            >
              Use Cases
            </a>
            <div className="pt-4 border-t border-border/80 flex flex-col gap-2.5">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full">
                  Log In
                </Button>
              </Link>
              <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full gap-2">
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
