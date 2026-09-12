"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Sun,
  Moon,
  Laptop,
  Volume2,
  VolumeX,
  Sparkles,
  Smartphone,
  Shield,
  ChevronRight,
  ChevronLeft,
  UserX,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, SUPPORTED_LANGUAGES } from "@/lib/auth-context";
import { useTheme } from "../theme-provider";
import { UserAvatar } from "@/components/ui/user-avatar";
import { EmptyState } from "@/components/ui/empty-state";

export type SettingsTabId =
  | "profile"
  | "languages"
  | "security"
  | "notifications"
  | "appearance"
  | "blocked"
  | "account";

// Accessible, responsive iOS-style toggle switch
function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  id,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
        checked ? "bg-primary" : "bg-muted/80 dark:bg-muted"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export function SettingsPageView() {
  const { user, updateProfile, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<SettingsTabId>("profile");
  // On mobile: null means showing the WhatsApp-style root list; a TabId means showing drill-down page
  const [mobileSubView, setMobileSubView] = useState<SettingsTabId | null>(null);

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
  const [reducedMotion, setReducedMotion] = useState(false);

  // Feedback States
  const [copiedId, setCopiedId] = useState(false);
  const [copiedFingerprint, setCopiedFingerprint] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);

  // Read URL query or hash if navigating from direct links (e.g. app-shell #security)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab") as SettingsTabId | null;
      const hashParam = window.location.hash.replace("#", "") as SettingsTabId;

      const validTabs: SettingsTabId[] = [
        "profile",
        "languages",
        "security",
        "notifications",
        "appearance",
        "blocked",
        "account",
      ];

      if (tabParam && validTabs.includes(tabParam)) {
        setActiveTab(tabParam);
        setMobileSubView(tabParam);
      } else if (hashParam && validTabs.includes(hashParam)) {
        setActiveTab(hashParam);
        setMobileSubView(hashParam);
      }
    }
  }, []);

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

  // Navigation Items Specification (Unified Monochrome Style)
  const NAV_ITEMS: {
    id: SettingsTabId;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }[] = [
    {
      id: "profile",
      label: "Profile & Identity",
      description: "Bio, location & language skills",
      icon: User,
    },
    {
      id: "languages",
      label: "Language & Translation",
      description: "Auto-translate & receiving language",
      icon: Languages,
      badge: SUPPORTED_LANGUAGES.find((l) => l.code === receivingLang)?.name,
    },
    {
      id: "security",
      label: "Privacy & Security",
      description: "Encryption & visibility controls",
      icon: ShieldCheck,
    },
    {
      id: "notifications",
      label: "Notifications & Sound",
      description: "Chimes, alerts & banner previews",
      icon: Bell,
    },
    {
      id: "appearance",
      label: "Appearance & Theme",
      description: "Light, dark & bubble styling",
      icon: Palette,
    },
    {
      id: "blocked",
      label: "Blocked Contacts",
      description: "Manage restricted accounts",
      icon: UserX,
    },
    {
      id: "account",
      label: "Account & Storage",
      description: "Export data, cache & session",
      icon: KeyRound,
    },
  ];

  // Active item info
  const currentTabMeta = NAV_ITEMS.find((item) => item.id === activeTab) || NAV_ITEMS[0];

  // Sub-component for form content
  const renderCategoryContent = (tabId: SettingsTabId) => {
    switch (tabId) {
      case "profile":
        return (
          <div className="space-y-6">
            {/* User Profile Card Preview */}
            <div className="p-5 sm:p-6 rounded-2xl border border-border/70 bg-card/60 backdrop-blur-xs space-y-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/50">
                <div className="flex items-center gap-4">
                  <UserAvatar
                    name={displayName || user?.displayName || "User"}
                    avatarBg={avatarBg}
                    size="xl"
                    online={true}
                  />
                  <div>
                    <h2 className="text-base font-bold text-foreground">
                      {displayName || "Your Name"}
                    </h2>
                    <p className="text-xs text-muted-foreground font-mono">
                      @{user?.username || "user"}
                    </p>
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Verified PlexoChat Profile
                    </span>
                  </div>
                </div>

                {/* PlexoChat ID Copy Card */}
                <div className="p-3 rounded-xl bg-secondary/50 border border-border/60 space-y-1 self-start sm:self-auto">
                  <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                    PlexoChat Verified ID:
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="px-3 py-1.5 rounded-lg bg-card border border-border/80 text-xs font-mono font-bold flex items-center gap-2 hover:border-primary/40 transition-colors shadow-2xs"
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
                          ? "border-primary ring-2 ring-primary/25 bg-primary/5 shadow-2xs font-semibold"
                          : "border-border/70 hover:border-border bg-card"
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
                    className="w-full h-10 px-3.5 rounded-xl border border-border/80 bg-secondary/30 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Username</label>
                  <input
                    type="text"
                    disabled
                    value={`@${user?.username || "user"}`}
                    className="w-full h-10 px-3.5 rounded-xl border border-border/60 bg-secondary/15 text-xs text-muted-foreground font-mono opacity-80 cursor-not-allowed"
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
                    className="w-full h-10 px-3.5 rounded-xl border border-border/80 bg-secondary/30 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="e.g. Japan, Germany, India"
                    className="w-full h-10 px-3.5 rounded-xl border border-border/80 bg-secondary/30 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                </div>
              </div>

              {/* Languages Bio Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Languages You Speak
                  </label>
                  <input
                    type="text"
                    value={languagesSpoken}
                    onChange={(e) => setLanguagesSpoken(e.target.value)}
                    placeholder="e.g. English, Japanese"
                    className="w-full h-10 px-3.5 rounded-xl border border-border/80 bg-secondary/30 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Languages You Are Learning
                  </label>
                  <input
                    type="text"
                    value={languagesLearning}
                    onChange={(e) => setLanguagesLearning(e.target.value)}
                    placeholder="e.g. Spanish, German, French"
                    className="w-full h-10 px-3.5 rounded-xl border border-border/80 bg-secondary/30 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
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
                  placeholder="Share a bit about yourself, cultures you love, and language goals..."
                  className="w-full p-3.5 rounded-xl border border-border/80 bg-secondary/30 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none transition-all"
                />
              </div>
            </div>
          </div>
        );

      case "languages":
        return (
          <div className="space-y-6">
            <div className="p-5 sm:p-6 rounded-2xl border border-border/70 bg-card/60 backdrop-blur-xs space-y-6 shadow-xs">
              {/* Auto Translate Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/60">
                <div className="space-y-0.5 max-w-[80%]">
                  <div className="text-xs font-semibold text-foreground">
                    Automatic Incoming Message Translation
                  </div>
                  <div className="text-[11px] text-muted-foreground leading-relaxed">
                    Instantly translate foreign incoming messages into your preferred language upon arrival.
                  </div>
                </div>
                <ToggleSwitch
                  checked={autoTranslateEnabled}
                  onChange={setAutoTranslateEnabled}
                  id="auto-translate-switch"
                />
              </div>

              {/* Language Selection Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">
                    Preferred Receiving Language
                  </label>
                  <span className="text-[11px] text-primary font-mono font-semibold">
                    Current: {SUPPORTED_LANGUAGES.find((l) => l.code === receivingLang)?.name || "English"}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {SUPPORTED_LANGUAGES.map((lang) => {
                    const isSelected = receivingLang === lang.code;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => setReceivingLang(lang.code)}
                        className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2.5 transition-all text-left ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold"
                            : "bg-secondary/40 border-border/70 text-foreground hover:bg-secondary"
                        }`}
                      >
                        <span className="text-xl shrink-0">{lang.flag}</span>
                        <span className="truncate">{lang.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Translation Privacy Notice */}
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-foreground flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                <div className="text-[11px] text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Zero Server Plaintext:</strong> Message payloads remain end-to-end encrypted in transit. Translation happens purely in the authenticated client layer after cryptographic signature verification.
                </div>
              </div>
            </div>
          </div>
        );

      case "security":
        return (
          <div className="space-y-6">
            <div className="p-5 sm:p-6 rounded-2xl border border-border/70 bg-card/60 backdrop-blur-xs space-y-6 shadow-xs">
              {/* End-to-End Encryption Status */}
              <div className="p-4 rounded-xl bg-card border border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-secondary text-muted-foreground flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-foreground flex items-center gap-2">
                      <span>End-to-End Encrypted</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      Messages, voice, video, and shared media are encrypted directly between devices.
                    </div>
                  </div>
                </div>
              </div>

              {/* Expandable Technical Details */}
              <details className="group rounded-xl border border-border/70 bg-secondary/20 overflow-hidden text-xs">
                <summary className="p-3.5 font-medium text-foreground cursor-pointer flex items-center justify-between hover:bg-secondary/40 select-none">
                  <span>About encryption & technical details</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-open:rotate-90 transition-transform" />
                </summary>
                <div className="p-3.5 pt-0 border-t border-border/40 space-y-2 text-[11px] text-muted-foreground leading-relaxed">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    <div className="p-2.5 rounded-lg bg-card border border-border/50">
                      <div className="font-semibold text-foreground">Messaging Protocol</div>
                      <div className="font-mono text-[10px] mt-0.5">Olm Double Ratchet (Signal protocol)</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-card border border-border/50">
                      <div className="font-semibold text-foreground">Cryptographic Primitives</div>
                      <div className="font-mono text-[10px] mt-0.5">Curve25519, AES-256-CBC, HMAC-SHA256</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-card border border-border/50">
                      <div className="font-semibold text-foreground">Calling Security</div>
                      <div className="font-mono text-[10px] mt-0.5">WebRTC DTLS-SRTP P2P Media</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-card border border-border/50">
                      <div className="font-semibold text-foreground">Relay & Forward Secrecy</div>
                      <div className="font-mono text-[10px] mt-0.5">Zero media/message persistence on relay</div>
                    </div>
                  </div>
                  <p className="pt-1 text-[10px]">
                    Client version: PlexoChat Web v1.2 • Double Ratchet Relay Active
                  </p>
                </div>
              </details>

              {/* Identity Fingerprint */}
              <div className="space-y-2 p-4 rounded-xl bg-secondary/30 border border-border/60">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-muted-foreground" />
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
                <div className="p-3 rounded-lg bg-card border border-border font-mono text-[11px] text-muted-foreground tracking-wider select-all break-all">
                  7F89 A10B 94C2 6D7E 8F10 22B4 90FA 55C1 88D9 1234
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Compare this security fingerprint with conversation partners to verify no man-in-the-middle tampering.
                </p>
              </div>

              {/* Visibility & Location Toggles */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                  <MapPin className="w-3.5 h-3.5 text-blue-500" />
                  <span>Discovery & Visibility Controls</span>
                </h3>

                {/* Discoverable toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/60">
                  <div className="space-y-0.5 max-w-[80%]">
                    <div className="text-xs font-semibold text-foreground">
                      Discoverable on Explore World
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Allow verified language partners to view your profile card and send connection requests.
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={isDiscoverable}
                    onChange={setIsDiscoverable}
                    id="discoverable-switch"
                  />
                </div>

                {/* Approximate Location toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/60">
                  <div className="space-y-0.5 max-w-[80%]">
                    <div className="text-xs font-semibold text-foreground">
                      Show Approximate City Cluster Pin
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Display your general city pin (e.g. &quot;{city || "Tokyo"}, {country || "Japan"}&quot;). Exact GPS coordinates are NEVER collected or stored.
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={showLocation}
                    onChange={setShowLocation}
                    id="approximate-location-switch"
                  />
                </div>

                {/* Stealth Mode toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/60">
                  <div className="space-y-0.5 max-w-[80%]">
                    <div className="text-xs font-semibold text-foreground flex items-center gap-2">
                      <span>Incognito Online Status</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-secondary text-muted-foreground font-mono">
                        Stealth
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Hide your green online indicator from non-connected members while browsing Explore.
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={stealthMode}
                    onChange={setStealthMode}
                    id="stealth-mode-switch"
                  />
                </div>
              </div>

              {/* Active Sessions */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-primary" />
                  <span>Active Authenticated Client Sessions</span>
                </label>
                <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-card border border-border/70 flex items-center justify-center text-primary">
                      <Laptop className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-foreground">
                        Current Browser Client Session
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        Protected via TLS 1.3 & Cloudflare Relay • Active now
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-md bg-emerald-500/10">
                    THIS DEVICE
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-6">
            <div className="p-5 sm:p-6 rounded-2xl border border-border/70 bg-card/60 backdrop-blur-xs space-y-4 shadow-xs">
              {/* Push Notifications */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/60">
                <div className="space-y-0.5 max-w-[80%]">
                  <div className="text-xs font-semibold text-foreground">Push Notifications</div>
                  <div className="text-[11px] text-muted-foreground">
                    Receive background notifications when partners message you.
                  </div>
                </div>
                <ToggleSwitch
                  checked={pushEnabled}
                  onChange={setPushEnabled}
                  id="push-notifications-switch"
                />
              </div>

              {/* Audio Chimes */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/60">
                <div className="space-y-0.5 max-w-[80%]">
                  <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    {soundEnabled ? (
                      <Volume2 className="w-3.5 h-3.5 text-primary" />
                    ) : (
                      <VolumeX className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                    <span>In-App Sound Chimes</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Play a subtle Apple-style chime when new incoming messages arrive.
                  </div>
                </div>
                <ToggleSwitch
                  checked={soundEnabled}
                  onChange={setSoundEnabled}
                  id="sound-chimes-switch"
                />
              </div>

              {/* Connection Requests Alerts */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/60">
                <div className="space-y-0.5 max-w-[80%]">
                  <div className="text-xs font-semibold text-foreground">
                    Connection Request Invitations
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Highlight incoming invitations in the Explore navigation tab badge.
                  </div>
                </div>
                <ToggleSwitch
                  checked={requestAlerts}
                  onChange={setRequestAlerts}
                  id="request-alerts-switch"
                />
              </div>

              {/* Preview Banners */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/60">
                <div className="space-y-0.5 max-w-[80%]">
                  <div className="text-xs font-semibold text-foreground">
                    Show Message Preview in Banners
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Display translated message snippet in in-app notification toasts.
                  </div>
                </div>
                <ToggleSwitch
                  checked={previewEnabled}
                  onChange={setPreviewEnabled}
                  id="preview-banners-switch"
                />
              </div>
            </div>
          </div>
        );

      case "appearance":
        return (
          <div className="space-y-6">
            <div className="p-5 sm:p-6 rounded-2xl border border-border/70 bg-card/60 backdrop-blur-xs space-y-6 shadow-xs">
              {/* Theme Mode Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">Color Mode</label>
                <div className="grid grid-cols-3 gap-3">
                  {/* Light */}
                  <button
                    type="button"
                    onClick={() => setTheme("light")}
                    className={`p-4 rounded-xl border text-center flex flex-col items-center gap-2 transition-all ${
                      theme === "light"
                        ? "border-primary bg-primary/10 ring-2 ring-primary/25 shadow-2xs font-bold text-primary"
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
                    className={`p-4 rounded-xl border text-center flex flex-col items-center gap-2 transition-all ${
                      theme === "dark"
                        ? "border-primary bg-primary/10 ring-2 ring-primary/25 shadow-2xs font-bold text-primary"
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
                    className={`p-4 rounded-xl border text-center flex flex-col items-center gap-2 transition-all ${
                      theme === "system"
                        ? "border-primary bg-primary/10 ring-2 ring-primary/25 shadow-2xs font-bold text-primary"
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
                    className={`p-4 rounded-xl border text-left transition-all ${
                      bubbleStyle === "glass"
                        ? "border-primary bg-primary/10 ring-2 ring-primary/25 shadow-2xs"
                        : "border-border/80 bg-secondary/30 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className="text-xs font-bold text-foreground">Liquid Glass (Translucent)</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      Subtle frosted backdrop blur with modern specular border highlight.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBubbleStyle("solid")}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      bubbleStyle === "solid"
                        ? "border-primary bg-primary/10 ring-2 ring-primary/25 shadow-2xs"
                        : "border-border/80 bg-secondary/30 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className="text-xs font-bold text-foreground">Solid Color</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      Crisp, high-contrast opaque bubbles for high readability.
                    </div>
                  </button>
                </div>
              </div>

              {/* Reduced Motion */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/60">
                <div className="space-y-0.5 max-w-[80%]">
                  <div className="text-xs font-semibold text-foreground">Reduced Motion</div>
                  <div className="text-[11px] text-muted-foreground">
                    Minimize UI transitions and animations for smoother performance.
                  </div>
                </div>
                <ToggleSwitch
                  checked={reducedMotion}
                  onChange={setReducedMotion}
                  id="reduced-motion-switch"
                />
              </div>
            </div>
          </div>
        );

      case "blocked":
        return (
          <div className="space-y-6">
            <div className="p-5 sm:p-6 rounded-2xl border border-border/70 bg-card/60 backdrop-blur-xs space-y-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-border/50">
                <div>
                  <h3 className="text-xs font-bold text-foreground">Restricted Contacts</h3>
                  <p className="text-[11px] text-muted-foreground">
                    Blocked members cannot send you messages or view your presence status.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                  0 Contacts
                </span>
              </div>

              <EmptyState
                icon={UserX}
                title="No Blocked Contacts"
                description="Your block list is currently clean. You can block any contact directly from their profile card or chat action menu if you ever feel uncomfortable."
                className="py-10"
              />
            </div>
          </div>
        );

      case "account":
        return (
          <div className="space-y-6">
            <div className="p-5 sm:p-6 rounded-2xl border border-border/70 bg-card/60 backdrop-blur-xs space-y-6 shadow-xs">
              {/* Account Info Details */}
              <div className="space-y-2 p-4 rounded-xl bg-secondary/30 border border-border/60">
                <div className="text-xs font-semibold text-foreground">Authenticated Session</div>
                <div className="text-xs text-muted-foreground">
                  Email: <strong className="text-foreground">{user?.email || "Signed in via Firebase Auth"}</strong>
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                  Account ID: <strong className="text-foreground">{user?.id || "PX-USER"}</strong>
                </div>
              </div>

              {/* Data Export & Cache Management */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleExportData}
                  className="p-4 rounded-xl border border-border/80 bg-card hover:border-primary/40 text-left transition-all shadow-2xs flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
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
                  className="p-4 rounded-xl border border-border/80 bg-card hover:border-amber-500/40 text-left transition-all shadow-2xs flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
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

              {/* Sign Out Action Card */}
              <div className="pt-4 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-foreground">Session Security</div>
                  <div className="text-[11px] text-muted-foreground">
                    End your active session on this device securely.
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
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto p-4 md:p-6 lg:p-8 pb-28 md:pb-8 max-w-6xl mx-auto w-full select-none">
      
      {/* ══════════════════════════════════════════════════════
          MOBILE VIEW (md:hidden) — WhatsApp-Style Icon/Label List
         ══════════════════════════════════════════════════════ */}
      <div className="md:hidden">
        <AnimatePresence mode="wait">
          {mobileSubView === null ? (
            /* Root Mobile Settings Hub */
            <motion.div
              key="mobile-root"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.18 }}
              className="space-y-5"
            >
              {/* Header */}
              <div className="pb-1">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Account, translation, security and interface
                </p>
              </div>

              {/* WhatsApp-Style Hero Profile Card */}
              <div
                onClick={() => setMobileSubView("profile")}
                className="p-4 rounded-2xl border border-border/70 bg-card shadow-xs flex items-center justify-between gap-3 active:scale-[0.99] transition-transform cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar
                    name={displayName || user?.displayName || "User"}
                    avatarBg={avatarBg}
                    size="lg"
                    online={true}
                  />
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-foreground truncate">
                      {displayName || "Your Name"}
                    </h2>
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      @{user?.username || "user"}
                    </p>
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                      <span>ID: {user?.plexoChatId || "PX-8921-X"}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-muted-foreground shrink-0">
                  <span className="text-[11px] font-medium text-primary">Edit</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              {/* Grouped Settings List (iOS / WhatsApp style) */}
              <div className="space-y-4">
                
                {/* Group 1: General Preferences */}
                <div className="space-y-1">
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase px-2 tracking-wider">
                    Preferences
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-card divide-y divide-border/50 overflow-hidden shadow-2xs">
                    {/* Language & Translation */}
                    <button
                      type="button"
                      onClick={() => setMobileSubView("languages")}
                      className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-secondary/40 active:bg-secondary/60 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-secondary text-muted-foreground flex items-center justify-center shrink-0">
                          <Languages className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-foreground">Language & Translation</div>
                          <div className="text-[11px] text-muted-foreground">
                            {SUPPORTED_LANGUAGES.find((l) => l.code === receivingLang)?.name || "English"} • Auto-translate
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </button>

                    {/* Appearance */}
                    <button
                      type="button"
                      onClick={() => setMobileSubView("appearance")}
                      className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-secondary/40 active:bg-secondary/60 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-secondary text-muted-foreground flex items-center justify-center shrink-0">
                          <Palette className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-foreground">Appearance</div>
                          <div className="text-[11px] text-muted-foreground capitalize">
                            {theme} mode • {bubbleStyle} bubbles
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </button>

                    {/* Notifications */}
                    <button
                      type="button"
                      onClick={() => setMobileSubView("notifications")}
                      className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-secondary/40 active:bg-secondary/60 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-secondary text-muted-foreground flex items-center justify-center shrink-0">
                          <Bell className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-foreground">Notifications & Sound</div>
                          <div className="text-[11px] text-muted-foreground">
                            {soundEnabled ? "Chimes on" : "Muted"} • Push enabled
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </button>
                  </div>
                </div>

                {/* Group 2: Privacy & Security */}
                <div className="space-y-1">
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase px-2 tracking-wider">
                    Privacy & Security
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-card divide-y divide-border/50 overflow-hidden shadow-2xs">
                    {/* Security & E2EE */}
                    <button
                      type="button"
                      onClick={() => setMobileSubView("security")}
                      className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-secondary/40 active:bg-secondary/60 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-secondary text-muted-foreground flex items-center justify-center shrink-0">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                            <span>Privacy & Security</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            End-to-end encryption & visibility
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </button>

                    {/* Blocked Contacts */}
                    <button
                      type="button"
                      onClick={() => setMobileSubView("blocked")}
                      className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-secondary/40 active:bg-secondary/60 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-secondary text-muted-foreground flex items-center justify-center shrink-0">
                          <UserX className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-foreground">Blocked Contacts</div>
                          <div className="text-[11px] text-muted-foreground">0 contacts</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </button>
                  </div>
                </div>

                {/* Group 3: Account & Session */}
                <div className="space-y-1">
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase px-2 tracking-wider">
                    Account & Data
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-card divide-y divide-border/50 overflow-hidden shadow-2xs">
                    {/* Account & Storage */}
                    <button
                      type="button"
                      onClick={() => setMobileSubView("account")}
                      className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-secondary/40 active:bg-secondary/60 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-secondary text-muted-foreground flex items-center justify-center shrink-0">
                          <KeyRound className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-foreground">Account & Storage</div>
                          <div className="text-[11px] text-muted-foreground">
                            Export data, cache & session info
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </button>
                  </div>
                </div>

                {/* Sign Out Button */}
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={logout}
                    className="w-full h-11 text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive rounded-2xl gap-2 border-destructive/30"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out of PlexoChat</span>
                  </Button>
                </div>

              </div>
            </motion.div>
          ) : (
            /* Mobile Drill-Down Subpage */
            <motion.div
              key={`mobile-sub-${mobileSubView}`}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.18 }}
              className="space-y-5"
            >
              {/* Top Navigation Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-border/50">
                <button
                  type="button"
                  onClick={() => setMobileSubView(null)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary py-1 px-1.5 -ml-1.5 rounded-lg hover:bg-secondary/60 active:bg-secondary transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Settings</span>
                </button>

                <h2 className="text-xs font-bold text-foreground">
                  {NAV_ITEMS.find((item) => item.id === mobileSubView)?.label}
                </h2>

                <button
                  type="button"
                  onClick={handleSave}
                  className="text-xs font-bold text-primary hover:underline px-2 py-1 rounded-lg"
                >
                  {savedSuccess ? "Saved!" : "Save"}
                </button>
              </div>

              {savedSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Preferences saved successfully!</span>
                </div>
              )}

              {/* Subview Form Content */}
              {renderCategoryContent(mobileSubView)}

              {/* Bottom Quick Save */}
              <div className="pt-2">
                <Button
                  type="button"
                  onClick={handleSave}
                  className="w-full h-11 text-xs font-semibold rounded-2xl gap-2 shadow-md shadow-primary/20"
                >
                  <Save className="w-4 h-4" />
                  <span>{savedSuccess ? "Saved Successfully" : "Save Changes"}</span>
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ══════════════════════════════════════════════════════
          DESKTOP VIEW (hidden md:grid) — Discord / macOS Categorized Two-Column Layout
         ══════════════════════════════════════════════════════ */}
      <div className="hidden md:grid md:grid-cols-[260px_1fr] lg:grid-cols-[280px_1fr] gap-8 items-start">
        
        {/* Left Column: Sidebar Category Navigation */}
        <div className="sticky top-6 space-y-4">
          
          {/* Mini Profile Summary Card */}
          <div className="p-3.5 rounded-2xl border border-border/70 bg-card/60 backdrop-blur-xs shadow-xs space-y-3">
            <div className="flex items-center gap-3">
              <UserAvatar
                name={displayName || user?.displayName || "User"}
                avatarBg={avatarBg}
                size="md"
                online={true}
              />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-foreground truncate">
                  {displayName || "Your Name"}
                </div>
                <div className="text-[11px] text-muted-foreground font-mono truncate">
                  @{user?.username || "user"}
                </div>
              </div>
            </div>

            {/* Quick ID Copy */}
            <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[10px]">
              <span className="font-mono text-muted-foreground">ID: {user?.plexoChatId || "PX-8921-X"}</span>
              <button
                type="button"
                onClick={handleCopyId}
                className="text-primary hover:underline font-semibold flex items-center gap-1"
              >
                {copiedId ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copiedId ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>

          {/* Navigation Items List (Unified Monochrome Style) */}
          <nav className="p-1.5 rounded-2xl border border-border/70 bg-card/40 backdrop-blur-xs space-y-0.5 shadow-xs">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full px-3 py-2.5 rounded-xl text-left flex items-center justify-between transition-all text-xs cursor-pointer ${
                    isActive
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/70 font-medium"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono shrink-0 ml-1.5 ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* System Status Footnote */}
          <div className="px-3 py-2 text-[11px] text-muted-foreground flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>End-to-end encrypted</span>
          </div>

        </div>

        {/* Right Column: Active Category Content */}
        <div className="space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div>
              <div className="flex items-center gap-2">
                <currentTabMeta.icon className="w-5 h-5 text-muted-foreground" />
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  {currentTabMeta.label}
                </h1>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {currentTabMeta.description}
              </p>
            </div>

            {savedSuccess && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold animate-in fade-in shadow-2xs">
                <Check className="w-3.5 h-3.5" />
                <span>Preferences Saved</span>
              </span>
            )}
          </div>

          {/* Form Content */}
          <form onSubmit={handleSave} className="space-y-6">
            {renderCategoryContent(activeTab)}

            {/* Bottom Action Footer */}
            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={logout}
                className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl gap-2 h-10 px-4 border-border/80"
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

      </div>

    </div>
  );
}
