"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  MessageSquare,
  Compass,
  Calendar,
  Settings,
  Languages,
  ChevronDown,
  Copy,
  Check,
  LogOut,
  User,
  ShieldCheck,
} from "lucide-react";
import { useAuth, SUPPORTED_LANGUAGES } from "@/lib/auth-context";
import { useConnections } from "@/lib/connections-context";
import { useChat } from "@/lib/chat-context";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { UserAvatar } from "@/components/ui/user-avatar";
import { FloatingBottomNav } from "./floating-bottom-nav";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, updateProfile, logout } = useAuth();
  const { pendingIncomingCount } = useConnections();
  const { unreadTotal, activeThreadId } = useChat();

  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const langMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const isChatOpenOnMobile = pathname === "/chats" && activeThreadId !== null;

  // Authentication redirect guard
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Click-outside handlers for desktop popovers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setIsLangOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsLangOpen(false);
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const navItems = [
    {
      label: "Home",
      href: "/home",
      icon: Home,
      badge: null,
    },
    {
      label: "Explore",
      href: "/explore",
      icon: Compass,
      badge: pendingIncomingCount > 0 ? pendingIncomingCount : null,
    },
    {
      label: "Chats",
      href: "/chats",
      icon: MessageSquare,
      badge: unreadTotal > 0 ? unreadTotal : null,
    },
    {
      label: "Calendar",
      href: "/calendar",
      icon: Calendar,
      badge: null,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: Settings,
      badge: null,
    },
  ];

  const currentLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === (user?.preferredReceivingLanguage || "en")) ||
    SUPPORTED_LANGUAGES[0];

  const handleSelectLanguage = (langCode: string, langName: string) => {
    updateProfile({
      preferredReceivingLanguage: langCode,
      preferredLanguageName: langName,
    });
    setIsLangOpen(false);
  };

  const handleCopyId = () => {
    if (!user?.plexoChatId && !user?.username) return;
    const idToCopy = user.plexoChatId || `@${user.username}`;
    navigator.clipboard?.writeText(idToCopy);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSignOut = async () => {
    setIsProfileOpen(false);
    await logout();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen min-h-[100dvh] h-screen h-[100dvh] flex flex-col bg-background text-foreground overflow-hidden">
      {/* 1. Desktop Top Header (SaaS / Productivity Polish) */}
      <header className="hidden md:flex items-center justify-between px-6 lg:px-8 h-14 bg-card/95 backdrop-blur-md border-b border-border/80 z-30 shrink-0 w-full select-none">
        {/* Left: PlexoChat Brand */}
        <div className="flex items-center gap-3 shrink-0 min-w-[180px]">
          <Link href="/home" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 relative flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
              <Image
                src="/logo.png"
                alt="PlexoChat Logo"
                width={28}
                height={28}
                className="w-7 h-7 object-contain drop-shadow-xs"
                priority
              />
            </div>
            <span className="font-bold text-sm tracking-tight text-foreground">
              PlexoChat
            </span>
          </Link>
        </div>

        {/* Center: Global Navigation Pill */}
        <div className="flex-1 flex items-center justify-center">
          <nav className="flex items-center gap-1 p-1 rounded-full bg-secondary/60 dark:bg-muted/60 border border-border/70 shadow-xs">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href === "/home" && pathname === "/") ||
                (item.href !== "/home" && pathname?.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 transition-all duration-150 ${
                    isActive
                      ? "text-primary font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeDesktopTopNavPill"
                      className="absolute inset-0 rounded-full bg-primary/10 dark:bg-primary/20 border border-primary/25 shadow-xs"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon className="w-3.5 h-3.5 relative z-10" />
                  <span className="relative z-10">{item.label}</span>
                  {item.badge !== null && item.badge > 0 && (
                    <span className="relative z-10 px-1.5 py-0.2 rounded-full bg-primary text-primary-foreground text-[9px] font-bold font-mono shadow-xs">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Language Selector, Theme Toggle, Profile Popover */}
        <div className="flex items-center gap-2.5 shrink-0 min-w-[180px] justify-end">
          {/* Language Popover Menu */}
          <div ref={langMenuRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setIsLangOpen((prev) => !prev);
                setIsProfileOpen(false);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-secondary/50 hover:bg-secondary border border-border/80 text-xs font-medium transition-colors cursor-pointer"
              title="Receiving Language Preference"
              aria-expanded={isLangOpen}
            >
              <Languages className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-xs">{currentLang.flag}</span>
              <span className="uppercase text-[11px] font-mono font-semibold text-foreground">
                {currentLang.code}
              </span>
              <ChevronDown className="w-3 h-3 text-muted-foreground opacity-70" />
            </button>

            <AnimatePresence>
              {isLangOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 mt-2 w-56 rounded-2xl bg-card/95 backdrop-blur-xl border border-border p-1.5 shadow-xl z-50 focus:outline-none"
                >
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/50 mb-1">
                    Receiving Language
                  </div>
                  <div className="max-h-56 overflow-y-auto no-scrollbar space-y-0.5">
                    {SUPPORTED_LANGUAGES.map((lang) => {
                      const isSelected = lang.code === currentLang.code;
                      return (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => handleSelectLanguage(lang.code, lang.name)}
                          className={`w-full px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-primary/10 text-primary font-semibold"
                              : "text-foreground hover:bg-secondary"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span>{lang.flag}</span>
                            <span>{lang.name}</span>
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <ThemeToggle />

          {/* User Profile Popover Chip */}
          <div ref={profileMenuRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setIsProfileOpen((prev) => !prev);
                setIsLangOpen(false);
              }}
              className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full hover:bg-secondary/70 border border-border/60 hover:border-border transition-colors cursor-pointer select-none"
              title="Profile & Menu"
              aria-expanded={isProfileOpen}
            >
              <UserAvatar
                name={user?.displayName || "You"}
                size="sm"
                online={true}
              />
              <div className="text-left hidden lg:block leading-tight">
                <div className="text-xs font-semibold text-foreground truncate max-w-[90px]">
                  {user?.displayName || "You"}
                </div>
              </div>
              <ChevronDown className="w-3 h-3 text-muted-foreground opacity-70" />
            </button>

            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 mt-2 w-64 rounded-2xl bg-card/95 backdrop-blur-xl border border-border p-2 shadow-xl z-50 focus:outline-none"
                >
                  {/* Popover Header with Avatar & ID */}
                  <div className="p-2.5 rounded-xl bg-secondary/50 border border-border/60 mb-2">
                    <div className="flex items-center gap-2.5">
                      <UserAvatar
                        name={user?.displayName || "You"}
                        size="md"
                        online={true}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-foreground truncate">
                          {user?.displayName || "You"}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono truncate">
                          {user?.plexoChatId || `@${user?.username || "user"}`}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyId}
                        className="p-1.5 rounded-lg hover:bg-card text-muted-foreground hover:text-foreground transition-colors"
                        title="Copy PlexoChat ID"
                      >
                        {copiedId ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Popover Actions */}
                  <div className="space-y-0.5">
                    <Link
                      href="/settings"
                      onClick={() => setIsProfileOpen(false)}
                      className="w-full px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-secondary flex items-center gap-2.5 transition-colors"
                    >
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>Account Settings</span>
                    </Link>

                    <Link
                      href="/settings"
                      onClick={() => setIsProfileOpen(false)}
                      className="w-full px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-secondary flex items-center gap-2.5 transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span>Privacy &amp; End-to-End Encryption</span>
                    </Link>

                    <div className="h-px bg-border/60 my-1" />

                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full px-3 py-2 rounded-xl text-xs font-medium text-destructive hover:bg-destructive/10 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* 2. Mobile Top Navigation Bar (Hidden when actively in chat) */}
      {!isChatOpenOnMobile && (
        <header className="md:hidden flex items-center justify-between px-4 h-14 bg-card/95 backdrop-blur-md border-b border-border/80 z-20 shrink-0 pt-[max(0rem,env(safe-area-inset-top))]">
          <Link href="/home" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="PlexoChat Logo"
              width={26}
              height={26}
              className="w-6.5 h-6.5 object-contain"
            />
            <span className="font-bold text-sm tracking-tight text-foreground">
              PlexoChat
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/settings"
              className="relative p-0.5 rounded-full active:scale-95 transition-transform"
              title="Settings"
            >
              <UserAvatar
                name={user?.displayName || "You"}
                size="sm"
                online={true}
              />
            </Link>
          </div>
        </header>
      )}

      {/* 3. Center Main Application Work Area */}
      <main className="flex-1 min-h-0 h-full overflow-hidden flex flex-col min-w-0">
        {children}
      </main>

      {/* 4. Mobile Bottom Navigation */}
      <FloatingBottomNav />
    </div>
  );
}
