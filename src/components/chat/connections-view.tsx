"use client";

/**
 * Design Source: 21st.dev contact management / request lifecycle pattern
 * Enforces PRD connection trust model: Accept / Decline / Block
 */
import React from "react";
import { UserCheck, UserX, Ban, ShieldCheck, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConnectionRequest, ChatThread } from "@/lib/mock-chat-data";

interface ConnectionsViewProps {
  requests: ConnectionRequest[];
  onAcceptRequest: (reqId: string) => void;
  onDeclineRequest: (reqId: string) => void;
  onBlockUser: (reqId: string) => void;
  activeThreads: ChatThread[];
  onSelectChat: (threadId: string) => void;
}

export function ConnectionsView({
  requests,
  onAcceptRequest,
  onDeclineRequest,
  onBlockUser,
  activeThreads,
  onSelectChat,
}: ConnectionsViewProps) {
  const pending = requests.filter((r) => r.status === "PENDING");

  return (
    <div className="flex-1 h-full overflow-y-auto p-4 sm:p-8 space-y-8 bg-background">
      
      {/* Top Header */}
      <div className="max-w-2xl">
        <h2 className="text-2xl font-bold text-foreground">Contacts & Requests</h2>
        <p className="text-sm text-muted-foreground mt-1">
          PlexoChat protects your inbox. Unsolicited messaging is blocked until you explicitly accept a connection request.
        </p>
      </div>

      {/* Incoming Connection Requests */}
      <div className="max-w-2xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <span>Pending Requests</span>
            {pending.length > 0 && (
              <Badge variant="accent" className="text-[10px] py-0 px-2">
                {pending.length} new
              </Badge>
            )}
          </h3>
        </div>

        {pending.length === 0 ? (
          <div className="p-6 rounded-2xl bg-secondary/30 border border-border/50 text-center text-xs text-muted-foreground">
            No pending connection requests.
          </div>
        ) : (
          pending.map((req) => (
            <div
              key={req.id}
              className="p-4 rounded-2xl bg-card border border-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-full bg-gradient-to-br ${req.sender.avatarBg} text-white font-bold text-sm flex items-center justify-center`}
                >
                  {req.sender.displayName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-sm text-foreground">
                    {req.sender.displayName}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    @{req.sender.username} • {req.sender.plexoChatId}
                  </div>
                  <div className="text-[11px] text-primary/80 mt-0.5 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" />
                    <span>Requested {req.timestamp} • Speaks {req.sender.preferredLanguage}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Accept / Decline / Block */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => onAcceptRequest(req.id)}
                  className="h-8 px-3.5 text-xs font-semibold gap-1.5 shadow-sm"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Accept</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDeclineRequest(req.id)}
                  className="h-8 px-3 text-xs"
                >
                  <UserX className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Decline</span>
                </Button>
                <button
                  type="button"
                  onClick={() => onBlockUser(req.id)}
                  className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Block this user"
                >
                  <Ban className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Active Verified Connections */}
      <div className="max-w-2xl space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Active Contacts ({activeThreads.length})
        </h3>

        <div className="space-y-2">
          {activeThreads.map((thread) => {
            const p = thread.participant;
            return (
              <div
                key={thread.id}
                onClick={() => onSelectChat(thread.id)}
                className="p-3.5 rounded-2xl bg-card border border-border/70 hover:border-primary/40 hover:bg-secondary/40 transition-all flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full bg-gradient-to-br ${p.avatarBg} text-white font-bold text-sm flex items-center justify-center`}
                  >
                    {p.displayName.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-foreground">
                      {p.displayName}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      @{p.username} • Receives {p.preferredLanguage}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-primary font-medium">
                  <span>Chat</span>
                  <span>→</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trust Notice */}
      <div className="max-w-2xl p-4 rounded-2xl bg-secondary/30 border border-border/50 text-xs text-muted-foreground flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
        <span>End-to-End Encrypted sessions are established upon mutual connection acceptance.</span>
      </div>

    </div>
  );
}
