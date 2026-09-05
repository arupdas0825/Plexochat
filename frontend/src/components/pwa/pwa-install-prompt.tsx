"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Download, X, Share } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosInstructions, setShowIosInstructions] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if user previously dismissed prompt in this session
    const isDismissed = sessionStorage.getItem("plexochat-pwa-dismissed");
    if (isDismissed) return;

    // Detect standalone PWA mode (already installed)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) return;

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // Android/Chrome beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show subtle prompt after brief usage (3 seconds)
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // For iOS Safari (not in standalone mode): show soft hint after 5 seconds
    if (isIosDevice) {
      const iosTimer = setTimeout(() => {
        setShowPrompt(true);
      }, 5000);
      return () => {
        clearTimeout(iosTimer);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      setShowIosInstructions(true);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIosInstructions(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("plexochat-pwa-dismissed", "true");
    }
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-20 md:bottom-6 right-4 left-4 sm:left-auto sm:w-96 z-40 bg-card/95 backdrop-blur-md border border-border/90 rounded-2xl p-3.5 shadow-2xl flex items-center justify-between gap-3 text-xs"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0 border border-primary/20">
            <Image
              src="/logo.png"
              alt="PlexoChat"
              width={28}
              height={28}
              className="object-contain"
            />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-foreground text-sm leading-tight truncate">
              Install PlexoChat
            </div>
            <div className="text-[11px] text-muted-foreground truncate">
              WhatsApp-grade private chat on your home screen
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleInstallClick}
            className="px-3 py-1.5 bg-primary text-primary-foreground font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-sm active:scale-95 touch-manipulation transition-transform"
          >
            {isIos ? <Share className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
            <span>Install</span>
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg touch-manipulation"
            aria-label="Dismiss install prompt"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* iOS Step-by-Step Instructions Modal */}
        {showIosInstructions && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <div className="bg-card border border-border rounded-3xl p-6 max-w-xs text-center space-y-4 shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-primary/15 mx-auto flex items-center justify-center text-primary">
                <Share className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-base text-foreground">Add to Home Screen</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                1. Tap the <span className="font-semibold text-foreground">Share</span> button at the bottom of Safari.<br />
                2. Scroll down and tap <span className="font-semibold text-foreground">&quot;Add to Home Screen&quot;</span>.
              </p>
              <button
                type="button"
                onClick={handleDismiss}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs active:scale-95 transition-transform"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
