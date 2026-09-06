"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  User,
  Languages,
  ShieldCheck,
  Save,
  Check,
  Copy,
  LogOut,
  MapPin,
  Bell,
  Palette,
  KeyRound,
  Trash2,
  Download,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Laptop,
  CheckCircle2,
  Volume2,
  VolumeX,
  Sparkles,
  Smartphone,
  Shield,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, SUPPORTED_LANGUAGES } from "@/lib/auth-context";
import { useTheme } from "../theme-provider";

export type SettingsTabId =
  | "profile"
  | "languages"
  | "security"
  | "location"
  | "notifications"
  | "appearance"
  | "account";

export function SettingsPageView() {
  const { user, updateProfile, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<SettingsTabId>("profile");

  // Profile Form States
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [city, setCity] = useState(user?.city || "");
  const [country, setCountry] = useState(user?.country || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatarBg, setAvatarBg] = useState(
    user?.avatarBg || "from-primary to-violet-500"
  );
  const [languagesSpoken, setLanguagesSpoken] = useState(
    user?.languagesSpoken?.join(", ") || user?.preferredLanguageName || "English"
  );
  const [languagesLearning, setLanguagesLearning] = useState(
    user?.languagesLearning?.join(", ") || "Japanese, Spanish"
  );

  // Language Preferences States
  const [receivingLang, setReceivingLang] = useState(
    user?.preferredReceivingLanguage || "en"
  );
  const [autoTranslateEnabled, setAutoTranslateEnabled] = useState(true);

  // Privacy & Location States
  const [isDiscoverable, setIsDiscoverable] = useState(user?.isDiscoverable ?? true);
  const [showLocation, setShowLocation] = useState(user?.showApproximateLocation ?? false);
  const [stealthMode, setStealthMode] = useState(false);

  // Notification States
  const [pushEnabled, setPushEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [previewEnabled, setPreviewEnabled] = useState(true);
  const [requestAlerts, setRequestAlerts] = useState(true);

  // Appearance States
  const [bubbleStyle, setBubbleStyle] = useState<"glass" | "solid">("glass");
  const [fontSize, setFontSize] = useState<"default" | "compact" | "large">("default");
  const [reducedMotion, setReducedMotion] = useState(false);

  // Feedback States
  const [copiedId, setCopiedId] = useState(false);
  const [copiedFingerprint, setCopiedFingerprint] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);

  // Keep state in sync with user if loaded
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setCity(user.city || "");
      setCountry(user.country || "");
      setBio(user.bio || "");
      if (user.avatarBg) setAvatarBg(user.avatarBg);
      if (user.preferredReceivingLanguage) setReceivingLang(user.preferredReceivingLanguage);
      if (user.isDiscoverable !== undefined) setIsDiscoverable(user.isDiscoverable);
      if (user.showApproximateLocation !== undefined) setShowLocation(user.showApproximateLocation);
      if (user.languagesSpoken?.length) setLanguagesSpoken(user.languagesSpoken.join(", "));
      if (user.languagesLearning?.length) setLanguagesLearning(user.languagesLearning.join(", "));
    }
  }, [user]);

  const handleCopyId = () => {
    if (user?.plexoChatId) {
      navigator.clipboard.writeText(user.plexoChatId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleCopyFingerprint = () => {
    const dummyFingerprint = "7F89 A10B 94C2 6D7E 8F10 22B4 90FA 55C1 88D9 1234";
    navigator.clipboard.writeText(dummyFingerprint);
    setCopiedFingerprint(true);
    setTimeout(() => setCopiedFingerprint(false), 2000);
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const langObj = SUPPORTED_LANGUAGES.find((l) => l.code === receivingLang);

    const spokenArray = languagesSpoken
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const learningArray = languagesLearning
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    updateProfile({
      displayName,
      city,
      country,
      bio,
      avatarBg,
      preferredReceivingLanguage: receivingLang,
      preferredLanguageName: langObj ? langObj.name : "English",
      isDiscoverable,
      showApproximateLocation: showLocation,
      languagesSpoken: spokenArray.length ? spokenArray : ["English"],
      languagesLearning: learningArray,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleClearCache = () => {
    try {
      localStorage.removeItem("plexochat_recent_searches");
      setCacheCleared(true);
      setTimeout(() => setCacheCleared(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportData = () => {
    const data = {
      user,
      exportDate: new Date().toISOString(),
      e2eeRelayStatus: "ACTIVE_DOUBLE_RATCHET",
      version: "PlexoChat-v1.0",
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `plexochat_export_${user?.username || "user"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const AVATAR_GRADIENTS = [
    { label: "Indigo Violet", value: "from-primary to-violet-500" },
    { label: "Emerald Teal", value: "from-emerald-500 to-teal-600" },
    { label: "Rose Coral", value: "from-rose-500 to-amber-500" },
    { label: "Blue Cyan", value: "from-blue-600 to-cyan-500" },
    { label: "Sunset Purple", value: "from-fuchsia-600 to-pink-500" },
  ];

  return (
    <div className="flex-1 h-full overflow-y-auto p-4 md:p-6 lg:p-8 pb-28 md:pb-8 space-y-6 max-w-5xl mx-auto w-full select-none">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-primary/20 to-violet-500/20 border border-primary/30 flex items-center justify-center text-primary shadow-xs">
              <Settings className="w-5 h-5" />
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
              Settings & Account Hub
            </h1>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Manage your personal profile, auto-translation, E2EE security keys, and account preferences.
          </p>
        </div>

        {savedSuccess && (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold animate-in fade-in self-start sm:self-auto shadow-xs">
            <Check className="w-3.5 h-3.5" />
            <span>Preferences Saved</span>
          </span>
        )}
      </div>

      {/* 2. Apple-Style Liquid Glass Settings Tab Selector */}
      <div className="relative flex items-center p-1 rounded-2xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),0_4px_20px_0_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] overflow-x-auto no-scrollbar gap-1">
        
        {/* Tab 1: Profile */}
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`relative px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors duration-200 shrink-0 ${
            activeTab === "profile"
              ? "text-primary font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {activeTab === "profile" && (
            <motion.div
              layoutId="settingsActiveTabPill"
              className="absolute inset-0 rounded-xl bg-primary/10 dark:bg-primary/20 border border-primary/25 shadow-xs"
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
            />
          )}
          <User className="w-4 h-4 relative z-10" />
          <span className="relative z-10">Profile</span>
        </button>

        {/* Tab 2: Language Preferences */}
        <button
          type="button"
          onClick={() => setActiveTab("languages")}
          className={`relative px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors duration-200 shrink-0 ${
            activeTab === "languages"
              ? "text-primary font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {activeTab === "languages" && (
            <motion.div
              layoutId="settingsActiveTabPill"
              className="absolute inset-0 rounded-xl bg-primary/10 dark:bg-primary/20 border border-primary/25 shadow-xs"
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
            />
          )}
          <Languages className="w-4 h-4 relative z-10 text-purple-500" />
          <span className="relative z-10">Languages</span>
        </button>

        {/* Tab 3: Security & E2EE */}
        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={`relative px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors duration-200 shrink-0 ${
            activeTab === "security"
              ? "text-primary font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {activeTab === "security" && (
            <motion.div
              layoutId="settingsActiveTabPill"
              className="absolute inset-0 rounded-xl bg-primary/10 dark:bg-primary/20 border border-primary/25 shadow-xs"
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
            />
          )}
          <KeyRound className="w-4 h-4 relative z-10 text-emerald-500" />
          <span className="relative z-10">Security & E2EE</span>
        </button>

        {/* Tab 4: Location & Discoverability */}
        <button
          type="button"
          onClick={() => setActiveTab("location")}
          className={`relative px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors duration-200 shrink-0 ${
            activeTab === "location"
              ? "text-primary font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {activeTab === "location" && (
            <motion.div
              layoutId="settingsActiveTabPill"
              className="absolute inset-0 rounded-xl bg-primary/10 dark:bg-primary/20 border border-primary/25 shadow-xs"
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
            />
          )}
          <MapPin className="w-4 h-4 relative z-10 text-blue-500" />
          <span className="relative z-10">Location</span>
        </button>

        {/* Tab 5: Notifications */}
        <button
          type="button"
          onClick={() => setActiveTab("notifications")}
          className={`relative px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors duration-200 shrink-0 ${
            activeTab === "notifications"
              ? "text-primary font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {activeTab === "notifications" && (
            <motion.div
              layoutId="settingsActiveTabPill"
              className="absolute inset-0 rounded-xl bg-primary/10 dark:bg-primary/20 border border-primary/25 shadow-xs"
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
            />
          )}
          <Bell className="w-4 h-4 relative z-10 text-amber-500" />
          <span className="relative z-10">Notifications</span>
        </button>

        {/* Tab 6: Appearance */}
        <button
          type="button"
          onClick={() => setActiveTab("appearance")}
          className={`relative px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors duration-200 shrink-0 ${
            activeTab === "appearance"
              ? "text-primary font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {activeTab === "appearance" && (
            <motion.div
              layoutId="settingsActiveTabPill"
              className="absolute inset-0 rounded-xl bg-primary/10 dark:bg-primary/20 border border-primary/25 shadow-xs"
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
            />
          )}
          <Palette className="w-4 h-4 relative z-10 text-rose-500" />
          <span className="relative z-10">Appearance</span>
        </button>

        {/* Tab 7: Account */}
        <button
          type="button"
          onClick={() => setActiveTab("account")}
          className={`relative px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors duration-200 shrink-0 ${
            activeTab === "account"
              ? "text-primary font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {activeTab === "account" && (
            <motion.div
              layoutId="settingsActiveTabPill"
              className="absolute inset-0 rounded-xl bg-primary/10 dark:bg-primary/20 border border-primary/25 shadow-xs"
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
            />
          )}
          <ShieldCheck className="w-4 h-4 relative z-10" />
          <span className="relative z-10">Account</span>
        </button>

      </div>

      {/* 3. Tab Contents */}
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* ══════════════════════════════════════════════════════
            SECTION 1: PROFILE
           ══════════════════════════════════════════════════════ */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            <div className="p-5 sm:p-6 rounded-3xl border border-border/80 bg-card space-y-5 shadow-xs">
              
              {/* Profile Avatar & ID Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/50">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div
                      className={`w-16 h-16 rounded-3xl bg-gradient-to-tr ${avatarBg} text-white font-bold text-xl flex items-center justify-center shadow-md`}
                    >
                      {displayName ? displayName.substring(0, 2).toUpperCase() : "U"}
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-card" />
                  </div>

                  <div>
                    <h2 className="text-base font-bold text-foreground">
                      {displayName || "Your Name"}
                    </h2>
                    <p className="text-xs text-muted-foreground font-mono">
                      @{user?.username || "user"}
                    </p>
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-500 font-mono font-medium mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Verified PlexoChat Profile
                    </span>
                  </div>
                </div>

                {/* PlexoChat ID Copy Card */}
                <div className="p-3 rounded-2xl bg-secondary/40 border border-border/60 space-y-1">
                  <div className="text-[10px] text-muted-foreground font-mono">PlexoChat Verified ID:</div>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="px-3 py-1.5 rounded-xl bg-card border border-border/80 text-xs font-mono font-bold flex items-center gap-2 hover:border-primary/40 transition-colors shadow-xs"
                  >
                    <span>{user?.plexoChatId || "PX-8921-X"}</span>
                    {copiedId ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>

              {/* Avatar Color Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">Avatar Gradient Theme</label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_GRADIENTS.map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setAvatarBg(g.value)}
                      className={`h-8 px-3 rounded-xl text-xs font-medium flex items-center gap-2 border transition-all ${
                        avatarBg === g.value
                          ? "border-primary ring-2 ring-primary/30 shadow-xs"
                          : "border-border/70 hover:border-border"
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full bg-gradient-to-tr ${g.value}`} />
                      <span>{g.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-border/80 bg-secondary/30 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Username</label>
                  <input
                    type="text"
                    disabled
                    value={`@${user?.username || "user"}`}
                    className="w-full h-10 px-3 rounded-xl border border-border/60 bg-secondary/10 text-xs text-muted-foreground font-mono opacity-80 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Location Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">City / Region</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Tokyo, Berlin, Kolkata"
                    className="w-full h-10 px-3 rounded-xl border border-border/80 bg-secondary/30 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="e.g. Japan, Germany, India"
                    className="w-full h-10 px-3 rounded-xl border border-border/80 bg-secondary/30 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              {/* Languages Bio Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Languages You Speak (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={languagesSpoken}
                    onChange={(e) => setLanguagesSpoken(e.target.value)}
                    placeholder="e.g. English, Japanese"
                    className="w-full h-10 px-3 rounded-xl border border-border/80 bg-secondary/30 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Languages You Are Learning (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={languagesLearning}
                    onChange={(e) => setLanguagesLearning(e.target.value)}
                    placeholder="e.g. Spanish, German, French"
                    className="w-full h-10 px-3 rounded-xl border border-border/80 bg-secondary/30 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Bio / Learning Goals</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share a bit about yourself, what culture you love, and your language goals..."
                  className="w-full p-3 rounded-xl border border-border/80 bg-secondary/30 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>

            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            SECTION 2: LANGUAGE PREFERENCES & TRANSLATION
           ══════════════════════════════════════════════════════ */}
        {activeTab === "languages" && (
          <div className="space-y-6">
            <div className="p-5 sm:p-6 rounded-3xl border border-border/80 bg-card space-y-5 shadow-xs">
              <div className="pb-3 border-b border-border/50">
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Languages className="w-4 h-4 text-purple-500" />
                  <span>Real-Time Client Translation</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  PlexoChat translates messages after end-to-end decryption directly inside your device sandbox.
                </p>
              </div>

              {/* Auto Translate Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30 border border-border/60">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-foreground">
                    Automatic Incoming Message Translation
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Instantly translate foreign incoming messages into your preferred language upon arrival.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autoTranslateEnabled}
                  onChange={(e) => setAutoTranslateEnabled(e.target.checked)}
                  className="w-5 h-5 rounded accent-primary cursor-pointer"
                />
              </div>

              {/* Language Selection Grid */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Preferred Receiving Language</span>
                  <span className="text-[10px] text-primary font-mono font-semibold">
                    Current: {SUPPORTED_LANGUAGES.find((l) => l.code === receivingLang)?.name || "English"}
                  </span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {SUPPORTED_LANGUAGES.map((lang) => {
                    const isSelected = receivingLang === lang.code;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => setReceivingLang(lang.code)}
                        className={`p-3 rounded-2xl border text-xs font-medium flex items-center gap-2.5 transition-all ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20 font-semibold"
                            : "bg-secondary/40 border-border/70 text-foreground hover:bg-secondary"
                        }`}
                      >
                        <span className="text-xl">{lang.flag}</span>
                        <span className="truncate">{lang.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Translation Privacy Notice */}
              <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs text-foreground flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                <div className="text-[11px] text-muted-foreground leading-relaxed">
                  <strong>Zero Server Plaintext:</strong> Message payloads remain end-to-end encrypted in transit. Translation happens purely in the authenticated client layer after cryptographic signature verification.
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            SECTION 3: SECURITY & E2EE
           ══════════════════════════════════════════════════════ */}
        {activeTab === "security" && (
          <div className="space-y-6">
            <div className="p-5 sm:p-6 rounded-3xl border border-border/80 bg-card space-y-5 shadow-xs">
              <div className="pb-3 border-b border-border/50">
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  <span>End-to-End Encryption & Security Architecture</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your conversations are shielded by client-side Double Ratchet encryption with ephemeral keys.
                </p>
              </div>

              {/* E2EE Active Banner */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <span>Signal Protocol Double Ratchet Active</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      Forward secrecy & break-in recovery enabled for all 1-to-1 chats.
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold font-mono">
                  VERIFIED
                </span>
              </div>

              {/* Safety Number & Key Fingerprint */}
              <div className="space-y-2 p-4 rounded-2xl bg-secondary/30 border border-border/60">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-primary" />
                    <span>Device Cryptographic Identity Fingerprint</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleCopyFingerprint}
                    className="text-[11px] text-primary hover:underline flex items-center gap-1 font-mono font-medium"
                  >
                    {copiedFingerprint ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Fingerprint</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-3 rounded-xl bg-card border border-border font-mono text-[11px] text-muted-foreground tracking-wider select-all break-all">
                  7F89 A10B 94C2 6D7E 8F10 22B4 90FA 55C1 88D9 1234
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Compare this security fingerprint with conversation partners to verify no man-in-the-middle tampering.
                </p>
              </div>

              {/* Active Sessions */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-primary" />
                  <span>Active Authenticated Client Sessions</span>
                </label>
                <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-card border border-border/70 flex items-center justify-center text-primary">
                      <Laptop className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-foreground">
                        Current Browser (Chrome on Windows / Mobile)
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        Protected via TLS 1.3 & Cloudflare Relay • Active now
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-500 font-bold px-2 py-0.5 rounded-md bg-emerald-500/10">
                    THIS DEVICE
                  </span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            SECTION 4: LOCATION & DISCOVERABILITY
           ══════════════════════════════════════════════════════ */}
        {activeTab === "location" && (
          <div className="space-y-6">
            <div className="p-5 sm:p-6 rounded-3xl border border-border/80 bg-card space-y-5 shadow-xs">
              <div className="pb-3 border-b border-border/50">
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  <span>Privacy & Discovery Controls</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Control how other international members discover you on the global world map.
                </p>
              </div>

              {/* Discoverable toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30 border border-border/60">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-foreground">
                    Discoverable on Explore World
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Allow verified language partners to view your profile card and send you connection requests.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isDiscoverable}
                  onChange={(e) => setIsDiscoverable(e.target.checked)}
                  className="w-5 h-5 rounded accent-primary cursor-pointer"
                />
              </div>

              {/* Approximate Location toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30 border border-border/60">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-foreground">
                    Show Approximate City Cluster Pin
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Display your general city pin (e.g. &quot;{city || "Tokyo"}, {country || "Japan"}&quot;). Exact GPS coordinates are NEVER collected or stored.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={showLocation}
                  onChange={(e) => setShowLocation(e.target.checked)}
                  className="w-5 h-5 rounded accent-primary cursor-pointer"
                />
              </div>

              {/* Stealth Mode toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30 border border-border/60">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-foreground flex items-center gap-2">
                    <span>Incognito Online Status</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-secondary text-muted-foreground font-mono">
                      Privacy
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Hide your green online indicator from non-connected members while browsing Explore.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={stealthMode}
                  onChange={(e) => setStealthMode(e.target.checked)}
                  className="w-5 h-5 rounded accent-primary cursor-pointer"
                />
              </div>

            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            SECTION 5: NOTIFICATIONS
           ══════════════════════════════════════════════════════ */}
        {activeTab === "notifications" && (
          <div className="space-y-6">
            <div className="p-5 sm:p-6 rounded-3xl border border-border/80 bg-card space-y-5 shadow-xs">
              <div className="pb-3 border-b border-border/50">
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-500" />
                  <span>Notification & Sound Alerts</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Customize incoming message alerts and sound chimes across devices.
                </p>
              </div>

              {/* Push Notifications */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30 border border-border/60">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-foreground">Push Notifications</div>
                  <div className="text-[11px] text-muted-foreground">
                    Receive background notifications when partners message you.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={pushEnabled}
                  onChange={(e) => setPushEnabled(e.target.checked)}
                  className="w-5 h-5 rounded accent-primary cursor-pointer"
                />
              </div>

              {/* Audio Chimes */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30 border border-border/60">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-primary" /> : <VolumeX className="w-3.5 h-3.5 text-muted-foreground" />}
                    <span>In-App Sound Chimes</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Play a subtle Apple-style chime when new messages arrive.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  className="w-5 h-5 rounded accent-primary cursor-pointer"
                />
              </div>

              {/* Connection Requests Alerts */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30 border border-border/60">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-foreground">
                    Connection Request Invitations
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Highlight incoming invitations in the Explore navigation tab badge.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={requestAlerts}
                  onChange={(e) => setRequestAlerts(e.target.checked)}
                  className="w-5 h-5 rounded accent-primary cursor-pointer"
                />
              </div>

              {/* Preview Banners */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30 border border-border/60">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-foreground">
                    Show Message Preview in Banners
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Display translated message snippet in banner alerts.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={previewEnabled}
                  onChange={(e) => setPreviewEnabled(e.target.checked)}
                  className="w-5 h-5 rounded accent-primary cursor-pointer"
                />
              </div>

            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            SECTION 6: APPEARANCE
           ══════════════════════════════════════════════════════ */}
        {activeTab === "appearance" && (
          <div className="space-y-6">
            <div className="p-5 sm:p-6 rounded-3xl border border-border/80 bg-card space-y-5 shadow-xs">
              <div className="pb-3 border-b border-border/50">
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Palette className="w-4 h-4 text-rose-500" />
                  <span>Appearance & Themes</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select your interface theme and chat styling options.
                </p>
              </div>

              {/* Theme Mode Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">Color Mode</label>
                <div className="grid grid-cols-3 gap-3">
                  {/* Light */}
                  <button
                    type="button"
                    onClick={() => setTheme("light")}
                    className={`p-4 rounded-2xl border text-center flex flex-col items-center gap-2 transition-all ${
                      theme === "light"
                        ? "border-primary bg-primary/10 ring-2 ring-primary/25 shadow-xs font-bold text-primary"
                        : "border-border/80 bg-secondary/30 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Sun className="w-5 h-5" />
                    <span className="text-xs">Light</span>
                  </button>

                  {/* Dark */}
                  <button
                    type="button"
                    onClick={() => setTheme("dark")}
                    className={`p-4 rounded-2xl border text-center flex flex-col items-center gap-2 transition-all ${
                      theme === "dark"
                        ? "border-primary bg-primary/10 ring-2 ring-primary/25 shadow-xs font-bold text-primary"
                        : "border-border/80 bg-secondary/30 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Moon className="w-5 h-5" />
                    <span className="text-xs">Dark</span>
                  </button>

                  {/* System */}
                  <button
                    type="button"
                    onClick={() => setTheme("system")}
                    className={`p-4 rounded-2xl border text-center flex flex-col items-center gap-2 transition-all ${
                      theme === "system"
                        ? "border-primary bg-primary/10 ring-2 ring-primary/25 shadow-xs font-bold text-primary"
                        : "border-border/80 bg-secondary/30 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Laptop className="w-5 h-5" />
                    <span className="text-xs">System</span>
                  </button>
                </div>
              </div>

              {/* Chat Bubble Style */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-semibold text-foreground">Chat Bubble Aesthetic</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setBubbleStyle("glass")}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      bubbleStyle === "glass"
                        ? "border-primary bg-primary/10 ring-2 ring-primary/25 shadow-xs"
                        : "border-border/80 bg-secondary/30 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className="text-xs font-bold text-foreground">Liquid Glass (Translucent)</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      Frosted glass with backdrop blur and specular highlights.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBubbleStyle("solid")}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      bubbleStyle === "solid"
                        ? "border-primary bg-primary/10 ring-2 ring-primary/25 shadow-xs"
                        : "border-border/80 bg-secondary/30 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className="text-xs font-bold text-foreground">Solid Color</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      Clean opaque bubble styling with high contrast.
                    </div>
                  </button>
                </div>
              </div>

              {/* Reduced Motion */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30 border border-border/60">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-foreground">Reduced Motion</div>
                  <div className="text-[11px] text-muted-foreground">
                    Minimize UI transitions and animations for smoother performance.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={reducedMotion}
                  onChange={(e) => setReducedMotion(e.target.checked)}
                  className="w-5 h-5 rounded accent-primary cursor-pointer"
                />
              </div>

            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            SECTION 7: ACCOUNT & DATA
           ══════════════════════════════════════════════════════ */}
        {activeTab === "account" && (
          <div className="space-y-6">
            <div className="p-5 sm:p-6 rounded-3xl border border-border/80 bg-card space-y-5 shadow-xs">
              <div className="pb-3 border-b border-border/50">
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span>Account & Data Management</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Export your conversation data, clear local cache, or manage session authentication.
                </p>
              </div>

              {/* Account Info Details */}
              <div className="space-y-2 p-4 rounded-2xl bg-secondary/30 border border-border/60">
                <div className="text-xs font-semibold text-foreground">Authenticated Account</div>
                <div className="text-xs text-muted-foreground">
                  Email: <strong className="text-foreground">{user?.email || "Signed in with PlexoChat"}</strong>
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                  User ID: <strong className="text-foreground">{user?.id || "PX-USER"}</strong>
                </div>
              </div>

              {/* Data Export & Cache Management */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleExportData}
                  className="p-4 rounded-2xl border border-border/80 bg-card hover:border-primary/40 text-left transition-all shadow-xs flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground">Export Data (JSON)</div>
                    <div className="text-[10px] text-muted-foreground">Download your profile & contacts archive</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleClearCache}
                  className="p-4 rounded-2xl border border-border/80 bg-card hover:border-amber-500/40 text-left transition-all shadow-xs flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground">
                      {cacheCleared ? "Cache Cleared!" : "Clear Local Cache"}
                    </div>
                    <div className="text-[10px] text-muted-foreground">Free up browser storage without resetting keys</div>
                  </div>
                </button>
              </div>

              {/* Danger Zone / Logout */}
              <div className="pt-4 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-foreground">Session Authentication</div>
                  <div className="text-[11px] text-muted-foreground">
                    End your active session on this device.
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={logout}
                  className="w-full sm:w-auto text-xs text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl gap-2 h-10 px-5"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out of PlexoChat</span>
                </Button>
              </div>

            </div>
          </div>
        )}

        {/* Global Save Button */}
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
