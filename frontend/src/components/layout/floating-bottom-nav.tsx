"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home,
  MessageSquare,
  Globe2,
  Users,
  Calendar,
  Settings,
} from "lucide-react";
import { useChat } from "@/lib/chat-context";
import { useConnections } from "@/lib/connections-context";

export interface NavItemConfig {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: number | null;
}

export function FloatingBottomNav() {
  const pathname = usePathname();
  const { unreadTotal, activeThreadId } = useChat();
  const { pendingIncomingCount } = useConnections();

  // Hide dock when actively viewing a 1-to-1 conversation on mobile
  const isChatOpenOnMobile = pathname === "/chats" && activeThreadId !== null;
  if (isChatOpenOnMobile) return null;

  const navItems: NavItemConfig[] = [
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

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed z-40 left-1/2 -translate-x-1/2 w-[calc(100%-1.75rem)] max-w-md bottom-[max(0.75rem,env(safe-area-inset-bottom))] pointer-events-none select-none transition-all duration-300"
    >
      {/* Floating Liquid Glass Pill */}
      <div className="pointer-events-auto relative flex items-center justify-between p-1.5 rounded-full bg-white/75 dark:bg-zinc-900/75 backdrop-blur-2xl backdrop-saturate-180 border border-white/60 dark:border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),0_8px_32px_0_rgba(0,0,0,0.14)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.12),0_12px_40px_0_rgba(0,0,0,0.6)] ring-1 ring-black/[0.04] dark:ring-white/[0.08]">
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
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className={`relative flex-1 min-w-0 py-1.5 px-0.5 flex flex-col items-center justify-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-95 touch-manipulation group ${
                isActive
                  ? "text-primary font-semibold"
                  : "text-muted-foreground/75 hover:text-foreground active:text-foreground"
              }`}
            >
              {/* Active Tab Floating Glass Capsule */}
              {isActive && (
                <motion.div
                  layoutId="activeMobileTabCapsule"
                  className="absolute inset-0 rounded-full bg-primary/12 dark:bg-primary/20 border border-primary/25 dark:border-primary/35 shadow-[0_2px_10px_rgba(99,102,241,0.18)]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}

              {/* Icon Container with Badge */}
              <div className="relative z-10 flex items-center justify-center">
                <Icon
                  className={`w-4.5 h-4.5 transition-transform duration-200 ${
                    isActive ? "scale-105" : "group-hover:scale-105"
                  }`}
                />

                {item.badge !== null && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 px-1 min-w-3.5 h-3.5 rounded-full bg-primary text-primary-foreground text-[8.5px] font-bold flex items-center justify-center font-mono shadow-xs ring-1 ring-background">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </div>

              {/* Navigation Label */}
              <span className="relative z-10 text-[9px] sm:text-[10px] tracking-tight mt-0.5 leading-none truncate max-w-full text-center">
                {item.label}
              </span>

              {/* Active Dot Indicator */}
              <div className="relative z-10 h-1 flex items-center justify-center">
                {isActive ? (
                  <motion.span
                    layoutId="activeMobileTabDot"
                    className="w-1 h-1 rounded-full bg-primary shadow-[0_0_6px_rgba(99,102,241,0.8)]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                ) : (
                  <span className="w-1 h-1" />
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
