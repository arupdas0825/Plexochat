"use client";

import React, { useState } from "react";
import {
  Phone,
  Video,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Trash2,
  Clock,
  ShieldCheck,
  Search,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useCall, CallLogItem } from "@/lib/call-context";
import { useConnections } from "@/lib/connections-context";
import { UserAvatar } from "@/components/ui/user-avatar";

export default function CallsPage() {
  const { callLogs, clearCallLogs, startCall, callState } = useCall();
  const { connections } = useConnections();
  const [filter, setFilter] = useState<"all" | "missed">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLogs = callLogs.filter((log) => {
    if (filter === "missed" && log.status !== "missed" && log.status !== "declined") {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.peerName.toLowerCase().includes(q) ||
        (log.peerUsername && log.peerUsername.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const formatCallTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      const timeStr = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      if (isToday) return `Today, ${timeStr}`;
      return `${d.toLocaleDateString([], { month: "short", day: "numeric" })}, ${timeStr}`;
    } catch {
      return isoString;
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds || seconds <= 0) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const handleStartCall = async (
    peer: { id: string; displayName: string; username?: string; avatarUrl?: string; avatarBg?: string },
    type: "voice" | "video"
  ) => {
    if (callState !== "IDLE") return;
    await startCall(
      {
        id: peer.id,
        displayName: peer.displayName,
        username: peer.username,
        avatarUrl: peer.avatarUrl,
        avatarBg: peer.avatarBg,
      },
      type
    );
  };

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col h-full overflow-hidden select-none">
      {/* Header */}
      <div className="shrink-0 px-4 sm:px-6 pt-5 pb-3 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Calls</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Direct WebRTC encrypted voice and video calls
            </p>
          </div>

          {callLogs.length > 0 && (
            <button
              onClick={clearCallLogs}
              className="px-2.5 py-1.5 rounded-lg border border-border/60 text-xs font-medium text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/10 transition-colors flex items-center gap-1.5"
              title="Clear call history"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear Log</span>
            </button>
          )}
        </div>

        {/* Filter Pills & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
          <div className="flex items-center gap-1.5 bg-secondary/50 dark:bg-muted/40 p-1 rounded-xl border border-border/60">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                filter === "all"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All Calls ({callLogs.length})
            </button>
            <button
              onClick={() => setFilter("missed")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                filter === "missed"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Missed ({callLogs.filter((l) => l.status === "missed" || l.status === "declined").length})
            </button>
          </div>

          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search call records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-card border border-border/70 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-6 pb-24">
        {/* Quick Call Section (Connected Friends) */}
        {connections.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Quick Call
              </h2>
              <span className="text-[11px] text-muted-foreground font-mono">
                {connections.length} connected
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {connections.map((friend) => {
                const isOnline = !!friend.online;
                return (
                  <div
                    key={friend.id}
                    className="p-3 rounded-2xl bg-card/80 dark:bg-[#11161D] border border-border/70 hover:border-primary/40 transition-all flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative">
                        <UserAvatar
                          name={friend.displayName}
                          photoUrl={friend.avatarUrl}
                          avatarBg={friend.avatarBg}
                          size="md"
                          online={isOnline}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{friend.displayName}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {friend.username ? `@${friend.username}` : isOnline ? "Online" : "Offline"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleStartCall(friend, "voice")}
                        disabled={callState !== "IDLE"}
                        className="w-8 h-8 rounded-full bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center transition-colors disabled:opacity-50"
                        title="Voice Call"
                        aria-label={`Voice call ${friend.displayName}`}
                      >
                        <Phone className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleStartCall(friend, "video")}
                        disabled={callState !== "IDLE"}
                        className="w-8 h-8 rounded-full bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center transition-colors disabled:opacity-50"
                        title="Video Call"
                        aria-label={`Video call ${friend.displayName}`}
                      >
                        <Video className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Call History Section */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Recent Call History
            </h2>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span>Peer-to-Peer Encrypted</span>
            </div>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/70 p-8 text-center space-y-3 bg-card/40">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Phone className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">No call records found</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {connections.length === 0
                    ? "Connect with friends on Explore to start making end-to-end encrypted voice and video calls."
                    : "Tap any friend's phone or video button above to start your first call."}
                </p>
              </div>
              {connections.length === 0 && (
                <Link
                  href="/explore"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium shadow-xs hover:bg-primary/90 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Find Friends on Explore
                </Link>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-border/70 bg-card/80 dark:bg-[#11161D] divide-y divide-border/60 overflow-hidden shadow-xs">
              {filteredLogs.map((log) => {
                const isMissed = log.status === "missed" || log.status === "declined";
                const isOutgoing = log.direction === "outgoing";

                return (
                  <div
                    key={log.id}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-secondary/30 dark:hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <UserAvatar
                        name={log.peerName}
                        photoUrl={log.peerAvatar}
                        avatarBg={log.peerAvatarBg}
                        size="md"
                      />

                      <div className="min-w-0 space-y-0.5">
                        <p
                          className={`text-xs sm:text-sm font-semibold truncate ${
                            isMissed && !isOutgoing ? "text-rose-500 dark:text-rose-400" : "text-foreground"
                          }`}
                        >
                          {log.peerName}
                        </p>

                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          {isOutgoing ? (
                            <PhoneOutgoing className="w-3 h-3 text-primary shrink-0" />
                          ) : isMissed ? (
                            <PhoneMissed className="w-3 h-3 text-rose-500 dark:text-rose-400 shrink-0" />
                          ) : (
                            <PhoneIncoming className="w-3 h-3 text-emerald-500 shrink-0" />
                          )}

                          <span className="capitalize">{log.status}</span>

                          {log.durationSeconds > 0 && (
                            <>
                              <span>•</span>
                              <span className="font-mono">{formatDuration(log.durationSeconds)}</span>
                            </>
                          )}

                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {formatCallTime(log.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() =>
                          handleStartCall(
                            {
                              id: log.peerId,
                              displayName: log.peerName,
                              username: log.peerUsername,
                              avatarUrl: log.peerAvatar,
                              avatarBg: log.peerAvatarBg,
                            },
                            log.callType
                          )
                        }
                        disabled={callState !== "IDLE"}
                        className="w-8 h-8 rounded-full bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center transition-colors disabled:opacity-50"
                        title={`Call back with ${log.callType}`}
                        aria-label={`Call back ${log.peerName}`}
                      >
                        {log.callType === "video" ? (
                          <Video className="w-4 h-4" />
                        ) : (
                          <Phone className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
