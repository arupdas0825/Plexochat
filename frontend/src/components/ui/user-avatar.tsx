"use client";

import React from "react";
import { OnlineIndicator } from "./online-indicator";

export interface UserAvatarProps {
  name: string;
  avatarBg?: string;
  photoUrl?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  online?: boolean;
  className?: string;
}

const sizeMap = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-xl",
};

const indicatorSizeMap: Record<string, "sm" | "md" | "lg"> = {
  xs: "sm",
  sm: "sm",
  md: "md",
  lg: "md",
  xl: "lg",
};

export function UserAvatar({
  name,
  avatarBg = "from-primary to-violet-600",
  photoUrl,
  size = "md",
  online,
  className = "",
}: UserAvatarProps) {
  const initials = (name || "U")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s.charAt(0).toUpperCase())
    .join("");

  const bgGradient = avatarBg.startsWith("from-")
    ? `bg-gradient-to-tr ${avatarBg}`
    : "bg-gradient-to-tr from-primary to-violet-600";

  return (
    <div className={`relative shrink-0 select-none ${className}`}>
      <div
        className={`${sizeMap[size]} rounded-full ${photoUrl ? "bg-muted" : bgGradient} text-white font-bold flex items-center justify-center shadow-xs ring-1 ring-black/5 dark:ring-white/10 overflow-hidden`}
      >
        {photoUrl ? (
          <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      {typeof online === "boolean" && (
        <div className="absolute bottom-0 right-0 translate-x-[10%] translate-y-[10%]">
          <OnlineIndicator online={online} size={indicatorSizeMap[size]} />
        </div>
      )}
    </div>
  );
}
