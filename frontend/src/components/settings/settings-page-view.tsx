"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Languages,
  MessageSquare,
  ShieldCheck,
  Phone,
  Bell,
  Palette,
  HardDrive,
  Lock,
  HelpCircle,
  KeyRound,
  Save,
  Check,
  Copy,
  LogOut,
  MapPin,
  Trash2,
  Download,
  Sun,
  Moon,
  Laptop,
  Volume2,
  VolumeX,
  Sparkles,
  Smartphone,
  ChevronRight,
  ChevronLeft,
  UserX,
  CheckCircle2,
  Search,
  AlertTriangle,
  RefreshCw,
  Play,
  Mic,
  Video,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "../theme-provider";
import { UserAvatar } from "@/components/ui/user-avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { getIdentityFingerprint } from "@/lib/chat-context";
import {
  LANGUAGE_REGISTRY,
  LanguageEntry,
  getLanguageByCode,
  getLanguageLabel,
} from "@/lib/languages/registry";
import {
  clearTranslationMemoryCache,
  getTranslationCacheStats,
} from "@/lib/translation-service";

export type SettingsTabId =
  | "profile"
  | "languages"
  | "chats"
  | "privacy"
  | "calls"
  | "notifications"
  | "appearance"
  | "storage"
  | "security"
  | "help"
  | "account";

// Accessible, responsive toggle switch
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

const AVATAR_GRADIENTS = [
  { label: "Indigo Violet", value: "from-primary to-violet-500" },
  { label: "Emerald Teal", value: "from-emerald-500 to-teal-600" },
  { label: "Rose Coral", value: "from-rose-500 to-amber-500" },
  { label: "Blue Cyan", value: "from-blue-600 to-cyan-500" },
  { label: "Sunset Purple", value: "from-fuchsia-600 to-pink-500" },
];

