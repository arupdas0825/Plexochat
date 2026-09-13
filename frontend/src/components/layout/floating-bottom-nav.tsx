"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home,
  Compass,
  MessageSquare,
  Calendar,
  Settings,
} from "lucide-react";
import { useChat } from "@/lib/chat-context";
import { useConnections } from "@/lib/connections-context";
import { useVisualViewport } from "@/lib/use-visual-viewport";

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
  const viewport = useVisualViewport();
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Detect virtual keyboard opening via focus events on editable elements
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (
        target instanceof HTMLInputElement &&
        (target.type === "checkbox" || target.type === "radio" || target.type === "button" || target.type === "submit")
      ) {
        return;
      }

      if (isInput) {
        setIsInputFocused(true);
      }
    };

    const handleFocusOut = () => {
      setIsInputFocused(false);
    };

    window.addEventListener("focusin", handleFocusIn);
    window.addEventListener("focusout", handleFocusOut);
    return () => {
      window.removeEventListener("focusin", handleFocusIn);
      window.removeEventListener("focusout", handleFocusOut);
    };
  }, []);

  // Detect keyboard via visual viewport height shrink (standard on mobile browsers)
  const isViewportShrunk =
    typeof window !== "undefined" && viewport
      ? window.innerHeight - viewport.height > 120
      : false;

  const isKeyboardOpen = isViewportShrunk || isInputFocused;

  // Hide dock completely when actively viewing an open chat thread on mobile
  // so the message composer has 100% full screen access
  const isChatOpenOnMobile = pathname === "/chats" && activeThreadId !== null;
  if (isChatOpenOnMobile) return null;

  // Exact 5-destination navigation in order: Home, Explore, Chats, Calendar, Settings
  const navItems: MobileNavItemConfig[] = [
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

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className={`md:hidden fixed z-40 left-1/2 -translate-x-1/2 transition-all duration-200 ease-out select-none ${
        isKeyboardOpen
          ? "opacity-0 translate-y-20 pointer-events-none"
          : "opacity-100 translate-y-0 pointer-events-auto"
      }`}
      style={{
        bottom: "max(0.75rem, calc(env(safe-area-inset-bottom) + 0.35rem))",
        width: "min(430px, calc(100vw - 1.5rem))",
      }}
    >
      {/* Liquid Glass Capsule Pill Container */}
      <div className="relative w-full rounded-full p-1.5 flex items-center justify-between bg-white/85 dark:bg-zinc-900/85 backdrop-blur-2xl backdrop-saturate-150 border border-white/75 dark:border-white/12 shadow-[0_12px_36px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.65),0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.1)]">
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
              className={`relative flex-1 min-h-[48px] py-1.5 px-1 flex flex-col items-center justify-center rounded-full transition-colors duration-150 touch-manipulation cursor-pointer select-none group ${
                isActive
                  ? "text-blue-600 dark:text-blue-400 font-semibold"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 font-medium"
              }`}
            >
              {/* Active Route Indicator: Soft Blue Highlighted Capsule Pill */}
              {isActive && (
                <motion.div
                  layoutId="activeFloatingBottomNavPill"
                  className="absolute inset-0.5 rounded-full bg-blue-500/12 dark:bg-blue-400/20 border border-blue-200/60 dark:border-blue-400/25 shadow-xs"
                  transition={{ type: "spring", stiffness: 450, damping: 36 }}
                />
              )}

              {/* Icon Container with Real Badge */}
              <div className="relative z-10 flex items-center justify-center">
                <Icon
                  className={`w-5 h-5 transition-transform duration-150 group-active:scale-90 ${
                    isActive ? "stroke-[2.2]" : "stroke-[1.75]"
                  }`}
                />

                {/* Real unread / pending badge */}
                {item.badge !== null && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 px-1 min-w-[16px] h-[16px] rounded-full bg-[#ff3b30] text-white text-[9px] font-bold flex items-center justify-center font-mono shadow-xs ring-2 ring-white dark:ring-zinc-900 leading-none">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </div>

              {/* Destination Label */}
              <span className="relative z-10 text-[10px] tracking-tight mt-0.5 leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
