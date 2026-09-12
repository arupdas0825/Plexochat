"use client";

import React, { useState, useMemo } from "react";
import {
  MapCluster,
  DiscoverableUser,
  computeClustersFromUsers,
} from "@/lib/explore-calendar-data";
import { ShieldCheck, Users, Globe2 } from "lucide-react";

interface WorldVectorMapProps {
  users: DiscoverableUser[];
  selectedClusterId: string | null;
  onSelectCluster: (cluster: MapCluster | null) => void;
}

export function WorldVectorMap({
  users,
  selectedClusterId,
  onSelectCluster,
}: WorldVectorMapProps) {
  const [hoveredCluster, setHoveredCluster] = useState<MapCluster | null>(null);

  // Compute dynamic clusters from real registered users with approximate location enabled
  const clusters = useMemo(() => {
    return computeClustersFromUsers(users);
  }, [users]);

  return (
    <div className="rounded-3xl border border-border/80 bg-card/90 backdrop-blur-md overflow-hidden shadow-lg relative">
      
      {/* Top Map Header & Privacy Indicator */}
      <div className="p-4 sm:p-5 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-secondary/30">
        <div>
          <h2 className="text-sm sm:text-base font-semibold text-foreground">
            Global Connection Hub
          </h2>
          <p className="text-[11px] text-muted-foreground">
            Approximate city clusters of multilingual members with discovery enabled.
          </p>
        </div>

        {/* Muted Privacy Indicator */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-muted-foreground self-start sm:self-center">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          <span>Approximate clusters only</span>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="relative w-full aspect-[2.1/1] min-h-[280px] sm:min-h-[360px] bg-mesh-gradient flex items-center justify-center select-none overflow-hidden">
        
        {/* Ambient Grid Lines */}
        <svg
          className="absolute inset-0 w-full h-full opacity-15 pointer-events-none stroke-border"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" strokeWidth="0.75" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="50%" y1="0" x2="50%" y2="100%" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
        </svg>

        {/* Stylized Vector World Continents Paths */}
        <svg
          viewBox="0 0 1000 500"
          className="w-full h-full max-w-5xl opacity-35 dark:opacity-25 fill-muted-foreground/30 pointer-events-none"
        >
          <path d="M 120 80 Q 220 50 300 90 Q 320 160 270 200 Q 200 220 150 160 Z" />
          <path d="M 230 200 Q 260 230 270 270 Q 240 260 230 200 Z" />
          <path d="M 280 270 Q 380 290 350 420 Q 300 460 270 380 Z" />
          <path d="M 460 90 Q 560 70 540 160 Q 480 180 450 140 Z" />
          <path d="M 460 180 Q 590 190 580 340 Q 510 400 470 280 Z" />
          <path d="M 560 70 Q 860 60 840 220 Q 720 280 600 200 Z" />
          <path d="M 830 140 Q 860 150 850 190 Q 825 180 830 140 Z" />
          <path d="M 750 320 Q 880 310 860 410 Q 760 420 740 350 Z" />
        </svg>

        {/* Empty State Banner when 0 clusters exist */}
        {clusters.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
            <div className="p-3 rounded-full bg-secondary/80 border border-border/80 mb-2">
              <Globe2 className="w-6 h-6 text-muted-foreground" />
            </div>
            <span className="text-xs font-semibold text-foreground">
              No active location clusters yet
            </span>
            <p className="text-[11px] text-muted-foreground max-w-xs mt-1">
              Registered members who enable approximate location will appear on this interactive map.
            </p>
          </div>
        ) : (
          /* Dynamic Cluster Pins */
          <div className="absolute inset-0 w-full h-full pointer-events-auto">
            {clusters.map((cluster) => {
              const isSelected = selectedClusterId === cluster.id;
              const isHovered = hoveredCluster?.id === cluster.id;

              return (
                <div
                  key={cluster.id}
                  style={{
                    left: `${cluster.coords.x}%`,
                    top: `${cluster.coords.y}%`,
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 group"
                  onClick={() => {
                    if (isSelected) {
                      onSelectCluster(null);
                    } else {
                      onSelectCluster(cluster);
                    }
                  }}
                  onMouseEnter={() => setHoveredCluster(cluster)}
                  onMouseLeave={() => setHoveredCluster(null)}
                >
                  <div
                    className={`absolute -inset-2 rounded-full transition-all duration-300 ${
                      isSelected
                        ? "bg-primary/35 animate-ping"
                        : "bg-primary/20 group-hover:animate-ping"
                    }`}
                  />

                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs shadow-lg transition-transform duration-200 ${
                      isSelected
                        ? "bg-primary text-primary-foreground scale-125 ring-4 ring-primary/30"
                        : "bg-card/90 border border-primary/40 text-foreground group-hover:scale-110 group-hover:border-primary"
                    }`}
                  >
                    <span className="text-sm">{cluster.flag}</span>
                  </div>

                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap pointer-events-none">
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold transition-all ${
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-card/80 text-muted-foreground border border-border/50 group-hover:text-foreground"
                      }`}
                    >
                      {cluster.cityName}
                    </span>
                  </div>

                  {isHovered && !isSelected && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 rounded-xl bg-popover/95 backdrop-blur-md border border-border shadow-xl text-left pointer-events-none z-30 animate-in fade-in zoom-in-95 duration-150">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                        <span>{cluster.flag}</span>
                        <span>{cluster.cityName}</span>
                      </div>
                      <div className="text-[11px] text-primary font-semibold mt-1 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{cluster.activeMembers} member{cluster.activeMembers > 1 ? "s" : ""}</span>
                      </div>
                      <div className="text-[9px] text-primary/80 font-mono mt-1 pt-1 border-t border-border/40">
                        Click to filter ↓
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Footer Strip when clusters exist */}
      {clusters.length > 0 && (
        <div className="p-3 sm:p-4 border-t border-border/60 bg-secondary/20 flex items-center gap-2 overflow-x-auto text-xs scrollbar-none">
          <span className="text-[11px] font-semibold text-muted-foreground shrink-0 uppercase tracking-wider font-mono">
            Active Clusters:
          </span>
          {clusters.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelectCluster(selectedClusterId === c.id ? null : c)}
              className={`shrink-0 px-2.5 py-1 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${
                selectedClusterId === c.id
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card border-border/70 text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              <span>{c.flag}</span>
              <span>{c.cityName}</span>
              <span className="text-[10px] opacity-70 font-mono">({c.activeMembers})</span>
            </button>
          ))}
        </div>
      )}

    </div>
  );
}