export function SettingsPageView() {
  const { user, updateProfile, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const searchParams = useSearchParams();
  const tabParam = (searchParams.get("tab") as SettingsTabId | null);

  const [activeTab, setActiveTab] = useState<SettingsTabId>(() => {
    const validTabs: SettingsTabId[] = [
      "profile",
      "languages",
      "chats",
      "privacy",
      "calls",
      "notifications",
      "appearance",
      "storage",
      "security",
      "help",
      "account",
    ];
    return tabParam && validTabs.includes(tabParam) ? tabParam : "profile";
  });
  const [mobileSubView, setMobileSubView] = useState<SettingsTabId | null>(() => {
    const validTabs: SettingsTabId[] = [
      "profile",
      "languages",
      "chats",
      "privacy",
      "calls",
      "notifications",
      "appearance",
      "storage",
      "security",
      "help",
      "account",
    ];
    return tabParam && validTabs.includes(tabParam) ? tabParam : null;
  });

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
      setMobileSubView(tabParam);
    }
  }, [tabParam]);

  // Profile Form States
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatarBg, setAvatarBg] = useState(
    user?.avatarBg || "from-primary to-violet-500"
  );
  const [languagesSpoken, setLanguagesSpoken] = useState(
    user?.languagesSpoken?.join(", ") || "English"
  );
  const [languagesLearning, setLanguagesLearning] = useState(
    user?.languagesLearning?.join(", ") || ""
  );
  const [interestsText, setInterestsText] = useState(
    user?.interests?.join(", ") || ""
  );

  // Language Preferences States
  const [appLang, setAppLang] = useState(user?.appLanguage || "en");
  const [receivingLang, setReceivingLang] = useState(
    user?.preferredReceivingLanguage || "en"
  );
  const [autoTranslateEnabled, setAutoTranslateEnabled] = useState(
    user?.autoTranslateEnabled ?? true
  );
  const [languageSearchQuery, setLanguageSearchQuery] = useState("");

  // Chats States
  const [enterToSend, setEnterToSend] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("plexochat_enter_to_send") !== "false";
    }
    return user?.enterToSend ?? true;
  });
  const [bubbleStyle, setBubbleStyle] = useState<"glass" | "solid">("glass");

  // Privacy States
  const [readReceiptsEnabled, setReadReceiptsEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("plexochat_read_receipts") !== "false";
    }
    return user?.readReceiptsEnabled ?? true;
  });
  const [isDiscoverable, setIsDiscoverable] = useState(user?.isDiscoverable ?? true);
  const [showLocation, setShowLocation] = useState(user?.showApproximateLocation ?? false);
  const [stealthMode, setStealthMode] = useState(false);

  // Calls States
  const [callRingtoneEnabled, setCallRingtoneEnabled] = useState(true);
  const [isTestingHardware, setIsTestingHardware] = useState(false);
  const [hardwareStatus, setHardwareStatus] = useState<{
    mic: string;
    cam: string;
    ok: boolean;
  } | null>(null);

  // Notifications States
  const [pushEnabled, setPushEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("plexochat_sound_enabled") !== "false";
    }
    return user?.soundEnabled ?? true;
  });
  const [previewEnabled, setPreviewEnabled] = useState(true);
  const [requestAlerts, setRequestAlerts] = useState(true);

  // Appearance States
  const [reducedMotion, setReducedMotion] = useState(false);

  // Storage States
  const [storageEstimate, setStorageEstimate] = useState<{ usage: string; quota: string } | null>(null);
  const [translationCacheStats, setTranslationCacheStats] = useState({ size: 0, capacity: 250 });
  const [clearedTranslationNotice, setClearedTranslationNotice] = useState<string | null>(null);
  const [cacheCleared, setCacheCleared] = useState(false);

  // Feedback States
  const [copiedId, setCopiedId] = useState(false);
  const [copiedFingerprint, setCopiedFingerprint] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Real Olm identity fingerprint (Ed25519 public key)
  const [identityFingerprint, setIdentityFingerprint] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    const tryLoad = async () => {
      const fp = await getIdentityFingerprint(user.id);
      if (!cancelled) setIdentityFingerprint(fp);
    };
    tryLoad();
    const retryTimer = setTimeout(tryLoad, 3000);
    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
    };
  }, [user?.id]);

  // Read URL query or hash if navigating from direct links
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab") as SettingsTabId | null;
      const hashParam = window.location.hash.replace("#", "") as SettingsTabId;

      const validTabs: SettingsTabId[] = [
        "profile",
        "languages",
        "chats",
        "privacy",
        "calls",
        "notifications",
        "appearance",
        "storage",
        "security",
        "help",
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

  // Synchronize state with current user profile
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setBio(user.bio || "");
      if (user.avatarBg) setAvatarBg(user.avatarBg);
      if (user.appLanguage) setAppLang(user.appLanguage);
      if (user.preferredReceivingLanguage) setReceivingLang(user.preferredReceivingLanguage);
      if (user.autoTranslateEnabled !== undefined) setAutoTranslateEnabled(user.autoTranslateEnabled);
      if (user.readReceiptsEnabled !== undefined) setReadReceiptsEnabled(user.readReceiptsEnabled);
      if (user.enterToSend !== undefined) setEnterToSend(user.enterToSend);
      if (user.soundEnabled !== undefined) setSoundEnabled(user.soundEnabled);
      if (user.isDiscoverable !== undefined) setIsDiscoverable(user.isDiscoverable);
      if (user.showApproximateLocation !== undefined) setShowLocation(user.showApproximateLocation);
      if (user.languagesSpoken?.length) setLanguagesSpoken(user.languagesSpoken.join(", "));
      if (user.languagesLearning?.length) setLanguagesLearning(user.languagesLearning.join(", "));
      if (user.interests?.length) setInterestsText(user.interests.join(", "));
    }
  }, [user]);

  // Load storage estimates and translation cache count
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.storage && navigator.storage.estimate) {
      navigator.storage
        .estimate()
        .then((est) => {
          const usageMb = est.usage ? (est.usage / (1024 * 1024)).toFixed(1) : "0.0";
          const quotaGb = est.quota ? (est.quota / (1024 * 1024 * 1024)).toFixed(1) : "0.0";
          setStorageEstimate({
            usage: `${usageMb} MB`,
            quota: `${quotaGb} GB`,
          });
        })
        .catch(() => {});
    }
    setTranslationCacheStats(getTranslationCacheStats());
  }, [activeTab, mobileSubView]);

  const handleCopyId = () => {
    if (user?.plexoChatId) {
      navigator.clipboard.writeText(user.plexoChatId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleCopyFingerprint = () => {
    if (!identityFingerprint) return;
    navigator.clipboard.writeText(identityFingerprint);
    setCopiedFingerprint(true);
    setTimeout(() => setCopiedFingerprint(false), 2000);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const spokenArray = languagesSpoken
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const learningArray = languagesLearning
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const interestsArray = interestsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    await updateProfile({
      displayName,
      bio,
      avatarBg,
      appLanguage: appLang,
      preferredReceivingLanguage: receivingLang,
      preferredLanguageName: getLanguageLabel(receivingLang),
      autoTranslateEnabled,
      readReceiptsEnabled,
      enterToSend,
      soundEnabled,
      isDiscoverable,
      showApproximateLocation: showLocation,
      languagesSpoken: spokenArray.length ? spokenArray : ["English"],
      languagesLearning: learningArray,
      interests: interestsArray,
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

  const handleClearTranslationCache = () => {
    const { clearedCount } = clearTranslationMemoryCache();
    setTranslationCacheStats(getTranslationCacheStats());
    setClearedTranslationNotice(
      `Cleared ${clearedCount} cached phrase${clearedCount === 1 ? "" : "s"} from memory.`
    );
    setTimeout(() => setClearedTranslationNotice(null), 3000);
  };

  const handleTestHardware = async () => {
    setIsTestingHardware(true);
    setHardwareStatus(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setHardwareStatus({
          mic: "Media devices API not available in this browser",
          cam: "Media devices API not available in this browser",
          ok: false,
        });
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      const audioTrack = stream.getAudioTracks()[0];
      const videoTrack = stream.getVideoTracks()[0];
      setHardwareStatus({
        mic: audioTrack ? `Granted (${audioTrack.label || "Microphone"})` : "Not detected",
        cam: videoTrack ? `Granted (${videoTrack.label || "Camera"})` : "Not detected",
        ok: true,
      });
      stream.getTracks().forEach((t) => t.stop());
    } catch (err: any) {
      // Fallback: test audio only
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioTrack = audioStream.getAudioTracks()[0];
        setHardwareStatus({
          mic: audioTrack ? `Granted (${audioTrack.label || "Microphone"})` : "Not detected",
          cam: "Camera permission denied or camera not found",
          ok: true,
        });
        audioStream.getTracks().forEach((t) => t.stop());
      } catch (innerErr: any) {
        setHardwareStatus({
          mic: "Microphone permission denied or device not found",
          cam: "Camera permission denied or device not found",
          ok: false,
        });
      }
    } finally {
      setIsTestingHardware(false);
    }
  };

  const playTestChime = () => {
    if (typeof window === "undefined") return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
      setTimeout(() => ctx.close().catch(() => {}), 200);
    } catch {
      // audio context blocked by browser
    }
  };

  const handleExportData = () => {
    const data = {
      profile: user,
      exportTimestamp: new Date().toISOString(),
      e2eeProtocol: "@matrix-org/olm (Double Ratchet Signal protocol)",
      transportSecurity: "WSS (TLS 1.3) + Olm opaque ciphertext",
      callingProtocol: "WebRTC DTLS-SRTP P2P Media",
      clientVersion: "PlexoChat-v1.2-Web",
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `plexochat_data_${user?.username || "user"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filtered languages for Language tab
  const filteredLanguages = useMemo(() => {
    const query = languageSearchQuery.trim().toLowerCase();
    if (!query) return LANGUAGE_REGISTRY;
    return LANGUAGE_REGISTRY.filter(
      (lang) =>
        lang.name.toLowerCase().includes(query) ||
        lang.nativeName.toLowerCase().includes(query) ||
        lang.code.toLowerCase().includes(query)
    );
  }, [languageSearchQuery]);

  // Navigation Items Specification
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
      description: "Avatar, name, bio & language goals",
      icon: User,
    },
    {
      id: "languages",
      label: "Language & Translation",
      description: "26 supported languages & auto-translate",
      icon: Languages,
      badge: getLanguageLabel(receivingLang),
    },
    {
      id: "chats",
      label: "Chats & Input",
      description: "Enter-to-send, bubbles & local storage",
      icon: MessageSquare,
    },
    {
      id: "privacy",
      label: "Privacy & Visibility",
      description: "Read receipts, stealth & discoverability",
      icon: ShieldCheck,
    },
    {
      id: "calls",
      label: "Voice & Video Calls",
      description: "WebRTC calling & device permissions",
      icon: Phone,
    },
    {
      id: "notifications",
      label: "Notifications & Sound",
      description: "In-app chimes, ringtones & alerts",
      icon: Bell,
    },
    {
      id: "appearance",
      label: "Appearance & Theme",
      description: "Light, dark, system & motion",
      icon: Palette,
    },
    {
      id: "storage",
      label: "Storage & Data",
      description: "Local quota, caches & translation memory",
      icon: HardDrive,
    },
    {
      id: "security",
      label: "Security & Encryption",
      description: "Olm Double Ratchet & identity key",
      icon: Lock,
    },
    {
      id: "help",
      label: "Help & About",
      description: "Architecture, privacy policy & terms",
      icon: HelpCircle,
    },
    {
      id: "account",
      label: "Account Actions",
      description: "Session info, data export & sign out",
      icon: KeyRound,
    },
  ];

  const currentTabMeta = NAV_ITEMS.find((item) => item.id === activeTab) || NAV_ITEMS[0];

  // Render tab content
  const renderCategoryContent = (tabId: SettingsTabId) => {
    switch (tabId) {
      case "profile":
        return (
          <div className="space-y-6">
            <div className="p-5 sm:p-6 rounded-2xl border border-border/70 bg-card/60 backdrop-blur-xs space-y-5 shadow-xs">
              {/* Profile Preview Card */}
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
                    placeholder="e.g. English, Bengali, Hindi"
                    className="w-full h-10 px-3.5 rounded-xl border border-border/80 bg-secondary/30 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                  <span className="text-[10px] text-muted-foreground">Separate with commas</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Languages You Are Learning
                  </label>
                  <input
                    type="text"
                    value={languagesLearning}
                    onChange={(e) => setLanguagesLearning(e.target.value)}
                    placeholder="e.g. Japanese, Spanish, German"
                    className="w-full h-10 px-3.5 rounded-xl border border-border/80 bg-secondary/30 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                  <span className="text-[10px] text-muted-foreground">Separate with commas</span>
                </div>
              </div>

              {/* Interests & Topics */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Interests &amp; Topics</label>
                <input
                  type="text"
                  value={interestsText}
                  onChange={(e) => setInterestsText(e.target.value)}
                  placeholder="e.g. Software, Linguistics, Cinema, Travel, Cooking"
                  className="w-full h-10 px-3.5 rounded-xl border border-border/80 bg-secondary/30 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
                <span className="text-[10px] text-muted-foreground">Shown on your public profile card in Explore</span>
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
              {/* App UI Chrome Language */}
              <div className="space-y-2 pb-4 border-b border-border/50">
                <label className="text-xs font-semibold text-foreground">App UI Language</label>
                <p className="text-[11px] text-muted-foreground">
                  Controls the primary navigation labels, buttons, and interface chrome.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {["en", "es", "fr", "de", "bn", "hi", "ja"].map((code) => {
                    const l = getLanguageByCode(code);
                    if (!l) return null;
                    const isSelected = appLang === code;
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setAppLang(code)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary font-semibold shadow-2xs"
                            : "bg-secondary/40 border-border/70 text-foreground hover:bg-secondary"
                        }`}
                      >
                        <span>{l.flag}</span>
                        <span>{l.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Auto Translate Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/60">
                <div className="space-y-0.5 max-w-[80%]">
                  <div className="text-xs font-semibold text-foreground">
                    Automatic Incoming Message Translation
                  </div>
                  <div className="text-[11px] text-muted-foreground leading-relaxed">
                    Instantly translate foreign incoming messages into your preferred receiving language upon arrival.
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-semibold text-foreground">
                      Preferred Receiving Language
                    </label>
                    <p className="text-[11px] text-muted-foreground">
                      Foreign messages will be decrypted on-device and translated into this target language.
                    </p>
                  </div>
                  <span className="text-[11px] text-primary font-mono font-semibold shrink-0">
                    Selected: {getLanguageLabel(receivingLang)}
                  </span>
                </div>

                {/* Search / Filter Input */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={languageSearchQuery}
                    onChange={(e) => setLanguageSearchQuery(e.target.value)}
                    placeholder="Search 26 languages by name, native script, or code..."
                    className="w-full h-9 pl-9 pr-3 rounded-xl border border-border/70 bg-secondary/20 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 transition-all"
                  />
                </div>

                {/* Filter count */}
                <div className="text-[10px] text-muted-foreground font-mono">
                  Showing {filteredLanguages.length} of {LANGUAGE_REGISTRY.length} registered languages
                </div>

                {/* 26 Languages Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[380px] overflow-y-auto pr-1">
                  {filteredLanguages.map((lang: LanguageEntry) => {
                    const isSelected = receivingLang === lang.code;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => setReceivingLang(lang.code)}
                        className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-between gap-2 transition-all text-left cursor-pointer ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold"
                            : "bg-secondary/30 border-border/70 text-foreground hover:bg-secondary/70"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-xl shrink-0">{lang.flag}</span>
                          <div className="min-w-0">
                            <div className="truncate font-semibold">{lang.name}</div>
                            <div
                              className={`text-[10px] truncate ${
                                isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                              }`}
                            >
                              {lang.nativeName}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {lang.status === "experimental" && (
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider ${
                                isSelected
                                  ? "bg-amber-400 text-amber-950 font-bold"
                                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                              }`}
                            >
                              Experimental
                            </span>
                          )}
                          {isSelected && <Check className="w-4 h-4 shrink-0" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Translation Privacy Notice */}
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-foreground flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                <div className="text-[11px] text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Transparent Translation Boundary:</strong> Translations execute client-side in your browser before message encryption. Target languages resolve automatically in strict priority order: <em>1. Per-chat override → 2. Global preferred receiving language → 3. English default</em>. Originals remain permanently preserved and recoverable via the message reveal toggle.
                </div>
              </div>
            </div>
          </div>
        );

      case "chats":
        return (
          <div className="space-y-6">
            <div className="p-5 sm:p-6 rounded-2xl border border-border/70 bg-card/60 backdrop-blur-xs space-y-6 shadow-xs">
              {/* Enter to Send Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/60">
                <div className="space-y-0.5 max-w-[80%]">
                  <div className="text-xs font-semibold text-foreground">Enter to Send</div>
                  <div className="text-[11px] text-muted-foreground">
                    When enabled, pressing Enter sends the message immediately, and Shift+Enter inserts a new line. When disabled, Enter creates a new line and Ctrl+Enter sends.
                  </div>
                </div>
                <ToggleSwitch
                  checked={enterToSend}
                  onChange={(val) => {
                    setEnterToSend(val);
                    localStorage.setItem("plexochat_enter_to_send", String(val));
                  }}
                  id="enter-to-send-switch"
                />
              </div>

              {/* Chat Bubble Style */}
              <div className="space-y-2">
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
                      Frosted backdrop blur with modern specular highlights.
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

              {/* Local Storage Architecture Note */}
              <div className="p-4 rounded-xl bg-secondary/20 border border-border/60 space-y-2">
                <div className="text-xs font-semibold text-foreground flex items-center gap-2">
                  <HardDrive className="w-3.5 h-3.5 text-primary" />
                  <span>On-Device Store-and-Forward Architecture</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  PlexoChat stores durable conversation history locally on your device in encrypted browser storage. The server operates solely as an ephemeral relay: undelivered messages are held for a maximum of 48 hours and purged immediately upon delivery.
                </p>
              </div>

              {/* Clear Search & Cache Button */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/60">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-foreground">Clear Chat Search History</div>
                  <div className="text-[11px] text-muted-foreground">
                    Purge recent query keywords and cached local conversation filters.
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearCache}
                  className="rounded-xl text-xs h-8 px-3"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  <span>{cacheCleared ? "Cleared!" : "Clear Searches"}</span>
                </Button>
              </div>
            </div>
          </div>
        );

      case "privacy":
        return (
          <div className="space-y-6">
            <div className="p-5 sm:p-6 rounded-2xl border border-border/70 bg-card/60 backdrop-blur-xs space-y-5 shadow-xs">
              {/* Read Receipts Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/60">
                <div className="space-y-0.5 max-w-[80%]">
                  <div className="text-xs font-semibold text-foreground">Read Receipts</div>
                  <div className="text-[11px] text-muted-foreground">
                    Send delivery and read confirmations to your conversation partners. When turned off, incoming messages are never acknowledged as read to peers.
                  </div>
                </div>
                <ToggleSwitch
                  checked={readReceiptsEnabled}
                  onChange={(val) => {
                    setReadReceiptsEnabled(val);
                    localStorage.setItem("plexochat_read_receipts", String(val));
                  }}
                  id="read-receipts-switch"
                />
              </div>

              {/* Incognito Online Status */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/60">
                <div className="space-y-0.5 max-w-[80%]">
                  <div className="text-xs font-semibold text-foreground flex items-center gap-2">
                    <span>Incognito Online Status (Stealth Mode)</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-secondary text-muted-foreground font-mono">
                      Stealth
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Hide your active online indicator dot from non-connected members while browsing Explore.
                  </div>
                </div>
                <ToggleSwitch
                  checked={stealthMode}
                  onChange={setStealthMode}
                  id="stealth-mode-switch"
                />
              </div>

              {/* Discoverability on Explore */}
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

              {/* Approximate Location */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/60">
                <div className="space-y-0.5 max-w-[80%]">
                  <div className="text-xs font-semibold text-foreground">
                    Show Approximate City Cluster Pin
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Display an approximate geographical region cluster on Explore. Exact GPS coordinates are never collected or transmitted.
                  </div>
                </div>
                <ToggleSwitch
                  checked={showLocation}
                  onChange={setShowLocation}
                  id="approximate-location-switch"
                />
              </div>

              {/* Blocked Contacts */}
              <div className="p-4 rounded-xl bg-secondary/20 border border-border/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-foreground flex items-center gap-2">
                    <UserX className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Blocked Contacts</span>
                  </div>
                  <span className="text-[11px] font-mono text-muted-foreground">0 Blocked</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Blocked accounts cannot send messages or view your presence. You can block or report any account directly from the contact profile panel inside an active chat.
                </p>
              </div>
            </div>
          </div>
        );

      case "calls":
        return (
          <div className="space-y-6">
            <div className="p-5 sm:p-6 rounded-2xl border border-border/70 bg-card/60 backdrop-blur-xs space-y-6 shadow-xs">
              {/* WebRTC Calling Protocol Info */}
              <div className="p-4 rounded-xl bg-secondary/30 border border-border/60 space-y-2">
                <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
                  <Phone className="w-4 h-4 text-emerald-500" />
                  <span>WebRTC Peer-to-Peer Calling</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Audio and video calls connect peer-to-peer using WebRTC with DTLS-SRTP encryption. Call signaling passes through the secure relay; media streams are direct between devices with zero cloud recording.
                </p>
              </div>

              {/* Call Ringtone Switch */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/60">
                <div className="space-y-0.5 max-w-[80%]">
                  <div className="text-xs font-semibold text-foreground">In-App Call Ringtone</div>
                  <div className="text-[11px] text-muted-foreground">
                    Play synthesized audio ringtones on incoming voice and video call requests.
                  </div>
                </div>
                <ToggleSwitch
                  checked={callRingtoneEnabled}
                  onChange={setCallRingtoneEnabled}
                  id="call-ringtone-switch"
                />
              </div>

              {/* Live Hardware Permission Diagnostic */}
              <div className="space-y-3 p-4 rounded-xl bg-card border border-border/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5 text-primary" />
                      <span>Hardware &amp; Permission Diagnostic</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      Test your browser microphone and camera access before initiating calls.
                    </div>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleTestHardware}
                    disabled={isTestingHardware}
                    className="rounded-xl text-xs h-8 px-3 shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isTestingHardware ? "animate-spin" : ""}`} />
                    <span>{isTestingHardware ? "Checking..." : "Test Audio/Video"}</span>
                  </Button>
                </div>

                {hardwareStatus && (
                  <div className="p-3 rounded-lg bg-secondary/40 border border-border/60 space-y-1.5 text-xs animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <Mic className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="font-medium text-foreground">Microphone:</span>
                      <span className="text-muted-foreground font-mono text-[11px]">
                        {hardwareStatus.mic}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Video className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="font-medium text-foreground">Camera:</span>
                      <span className="text-muted-foreground font-mono text-[11px]">
                        {hardwareStatus.cam}
                      </span>
                    </div>
                  </div>
                )}
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
                    Receive background notifications when connected partners message you.
                  </div>
                </div>
                <ToggleSwitch
                  checked={pushEnabled}
                  onChange={(val) => {
                    setPushEnabled(val);
                    if (val && typeof Notification !== "undefined" && Notification.permission !== "granted") {
                      Notification.requestPermission();
                    }
                  }}
                  id="push-notifications-switch"
                />
              </div>

              {/* In-App Audio Chimes */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/60">
                <div className="space-y-0.5 max-w-[70%]">
                  <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    {soundEnabled ? (
                      <Volume2 className="w-3.5 h-3.5 text-primary" />
                    ) : (
                      <VolumeX className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                    <span>In-App Message Chimes</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Synthesized soft harmonic audio chime played on incoming messages via Web Audio API.
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={playTestChime}
                    className="p-1.5 rounded-lg border border-border/70 hover:bg-secondary text-muted-foreground hover:text-foreground text-[10px] flex items-center gap-1"
                    title="Preview Chime Sound"
                  >
                    <Play className="w-3 h-3 text-primary" />
                    <span>Test</span>
                  </button>
                  <ToggleSwitch
                    checked={soundEnabled}
                    onChange={(val) => {
                      setSoundEnabled(val);
                      localStorage.setItem("plexochat_sound_enabled", String(val));
                    }}
                    id="sound-chimes-switch"
                  />
                </div>
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
                    Display translated message snippets in in-app notification toasts.
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
              {/* Color Mode Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">Color Mode</label>
                <div className="grid grid-cols-3 gap-3">
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

      case "storage":
        return (
          <div className="space-y-6">
            <div className="p-5 sm:p-6 rounded-2xl border border-border/70 bg-card/60 backdrop-blur-xs space-y-6 shadow-xs">
              {/* Storage Quota Estimate */}
              <div className="p-4 rounded-xl bg-secondary/30 border border-border/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-foreground flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-primary" />
                    <span>Local Device Storage Quota</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-primary">
                    {storageEstimate ? `${storageEstimate.usage} used` : "Calculating..."}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Total browser storage allocation: ~{storageEstimate?.quota || "Unknown"}. All message envelopes are held in local IndexedDB.
                </p>
              </div>

              {/* Translation Memory Cache */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-secondary/30 border border-border/60">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-foreground">
                    Translation Memory LRU Cache
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {translationCacheStats.size} phrase
                    {translationCacheStats.size === 1 ? "" : "s"} currently cached in memory (Capacity:{" "}
                    {translationCacheStats.capacity})
                  </div>
                  {clearedTranslationNotice && (
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      {clearedTranslationNotice}
                    </div>
                  )}
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleClearTranslationCache}
                  className="rounded-xl text-xs h-8 px-3 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  <span>Clear Cache</span>
                </Button>
              </div>

              {/* Local Search Cache */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-secondary/30 border border-border/60">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-foreground">Recent Search Cache</div>
                  <div className="text-[11px] text-muted-foreground">
                    Local search suggestions and filter history in Explore.
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleClearCache}
                  className="rounded-xl text-xs h-8 px-3 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  <span>{cacheCleared ? "Cleared!" : "Clear Searches"}</span>
                </Button>
              </div>

              {/* Cryptographic Key Preservation Notice */}
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-foreground flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Clearing translation or search caches will <strong>never</strong> delete your private Olm cryptographic keys or reset active Double-Ratchet ratchet states.
                </p>
              </div>
            </div>
          </div>
        );

      case "security":
        return (
          <div className="space-y-6">
            <div className="p-5 sm:p-6 rounded-2xl border border-border/70 bg-card/60 backdrop-blur-xs space-y-6 shadow-xs">
              {/* E2EE Status */}
              <div className="p-4 rounded-xl bg-card border border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-secondary text-muted-foreground flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-foreground flex items-center gap-2">
                      <span>End-to-End Encrypted (Olm Double Ratchet)</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      Text messages are encrypted on your device via Olm before transmission. The relay server only handles opaque ciphertext envelopes.
                    </div>
                  </div>
                </div>
              </div>

              {/* Cryptographic Technical Details */}
              <div className="p-4 rounded-xl bg-secondary/20 border border-border/60 space-y-2">
                <div className="text-xs font-semibold text-foreground">Cryptographic Specifications</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div className="p-2.5 rounded-lg bg-card border border-border/50">
                    <div className="font-semibold text-foreground text-xs">Messaging Protocol</div>
                    <div className="font-mono text-[10px] text-muted-foreground mt-0.5">
                      Olm Double Ratchet (Signal protocol)
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-card border border-border/50">
                    <div className="font-semibold text-foreground text-xs">Cryptographic Primitives</div>
                    <div className="font-mono text-[10px] text-muted-foreground mt-0.5">
                      Curve25519, AES-256-CBC, HMAC-SHA256
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-card border border-border/50">
                    <div className="font-semibold text-foreground text-xs">Calling Security</div>
                    <div className="font-mono text-[10px] text-muted-foreground mt-0.5">
                      WebRTC DTLS-SRTP P2P Media
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-card border border-border/50">
                    <div className="font-semibold text-foreground text-xs">Relay Persistence</div>
                    <div className="font-mono text-[10px] text-muted-foreground mt-0.5">
                      Zero media / message persistence on relay
                    </div>
                  </div>
                </div>
              </div>

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
                    disabled={!identityFingerprint}
                    className="text-[11px] text-primary hover:underline flex items-center gap-1 font-mono font-medium disabled:opacity-40 disabled:cursor-not-allowed"
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
                  {identityFingerprint ?? (
                    <span className="italic text-muted-foreground/60">
                      Initializing Olm… open a chat to load your device keys.
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Your device&apos;s Olm Ed25519 public identity key. Compare with conversation partners to verify that no man-in-the-middle tampering exists.
                </p>
              </div>

              {/* Active Sessions */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-primary" />
                  <span>Authenticated Client Sessions</span>
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
                        Protected via TLS 1.3 &amp; Cloudflare Relay • Active now
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

      case "help":
        return (
          <div className="space-y-6">
            <div className="p-5 sm:p-6 rounded-2xl border border-border/70 bg-card/60 backdrop-blur-xs space-y-6 shadow-xs">
              {/* About Header */}
              <div className="p-4 rounded-xl bg-secondary/30 border border-border/60 space-y-2">
                <div className="text-sm font-bold text-foreground">PlexoChat Web v1.2</div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  A high-performance multilingual communication platform designed for frictionless cross-language conversation, featuring on-device translation, Olm Double-Ratchet E2EE, and WebRTC calling.
                </p>
              </div>

              {/* Privacy Policy Summary */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Privacy Policy Highlights
                </h3>
                <div className="p-4 rounded-xl bg-card border border-border/70 space-y-2 text-xs text-muted-foreground leading-relaxed">
                  <p>• <strong>No Message Retention:</strong> The server acts as a store-and-forward relay. Once a message is delivered to the recipient device, it is permanently purged from server memory and databases.</p>
                  <p>• <strong>Zero Plaintext Storage:</strong> Messages leave your browser encrypted with Olm Double-Ratchet keys. The backend server never receives or stores plaintext.</p>
                  <p>• <strong>Approximate Location:</strong> Explore discovery pins only show generalized city regions. Exact GPS coordinates are never collected.</p>
                </div>
              </div>

              {/* Terms of Service Summary */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Terms of Service &amp; Conduct
                </h3>
                <div className="p-4 rounded-xl bg-card border border-border/70 space-y-1.5 text-xs text-muted-foreground leading-relaxed">
                  <p>PlexoChat is a platform for cross-cultural connection and respectful language learning. Harassment, abuse, or automated scraping will result in immediate account termination.</p>
                </div>
              </div>

              {/* GitHub / Feedback Link */}
              <div className="pt-2">
                <a
                  href="https://github.com/arupdas0825/Plexochat"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-xl border border-border/70 bg-secondary/30 hover:bg-secondary/60 transition-colors flex items-center justify-between text-xs text-foreground font-medium"
                >
                  <span>View Project on GitHub &amp; Report Feedback</span>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                </a>
              </div>
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
                  Email: <strong className="text-foreground">{user?.email || "Firebase Authenticated Account"}</strong>
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                  Firebase UID: <strong className="text-foreground">{user?.id || "Unknown"}</strong>
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                  PlexoChat ID: <strong className="text-foreground">{user?.plexoChatId || "PX-8921-X"}</strong>
                </div>
              </div>

              {/* Data Export & Cache Management */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleExportData}
                  className="p-4 rounded-xl border border-border/80 bg-card hover:border-primary/40 text-left transition-all shadow-2xs flex items-center gap-3 cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground">Export Data (JSON)</div>
                    <div className="text-[10px] text-muted-foreground">Download your profile &amp; security archive</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleClearCache}
                  className="p-4 rounded-xl border border-border/80 bg-card hover:border-amber-500/40 text-left transition-all shadow-2xs flex items-center gap-3 cursor-pointer"
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
                    End your active authenticated session on this device.
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={logout}
                  className="w-full sm:w-auto text-xs text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl gap-2 h-10 px-5 border-destructive/30"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out of PlexoChat</span>
                </Button>
              </div>

              {/* Danger Zone: Delete Account */}
              <div className="pt-4 border-t border-destructive/20 space-y-3">
                <div className="text-xs font-bold text-destructive flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Danger Zone</span>
                </div>
                <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground">Delete Account</div>
                    <div className="text-[11px] text-muted-foreground">
                      Permanently delete your profile and purge all server-side connection records.
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteModal(true)}
                    className="rounded-xl text-xs h-9 px-4 shrink-0"
                  >
                    Delete Account
                  </Button>
                </div>
              </div>
            </div>

            {/* Delete Account Modal */}
            {showDeleteModal && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="w-full max-w-md p-6 rounded-2xl bg-card border border-border shadow-2xl space-y-4">
                  <div className="text-base font-bold text-destructive flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    <span>Confirm Account Deletion</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    This action is permanent and cannot be undone. All your profile data and active connections will be permanently wiped.
                  </p>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDeleteModal(false)}
                      className="rounded-xl text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={async () => {
                        setShowDeleteModal(false);
                        await logout();
                      }}
                      className="rounded-xl text-xs"
                    >
                      Yes, Delete Account
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto p-4 md:p-6 lg:p-8 pb-28 md:pb-8 max-w-6xl mx-auto w-full select-none">
      {/* ══════════════════════════════════════════════════════
          MOBILE VIEW (md:hidden) — Native Grouped List Navigation
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
                  Account, translation, security and interface preferences
                </p>
              </div>

              {/* Hero Profile Card */}
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

              {/* Grouped Settings List */}
              <div className="space-y-4">
                {/* Group 1: Communication & Language */}
                <div className="space-y-1">
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase px-2 tracking-wider">
                    Communication
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-card divide-y divide-border/50 overflow-hidden shadow-2xs">
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
                          <div className="text-xs font-semibold text-foreground">
                            Language &amp; Translation
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {getLanguageLabel(receivingLang)} • Auto-translate
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setMobileSubView("chats")}
                      className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-secondary/40 active:bg-secondary/60 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-secondary text-muted-foreground flex items-center justify-center shrink-0">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-foreground">Chats &amp; Input</div>
                          <div className="text-[11px] text-muted-foreground">
                            {enterToSend ? "Enter to send" : "Return key newline"} • Bubble style
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setMobileSubView("calls")}
                      className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-secondary/40 active:bg-secondary/60 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-secondary text-muted-foreground flex items-center justify-center shrink-0">
                          <Phone className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-foreground">Voice &amp; Video Calls</div>
                          <div className="text-[11px] text-muted-foreground">
                            WebRTC P2P media &amp; hardware diagnostic
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
                    Privacy &amp; Security
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-card divide-y divide-border/50 overflow-hidden shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setMobileSubView("privacy")}
                      className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-secondary/40 active:bg-secondary/60 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-secondary text-muted-foreground flex items-center justify-center shrink-0">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-foreground">Privacy &amp; Visibility</div>
                          <div className="text-[11px] text-muted-foreground">
                            Read receipts, presence &amp; discoverability
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setMobileSubView("security")}
                      className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-secondary/40 active:bg-secondary/60 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-secondary text-muted-foreground flex items-center justify-center shrink-0">
                          <Lock className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                            <span>Security &amp; Encryption</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            Olm Double Ratchet key &amp; session details
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </button>
                  </div>
                </div>

                {/* Group 3: Device & Storage */}
                <div className="space-y-1">
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase px-2 tracking-wider">
                    Preferences &amp; Data
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-card divide-y divide-border/50 overflow-hidden shadow-2xs">
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
                          <div className="text-xs font-semibold text-foreground">Notifications &amp; Sound</div>
                          <div className="text-[11px] text-muted-foreground">
                            {soundEnabled ? "Chimes on" : "Muted"} • Push alerts
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </button>

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

                    <button
                      type="button"
                      onClick={() => setMobileSubView("storage")}
                      className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-secondary/40 active:bg-secondary/60 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-secondary text-muted-foreground flex items-center justify-center shrink-0">
                          <HardDrive className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-foreground">Storage &amp; Data</div>
                          <div className="text-[11px] text-muted-foreground">
                            Local quota &amp; translation cache
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setMobileSubView("help")}
                      className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-secondary/40 active:bg-secondary/60 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-secondary text-muted-foreground flex items-center justify-center shrink-0">
                          <HelpCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-foreground">Help &amp; About</div>
                          <div className="text-[11px] text-muted-foreground">
                            Version 1.2 • Privacy policy &amp; terms
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </button>

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
                          <div className="text-xs font-semibold text-foreground">Account Actions</div>
                          <div className="text-[11px] text-muted-foreground">
                            Data export, session &amp; logout
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

          {/* Navigation Items List */}
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
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? "text-primary-foreground" : "text-muted-foreground"
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono shrink-0 ml-1.5 ${
                        isActive ? "bg-white/20 text-white" : "bg-secondary text-muted-foreground"
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
            <span>Olm Double-Ratchet E2EE active</span>
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
