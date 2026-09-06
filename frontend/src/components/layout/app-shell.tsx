"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home,
  MessageSquare,
  Globe2,
  Calendar,
  Settings,
  Languages,
} from "lucide-react";
import { useAuth, SUPPORTED_LANGUAGES } from "@/lib/auth-context";
import { useConnections } from "@/lib/connections-context";
import { useChat } from "@/lib/chat-context";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { FloatingBottomNav } from "./floating-bottom-nav";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, updateProfile } = useAuth();
  const { pendingIncomingCount } = useConnections();
  const { unreadTotal, activeThreadId } = useChat();
  const isChatOpenOnMobile = pathname === "/chats" && activeThreadId !== null;

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

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
      icon: Globe2,
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

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = SUPPORTED_LANGUAGES.find((l) => l.code === e.target.value);
    if (selected) {
      updateProfile({
        preferredReceivingLanguage: selected.code,
        preferredLanguageName: selected.name,
      });
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] h-screen h-[100dvh] flex flex-col bg-background text-foreground overflow-hidden">
      
      {/* 1. Desktop Top Header (Clean, spacious, minimal edge-to-edge navbar) */}
      <header className="hidden md:flex items-center justify-between px-6 lg:px-8 py-3 bg-card/90 backdrop-blur-md border-b border-border/70 z-30 shrink-0 w-full select-none">
        
        {/* Left: PlexoChat Logo & Name */}
        <div className="flex items-center gap-3 shrink-0 min-w-[180px]">
          <Link href="/home" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 relative flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
              <Image
                src="/logo.png"
                alt="PlexoChat Logo"
                width={32}
                height={32}
                className="w-8 h-8 object-contain drop-shadow-sm"
                priority
              />
            </div>
            <span className="font-bold text-base tracking-tight text-foreground">
              PlexoChat
            </span>
          </Link>
        </div>

        {/* Center: Navigation Pill shifted slightly to the right */}
        <div className="flex-1 flex items-center justify-center translate-x-10 lg:translate-x-20">
          <nav className="flex items-center gap-1 p-1 rounded-full bg-secondary/50 dark:bg-zinc-800/50 border border-border/60 shadow-xs">
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
                  className={`relative px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 transition-all duration-200 ${
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/40 dark:hover:bg-white/5"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeDesktopTopNavPill"
                      className="absolute inset-0 rounded-full bg-primary/12 dark:bg-primary/20 border border-primary/25 shadow-xs"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">{item.label}</span>
                  {item.badge !== null && item.badge > 0 && (
                    <span className="relative z-10 px-1.5 py-0.2 rounded-full bg-primary text-primary-foreground text-[9px] font-bold font-mono">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Language Selector, Theme Toggle, User Profile Area */}
        <div className="flex items-center gap-3 shrink-0 min-w-[180px] justify-end">
          {/* Receiving Language Quick Selector */}
          <div className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/40 border border-border/70 text-xs hover:border-border transition-colors">
            <Languages className="w-3.5 h-3.5 text-primary shrink-0" />
            <select
              value={user?.preferredReceivingLanguage || "en"}
              onChange={handleLanguageChange}
              aria-label="Preferred receiving language"
              className="bg-transparent text-xs text-foreground font-medium focus:outline-none cursor-pointer pr-1"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-card text-foreground">
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>

          <ThemeToggle />

          {/* User Profile Identity Chip */}
          <Link
            href="/settings"
            title="Profile & Settings"
            className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-full hover:bg-secondary/60 transition-colors border border-transparent hover:border-border/60"
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-violet-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {user?.displayName ? user.displayName.substring(0, 1).toUpperCase() : "U"}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
            </div>
            <div className="text-left hidden lg:block">
              <div className="text-xs font-semibold text-foreground leading-tight truncate max-w-[100px]">
                {user?.displayName || "You"}
              </div>
              <div className="text-[10px] text-muted-foreground font-mono leading-none truncate max-w-[100px]">
                {user?.plexoChatId || "PX-8921-X"}
              </div>
            </div>
          </Link>
        </div>

      </header>

      {/* 2. Mobile Top Navigation Bar (Hidden when actively inside a mobile chat thread) */}
      {!isChatOpenOnMobile && (
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-card/95 backdrop-blur-md border-b border-border/80 z-20 shrink-0 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <Link href="/home" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="PlexoChat Logo"
              width={28}
              height={28}
              className="w-7 h-7 object-contain"
            />
            <span className="font-bold text-base tracking-tight text-foreground">
              PlexoChat
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/settings"
              className="w-7 h-7 rounded-full bg-gradient-to-tr from-primary to-violet-500 text-white flex items-center justify-center font-bold text-xs"
            >
              {user?.displayName ? user.displayName.substring(0, 1).toUpperCase() : "U"}
            </Link>
          </div>
        </header>
      )}

      {/* 3. Center Main Application Work Area */}
      <main className="flex-1 min-h-0 h-full overflow-hidden flex flex-col min-w-0">
        {children}
      </main>

      {/* 4. Floating Liquid Glass Mobile Bottom Navigation */}
      <FloatingBottomNav />

    </div>
  );
}
