"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  MessageSquare,
  Globe2,
  Users,
  Calendar,
  Settings,
  LogOut,
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
  const { user, isAuthenticated, isLoading, logout, updateProfile } = useAuth();
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
      label: "Chats",
      href: "/chats",
      icon: MessageSquare,
      badge: unreadTotal > 0 ? unreadTotal : null,
    },
    {
      label: "Explore",
      href: "/explore",
      icon: Globe2,
      badge: null,
    },
    {
      label: "Connections",
      href: "/connections",
      icon: Users,
      badge: pendingIncomingCount > 0 ? pendingIncomingCount : null,
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
    <div className="min-h-screen min-h-[100dvh] h-screen h-[100dvh] flex flex-col md:flex-row bg-background text-foreground overflow-hidden">
      
      {/* 1. Desktop Left Navigation Sidebar */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 h-full bg-card/95 backdrop-blur-md border-r border-border/80 shrink-0 select-none z-20">
        
        {/* Brand Header */}
        <div className="p-4 border-b border-border/60 flex items-center justify-between">
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
            <div>
              <div className="font-bold text-base tracking-tight text-foreground flex items-center gap-1.5">
                <span>PlexoChat</span>
              </div>
              <div className="text-[10px] text-emerald-500 font-mono font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>E2EE Relay Active</span>
              </div>
            </div>
          </Link>
          <ThemeToggle />
        </div>

        {/* Primary Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 font-mono">
            Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/home" && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                  isActive
                    ? "bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge !== null && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                      isActive
                        ? "bg-primary-foreground text-primary"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Receiving Language Quick Selector */}
        <div className="p-3 mx-3 mb-3 rounded-2xl bg-secondary/40 border border-border/50">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5 font-medium">
            <span className="flex items-center gap-1.5">
              <Languages className="w-3.5 h-3.5 text-primary" />
              <span>Receiving In</span>
            </span>
            <span className="text-[10px] font-mono text-primary font-semibold">Auto-Translate</span>
          </div>
          <div className="relative">
            <select
              value={user?.preferredReceivingLanguage || "en"}
              onChange={handleLanguageChange}
              className="w-full h-8 px-2.5 rounded-lg border border-border/70 bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* User Identity Chip & Logout */}
        <div className="p-3 border-t border-border/60 bg-card">
          <div className="flex items-center justify-between gap-2">
            <Link
              href="/settings"
              className="flex items-center gap-2.5 min-w-0 flex-1 p-1.5 rounded-xl hover:bg-secondary/60 transition-colors"
            >
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-violet-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  {user?.displayName ? user.displayName.substring(0, 1).toUpperCase() : "U"}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-foreground truncate">
                  {user?.displayName || "You"}
                </div>
                <div className="text-[10px] text-muted-foreground font-mono truncate">
                  {user?.plexoChatId || "PX-8921-X"}
                </div>
              </div>
            </Link>

            <button
              type="button"
              onClick={logout}
              title="Sign Out"
              className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

      </aside>

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
