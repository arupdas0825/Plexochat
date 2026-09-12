"use client";

/**
 * Design Source: 21st.dev modern auth card pattern with tab transitions
 * Features:
 * - PlexoChat logo.png integration
 * - Smooth tab switcher (Sign In vs Create Account)
 * - Glassmorphism surface with ambient radial gradient
 */
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";

import { LoginForm } from "./login-form";
import { SignupForm } from "./signup-form";
import { ThemeToggle } from "@/components/ui/theme-toggle";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

interface AuthCardProps {
  initialMode?: "login" | "signup";
}

export function AuthCard({ initialMode = "login" }: AuthCardProps) {
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [hasCachedSession, setHasCachedSession] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        return !!localStorage.getItem("plexochat_current_user");
      } catch {
        return false;
      }
    }
    return false;
  });

  React.useEffect(() => {
    try {
      const cached = localStorage.getItem("plexochat_current_user");
      if (cached) {
        setHasCachedSession(true);
      }
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    if (isAuthenticated || hasCachedSession) {
      router.replace("/home");
    }
  }, [isAuthenticated, hasCachedSession, router]);

  if (isAuthenticated || hasCachedSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-background bg-mesh-gradient text-foreground px-4 py-6 sm:py-10 relative selection:bg-primary/20 selection:text-primary">
      
      {/* Top Bar with Back Link & Theme Toggle */}
      <div className="w-full max-w-md mx-auto flex items-center justify-between z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors p-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
        <ThemeToggle />
      </div>

      {/* Main Centered Auth Card */}
      <div className="w-full max-w-md mx-auto my-auto z-10">
        <div className="rounded-3xl border border-border/80 bg-card/90 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl shadow-primary/10 overflow-hidden ring-1 ring-white/10 relative">
          
          {/* Subtle brand glow behind header */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-primary/15 rounded-full blur-2xl pointer-events-none -z-0" />

          {/* Card Header: Brand Logo & Title */}
          <div className="flex flex-col items-center text-center mb-6 relative z-10">
            <Link href="/" className="mb-3 hover:scale-105 transition-transform duration-200">
              <div className="w-12 h-12 relative flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="PlexoChat Logo"
                  width={48}
                  height={48}
                  className="w-12 h-12 object-contain drop-shadow-md"
                  priority
                />
              </div>
            </Link>

            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              {mode === "login"
                ? "Enter your credentials to load your encrypted session."
                : "Join PlexoChat and start chatting naturally across languages."}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex rounded-xl bg-secondary/80 p-1 mb-6 border border-border/50 text-xs font-medium relative z-10">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 py-2 rounded-lg transition-all duration-150 ${
                mode === "login"
                  ? "bg-card text-foreground font-semibold shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 rounded-lg transition-all duration-150 ${
                mode === "signup"
                  ? "bg-card text-foreground font-semibold shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Animated Tab Content */}
          <div className="relative z-10">
            <AnimatePresence mode="wait">
              {mode === "login" ? (
                <motion.div
                  key="login-tab"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.15 }}
                >
                  <LoginForm onSwitchToSignup={() => setMode("signup")} />
                </motion.div>
              ) : (
                <motion.div
                  key="signup-tab"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  <SignupForm onSwitchToLogin={() => setMode("login")} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>

      {/* Footer copyright */}
      <div className="w-full max-w-md mx-auto text-center text-[11px] text-muted-foreground z-10 pt-4">
        © {new Date().getFullYear()} PlexoChat™. All conversations are end-to-end encrypted.
      </div>
    </div>
  );
}
