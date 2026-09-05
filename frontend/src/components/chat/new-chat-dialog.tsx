"use client";

import React, { useState } from "react";
import { Search, UserPlus, Check, X, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useConnections } from "@/lib/connections-context";
import { DiscoverableUser } from "@/lib/explore-calendar-data";

interface NewChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestSent: (username: string) => void;
}

export function NewChatDialog({
  isOpen,
  onClose,
  onRequestSent,
}: NewChatDialogProps) {
  const { exploreUsers, sendConnectionRequest, hasSentRequestTo } = useConnections();
  const [query, setQuery] = useState("");
  const [sentRequests, setSentRequests] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const filteredUsers = query.trim()
    ? exploreUsers.filter(
        (u) =>
          u.username.toLowerCase().includes(query.toLowerCase()) ||
          u.displayName.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const handleSend = (user: DiscoverableUser) => {
    sendConnectionRequest(user);
    setSentRequests((prev) => ({ ...prev, [user.id]: true }));
    onRequestSent(user.displayName);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs sm:p-4">
        {/* Backdrop click to dismiss */}
        <div className="absolute inset-0 z-0" onClick={onClose} />

        {/* Bottom sheet on mobile / centered modal on desktop */}
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          drag="y"
          dragConstraints={{ top: 0 }}
          dragElastic={0.2}
          onDragEnd={(_, info) => {
            if (info.offset.y > 100) {
              onClose();
            }
          }}
          className="relative z-10 w-full sm:max-w-md max-h-[85dvh] sm:max-h-[550px] rounded-t-3xl sm:rounded-3xl bg-card border border-border p-5 sm:p-6 shadow-2xl flex flex-col pb-[max(1.5rem,env(safe-area-inset-bottom))]"
        >
          {/* Mobile Drag Handle */}
          <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30 mx-auto mb-3 sm:hidden shrink-0" />

          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border/60 shrink-0">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-foreground">Start New Chat</h3>
              <p className="text-xs text-muted-foreground">
                Search by unique username or PlexoChat ID
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary active:scale-95 transition-all touch-manipulation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Input */}
          <div className="my-3 relative shrink-0">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a username or PlexoChat ID..."
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-secondary/30 text-foreground placeholder:text-muted-foreground text-[16px] sm:text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
          </div>

          {/* User Results List */}
          <div className="flex-1 overflow-y-auto momentum-scroll pr-1 divide-y divide-border/40">
            {!query.trim() ? (
              <div className="p-8 text-center text-xs text-muted-foreground space-y-1">
                <Search className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <p className="font-semibold text-foreground">Search by username</p>
                <p className="text-[11px]">
                  Enter a username or PlexoChat ID to find and connect with someone.
                </p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground space-y-1">
                <ShieldAlert className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <p className="font-semibold text-foreground">No member found</p>
                <p className="text-[11px]">
                  No registered user matches &quot;{query}&quot;. Verify the ID and try again.
                </p>
              </div>
            ) : (
              filteredUsers.map((target) => {
                const isSent = sentRequests[target.id] || hasSentRequestTo(target.id);

                return (
                  <div
                    key={target.id}
                    className="pt-3 pb-2.5 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-full bg-gradient-to-br ${target.avatarBg} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs`}
                      >
                        {target.displayName.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-foreground truncate">
                          {target.displayName}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          @{target.username}
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant={isSent ? "secondary" : "default"}
                      disabled={isSent}
                      onClick={() => handleSend(target)}
                      className="h-8 px-3 text-xs font-semibold rounded-xl gap-1.5 shrink-0 active:scale-95 touch-manipulation"
                    >
                      {isSent ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Sent</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Connect</span>
                        </>
                      )}
                    </Button>
                  </div>
                );
              })
            )}
          </div>

          {/* Trust Notice */}
          <div className="pt-2.5 border-t border-border/40 text-[10px] text-muted-foreground flex items-center gap-1.5 shrink-0">
            <span>🔒 Invitations and subsequent messages are end-to-end encrypted.</span>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
