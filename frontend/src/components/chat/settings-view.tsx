"use client";

/**
 * Screen 5: Profile / Settings Screen
 * Design Source: 21st.dev account settings card pattern
 * Features:
 * - Profile header & copyable PlexoChat ID
 * - Preferred Receiving Language selector
 * - Privacy summary & honest E2EE framing
 * - Theme toggle and Sign out
 */
import React, { useState } from "react";
import {
  Copy,
  Check,
  Languages,
  ShieldCheck,
  LogOut,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth, SUPPORTED_LANGUAGES } from "@/lib/auth-context";

export function SettingsView() {
  const { user, logout, updateProfile } = useAuth();
  const [copiedId, setCopiedId] = useState(false);
  const [selectedLang, setSelectedLang] = useState(
    user?.preferredReceivingLanguage || "en"
  );
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleCopyId = () => {
    if (user?.plexoChatId) {
      navigator.clipboard.writeText(user.plexoChatId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleSaveLanguage = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        preferredReceivingLanguage: selectedLang,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error("Failed to save language preference:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto p-4 sm:p-8 space-y-8 bg-background">
      
      {/* Settings Header */}
      <div className="max-w-2xl">
        <h2 className="text-2xl font-bold text-foreground">Account & Preferences</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your personal profile, preferred translation language, and privacy settings.
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        
        {/* Section 1: Profile Card */}
        <div className="p-6 rounded-3xl bg-card border border-border space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary via-indigo-500 to-violet-500 text-white font-black text-xl flex items-center justify-center shadow-md shadow-primary/20">
              {user?.displayName ? user.displayName.substring(0, 2).toUpperCase() : "PX"}
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-foreground">
                {user?.displayName || "User"}
              </h3>
              <div className="text-xs text-muted-foreground font-mono">
                @{user?.username || "user"}
              </div>
            </div>
          </div>

          {/* Unique PlexoChat ID with Copy Button */}
          <div className="p-3.5 rounded-2xl bg-secondary/60 border border-border/60 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
                Your Unique PlexoChat ID
              </div>
              <div className="font-mono text-sm font-bold text-primary">
                {user?.plexoChatId || ""}
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopyId}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-card hover:bg-secondary border border-border transition-colors text-foreground"
            >
              {copiedId ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy ID</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Section 2: Preferred Receiving Language (Core Personalization Rule) */}
        <div className="p-6 rounded-3xl bg-card border border-border space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Languages className="w-5 h-5 text-primary" />
              <h4 className="font-bold text-base text-foreground">
                Preferred Receiving Language
              </h4>
            </div>
            <Badge variant="accent" className="text-xs">
              Translation Target
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            All messages sent to you in any language or script will automatically translate into this language by default.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="flex-1 h-11 px-3.5 rounded-xl border border-border bg-secondary/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>

            <Button
              onClick={handleSaveLanguage}
              className="h-11 px-6 font-semibold shrink-0"
            >
              {savedSuccess ? "Saved!" : "Update Language"}
            </Button>
          </div>
        </div>

        {/* Section 3: Privacy & Security */}
        <div className="p-6 rounded-3xl bg-card border border-border space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <h4 className="font-bold text-base text-foreground">
              End-to-End Encryption &amp; Translation Privacy
            </h4>
          </div>

          <div className="p-4 rounded-2xl bg-secondary/40 border border-border/60 text-xs text-muted-foreground space-y-3">
            <p className="leading-relaxed">
              End-to-End Encryption is powered by the audited <code className="text-primary font-mono text-[11px]">@matrix-org/olm</code> double-ratchet protocol (Signal architecture). Private keys are generated and stored exclusively in your device&apos;s IndexedDB. Identity keys (Curve25519) and one-time prekeys ensure forward secrecy. PlexoChat&apos;s servers only relay opaque ciphertext.
            </p>

            <div className="p-3 rounded-xl bg-card/60 border border-border/70 text-[11px] space-y-1">
              <span className="font-semibold text-foreground block">Third-Party Translation Disclosure:</span>
              <p className="leading-relaxed">
                Messages are translated using a third-party translation service before encryption. Google Translate may process message text for translation purposes. PlexoChat&apos;s own servers never see message content.
              </p>
            </div>

            <div className="flex items-center gap-2 font-mono text-[11px] text-foreground font-semibold pt-1">
              <Lock className="w-3.5 h-3.5 text-emerald-500" />
              <span>Olm Double-Ratchet Active on this device</span>
            </div>
          </div>
        </div>

        {/* Section 4: Theme Preferences */}
        <div className="p-6 rounded-3xl bg-card border border-border flex items-center justify-between">
          <div>
            <h4 className="font-bold text-sm text-foreground">Color Theme</h4>
            <p className="text-xs text-muted-foreground">
              Toggle between dark and light appearance
            </p>
          </div>
          <ThemeToggle />
        </div>

        {/* Section 5: Sign Out */}
        <div className="pt-2">
          <Button
            variant="outline"
            onClick={logout}
            className="w-full h-11 border-destructive/30 text-destructive hover:bg-destructive/10 gap-2 font-semibold"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out of this Device</span>
          </Button>
        </div>

      </div>

    </div>
  );
}
