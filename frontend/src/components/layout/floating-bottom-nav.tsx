"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Compass,
  Calendar,
  Settings,
} from "lucide-react";
import { useChat } from "@/lib/chat-context";
import { useConnections } from "@/lib/connections-context";

export interface MobileNavItemConfig {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: number | null;
}

export function FloatingBottomNav() {
  const pathname = usePathname();
  const { unreadTotal, activeThreadId } = useChat();
  const { pendingIncomingCount } = useConnections();

  // Hide dock completely when actively viewing an open chat thread on mobile
  const isChatOpenOnMobile = pathname === "/chats" && activeThreadId !== null;
  if (isChatOpenOnMobile) return null;

  // Minimal 4-destination bottom navigation: Chats | Explore | Calendar | Settings
  const navItems: MobileNavItemConfig[] = [
    {
      label: "Chats",
      href: "/chats",
      icon: MessageSquare,
      badge: unreadTotal > 0 ? unreadTotal : null,
    },
    {
      label: "Explore",
      href: "/explore",
      icon: Compass,
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
      className="md:hidden fixed z-40 left-0 right-0 bottom-0 pointer-events-none select-none"
    >
      <div className="pointer-events-auto w-full bg-card/95 backdrop-blur-xl border-t border-border/80 px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-lg">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/home" && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                className={`relative flex-1 py-1.5 px-1 min-h-[48px] flex flex-col items-center justify-center rounded-xl transition-colors active:scale-95 touch-manipulation cursor-pointer ${
                  isActive
                    ? "text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {/* Active Indicator Background Pill */}
                {isActive && (
                  <motion.div
                    layoutId="activeMobileBottomBarTab"
                    className="absolute inset-1 rounded-xl bg-primary/10 dark:bg-primary/20"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}

                {/* Icon Container with Badge */}
                <div className="relative z-10 flex items-center justify-center">
                  <Icon className="w-5 h-5" />

                  {item.badge !== null && item.badge > 0 && (
                    <span className="absolute -top-1 -right-2.5 px-1 min-w-[15px] h-[15px] rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center font-mono shadow-xs">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </div>

                {/* Label */}
                <span className="relative z-10 text-[10px] tracking-tight mt-0.5 leading-none">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
