"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  UserCheck,
  UserPlus,
  MessageSquare,
  Check,
  X,
  ShieldAlert,
  Clock,
  Send,
  Compass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConnections } from "@/lib/connections-context";

export function ConnectionsViewFull() {
  const router = useRouter();
  const {
    requests,
    connections,
    acceptConnectionRequest,
    declineConnectionRequest,
    cancelConnectionRequest,
    blockConnectionUser,
  } = useConnections();

  const [activeTab, setActiveTab] = useState<"friends" | "incoming" | "outgoing">("friends");

  const incomingRequests = requests.filter(
    (r) => r.type === "incoming" && r.status === "pending"
  );
  const outgoingRequests = requests.filter(
    (r) => r.type === "outgoing" && r.status === "pending"
  );

  return (
    <div className="flex-1 h-full overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Users className="w-4 h-4" />
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
              Connections Hub
            </h1>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Manage your verified language partners, pending requests, and outgoing invitations.
          </p>
        </div>

        <Link href="/explore">
          <Button className="h-10 gap-2 text-xs font-semibold rounded-xl shadow-md shadow-primary/20">
            <Compass className="w-4 h-4" />
            <span>Discover New People</span>
          </Button>
        </Link>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex rounded-2xl bg-secondary/60 p-1.5 border border-border/70 text-xs font-medium max-w-md">
        <button
          type="button"
          onClick={() => setActiveTab("friends")}
          className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
            activeTab === "friends"
              ? "bg-card text-foreground font-semibold shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>My Connections</span>
          <span className="px-1.5 py-0.2 rounded-full bg-secondary text-muted-foreground text-[10px] font-mono">
            {connections.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("incoming")}
          className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all relative ${
            activeTab === "incoming"
              ? "bg-card text-foreground font-semibold shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Incoming</span>
          {incomingRequests.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-primary text-primary-foreground text-[10px] font-bold font-mono">
              {incomingRequests.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("outgoing")}
          className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
            activeTab === "outgoing"
              ? "bg-card text-foreground font-semibold shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Outgoing</span>
          <span className="px-1.5 py-0.2 rounded-full bg-secondary text-muted-foreground text-[10px] font-mono">
            {outgoingRequests.length}
          </span>
        </button>
      </div>

      {/* 3. Tab Contents */}
      {activeTab === "friends" && (
        <div className="space-y-4">
          <div className="text-xs text-muted-foreground flex items-center justify-between">
            <span>
              Connected friends can send and receive translated messages 1-to-1 in real-time.
            </span>
          </div>

          {connections.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-dashed border-border/80 bg-card space-y-3">
              <div className="w-12 h-12 rounded-full bg-secondary mx-auto flex items-center justify-center text-muted-foreground">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">No active connections yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Explore the global map and connect with language partners around the world!
              </p>
              <Link href="/explore">
                <Button size="sm" className="text-xs rounded-xl mt-2">
                  Explore People
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {connections.map((friend) => (
                <div
                  key={friend.id}
                  className="p-5 rounded-3xl border border-border/80 bg-card shadow-sm hover:border-primary/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Top flag & status */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                        <span className="text-base">{friend.countryFlag}</span>
                        <span>{friend.city}, {friend.country}</span>
                      </span>

                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
                        {friend.online ? (
                          <span className="text-emerald-500 font-semibold flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Online
                          </span>
                        ) : (
                          friend.lastActive
                        )}
                      </span>
                    </div>

                    {/* Avatar & Name */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative">
                        <div
                          className={`w-12 h-12 rounded-full bg-gradient-to-br ${friend.avatarBg} text-white font-bold text-sm flex items-center justify-center shadow-sm`}
                        >
                          {friend.displayName.substring(0, 2).toUpperCase()}
                        </div>
                        {friend.online && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-base text-foreground leading-tight truncate">
                          {friend.displayName}
                        </h3>
                        <p className="text-xs text-muted-foreground font-mono truncate">
                          @{friend.username}
                        </p>
                      </div>
                    </div>

                    {/* Languages */}
                    <div className="space-y-1 p-2.5 rounded-xl bg-secondary/30 text-xs mb-4">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">Speaks:</span>
                        <span className="font-semibold text-foreground">
                          {friend.languagesSpoken.join(", ")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">Learning:</span>
                        <span className="font-semibold text-primary">
                          {friend.languagesLearning.join(", ")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Open Chat Action */}
                  <Button
                    size="sm"
                    onClick={() => router.push("/chats")}
                    className="w-full text-xs font-semibold rounded-xl gap-2 shadow-sm"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Open Conversation</span>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Incoming Requests Tab */}
      {activeTab === "incoming" && (
        <div className="space-y-4">
          <div className="text-xs text-muted-foreground">
            Review connection invitations from other international members before unlocking 1-to-1 chats.
          </div>

          {incomingRequests.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-dashed border-border/80 bg-card space-y-2">
              <UserCheck className="w-10 h-10 mx-auto text-muted-foreground" />
              <h3 className="text-base font-bold text-foreground">No pending invitations</h3>
              <p className="text-xs text-muted-foreground">
                You have reviewed all incoming connection requests.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {incomingRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-5 rounded-3xl border border-border/80 bg-card shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div
                      className={`w-12 h-12 rounded-full bg-gradient-to-br ${req.avatarBg} text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm`}
                    >
                      {req.displayName.substring(0, 2).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-foreground truncate">
                          {req.displayName}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">
                          @{req.username}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          • {req.countryFlag} {req.city}, {req.country}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono ml-auto">
                          {req.sentAt}
                        </span>
                      </div>

                      {/* Intro Note */}
                      <div className="p-3 rounded-xl bg-secondary/40 border border-border/50 text-xs text-foreground italic">
                        &quot;{req.note}&quot;
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span>Speaks: <strong className="text-foreground">{req.languagesSpoken.join(", ")}</strong></span>
                        <span>•</span>
                        <span>Learning: <strong className="text-primary">{req.languagesLearning.join(", ")}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Accept / Decline / Block buttons */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <Button
                      size="sm"
                      onClick={() => acceptConnectionRequest(req.id)}
                      className="text-xs font-semibold rounded-xl gap-1.5 shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Accept</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => declineConnectionRequest(req.id)}
                      className="text-xs font-semibold rounded-xl text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Decline</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => blockConnectionUser(req.id)}
                      title="Block user"
                      className="text-xs rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 px-2.5"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Outgoing Requests Tab */}
      {activeTab === "outgoing" && (
        <div className="space-y-4">
          <div className="text-xs text-muted-foreground">
            Invitations you have sent that are currently awaiting the recipient&apos;s response.
          </div>

          {outgoingRequests.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-dashed border-border/80 bg-card space-y-2">
              <Send className="w-10 h-10 mx-auto text-muted-foreground" />
              <h3 className="text-base font-bold text-foreground">No pending outgoing requests</h3>
              <p className="text-xs text-muted-foreground">
                You haven&apos;t sent any pending invitations. Browse the global map to find new friends!
              </p>
              <Link href="/explore">
                <Button size="sm" className="text-xs rounded-xl mt-2">
                  Browse Map
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {outgoingRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-5 rounded-3xl border border-border/80 bg-card shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div
                      className={`w-12 h-12 rounded-full bg-gradient-to-br ${req.avatarBg} text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm`}
                    >
                      {req.displayName.substring(0, 2).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">
                          {req.displayName}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">
                          @{req.username}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          • {req.countryFlag} {req.city}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        Note: &quot;{req.note}&quot;
                      </p>

                      <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground font-mono">
                        <Clock className="w-3 h-3 text-amber-500" />
                        <span>Sent {req.sentAt} • Awaiting acceptance</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => cancelConnectionRequest(req.id)}
                    className="text-xs font-semibold rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                  >
                    Cancel Request
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
