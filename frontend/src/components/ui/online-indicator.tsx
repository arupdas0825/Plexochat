"use client";

import React from "react";

export interface OnlineIndicatorProps {
  online?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  showPulse?: boolean;
}

const sizeClasses = {
  sm: "w-2 h-2 ring-1.5",
  md: "w-2.5 h-2.5 ring-2",
  lg: "w-3 h-3 ring-2",
};

export function OnlineIndicator({
  online = false,
  size = "md",
  className = "",
  showPulse = false,
}: OnlineIndicatorProps) {
  if (!online) return null;

  return (
    <span className={`relative flex items-center justify-center ${className}`}>
      {showPulse && (
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      )}
      <span
        aria-label="Online"
        className={`relative inline-flex rounded-full bg-emerald-500 ring-card ${sizeClasses[size]}`}
      />
    </span>
  );
}
