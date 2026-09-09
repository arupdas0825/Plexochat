"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`p-8 sm:p-12 text-center rounded-3xl border border-dashed border-border/70 bg-card/40 flex flex-col items-center justify-center space-y-3 select-none ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-secondary/70 border border-border/60 flex items-center justify-center text-muted-foreground shadow-xs">
        <Icon className="w-6 h-6 opacity-80" />
      </div>
      <div className="space-y-1 max-w-sm">
        <h3 className="text-sm font-bold text-foreground tracking-tight">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
