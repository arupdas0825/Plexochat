"use client";

import React, { useState } from "react";
import {
  Settings,
  User,
  Languages,
  ShieldCheck,
  Eye,
  MapPin,
  Save,
  Check,
  Copy,
  LogOut,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, SUPPORTED_LANGUAGES } from "@/lib/auth-context";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function SettingsPageView() {
  const { user, updateProfile, logout } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [city, setCity] = useState(user?.city || "");
  const [country, setCountry] = useState(user?.country || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [receivingLang, setReceivingLang] = useState(user?.preferredReceivingLanguage || "en");
  const [isDiscoverable, setIsDiscoverable] = useState(user?.isDiscoverable ?? true);
  const [showLocation, setShowLocation] = useState(user?.showApproximateLocation ?? false);

  const [copiedId, setCopiedId] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleCopyId = () => {
    if (user?.plexoChatId) {
      navigator.clipboard.writeText(user.plexoChatId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const langObj = SUPPORTED_LANGUAGES.find((l) => l.code === receivingLang);

    updateProfile({
      displayName,
      city,
      country,
      bio,
      preferredReceivingLanguage: receivingLang,
      preferredLanguageName: langObj ? langObj.name : "English",
      isDiscoverable,
      showApproximateLocation: showLocation,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="flex-1 h-full overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto w-full">
      
      {/* 1. Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Settings className="w-4 h-4" />
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
              Settings & Privacy
            </h1>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Manage your personal profile, discovery preferences, and automatic client-side translation.
          </p>
        </div>

        {savedSuccess && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold animate-in fade-in">
            <Check className="w-3.5 h-3.5" />
            <span>Changes Saved</span>
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Section 1: Profile Identity */}
        <div className="p-5 sm:p-6 rounded-3xl border border-border/80 bg-card space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-border/50">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              <span>Public Profile & Identity</span>
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-mono">PlexoChat ID:</span>
              <button
                type="button"
                onClick={handleCopyId}
                className="px-2.5 py-1 rounded-lg bg-secondary border border-border/70 text-xs font-mono font-semibold flex items-center gap-1.5 hover:bg-secondary/80"
              >
                <span>{user?.plexoChatId || "PX-8921-X"}</span>
                {copiedId ? (
                  <Check className="w-3 h-3 text-emerald-500" />
                ) : (
                  <Copy className="w-3 h-3 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-border bg-secondary/30 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Username</label>
              <input
                type="text"
                disabled
                value={`@${user?.username || "user"}`}
                className="w-full h-10 px-3 rounded-xl border border-border bg-secondary/10 text-xs text-muted-foreground font-mono opacity-80 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Approximate City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-border bg-secondary/30 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-border bg-secondary/30 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Short Bio / Goals</label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full p-3 rounded-xl border border-border bg-secondary/30 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Section 2: Languages & Automatic Client Translation */}
        <div className="p-5 sm:p-6 rounded-3xl border border-border/80 bg-card space-y-4 shadow-sm">
          <div className="pb-3 border-b border-border/50">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Languages className="w-4 h-4 text-purple-500" />
              <span>Translation & Language Preferences</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              PlexoChat automatically translates incoming messages into your preferred receiving language.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">
              Preferred Receiving Language
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = receivingLang === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setReceivingLang(lang.code)}
                    className={`p-3 rounded-2xl border text-xs font-medium flex items-center gap-2 transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20 font-semibold"
                        : "bg-secondary/40 border-border/70 text-foreground hover:bg-secondary"
                    }`}
                  >
                    <span className="text-base">{lang.flag}</span>
                    <span className="truncate">{lang.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section 3: Discovery & Privacy Controls */}
        <div className="p-5 sm:p-6 rounded-3xl border border-border/80 bg-card space-y-4 shadow-sm">
          <div className="pb-3 border-b border-border/50">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Privacy & Discovery Controls</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Fine-tune how you appear to others on Explore World.
            </p>
          </div>

          {/* Discoverable toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-secondary/30 border border-border/50">
            <div>
              <div className="text-xs font-semibold text-foreground">
                Discoverable on Explore World
              </div>
              <div className="text-[11px] text-muted-foreground">
                Allow verified members to view your profile card and send you connection requests.
              </div>
            </div>
            <input
              type="checkbox"
              checked={isDiscoverable}
              onChange={(e) => setIsDiscoverable(e.target.checked)}
              className="w-5 h-5 rounded accent-primary cursor-pointer"
            />
          </div>

          {/* Location toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-secondary/30 border border-border/50">
            <div>
              <div className="text-xs font-semibold text-foreground">
                Show Approximate City on Map
              </div>
              <div className="text-[11px] text-muted-foreground">
                Show your city cluster pin (e.g. &quot;Kolkata, India&quot;). Exact GPS coordinates are NEVER tracked.
              </div>
            </div>
            <input
              type="checkbox"
              checked={showLocation}
              onChange={(e) => setShowLocation(e.target.checked)}
              className="w-5 h-5 rounded accent-primary cursor-pointer"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={logout}
            className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </Button>

          <Button
            type="submit"
            className="text-xs font-semibold rounded-xl gap-2 shadow-md shadow-primary/25 px-6 h-10"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </Button>
        </div>

      </form>

    </div>
  );
}
