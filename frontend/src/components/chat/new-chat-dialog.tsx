"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, UserPlus, Check, X, ShieldAlert, Loader2, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useConnections } from "@/lib/connections-context";
import { useAuth, getBackendUrl } from "@/lib/auth-context";
import { useChat } from "@/lib/chat-context";
import { UserProfileDialog, PublicUserProfile } from "./user-profile-dialog";

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
  const { sendConnectionRequest, hasSentRequestTo, isConnectedWith } = useConnections();
  const { firebaseUser } = useAuth();
  const { startChatWithUser } = useChat();
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PublicUserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<PublicUserProfile | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const backendUrl = getBackendUrl();
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setSearchResults([]);
      setIsLoading(false);
      return;
    }

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(async () => {
      if (!firebaseUser) return;
      setIsLoading(true);
      try {
        const token = await firebaseUser.getIdToken();
        const res = await fetch(
          `${backendUrl}/api/v1/users/search?q=${encodeURIComponent(query.trim())}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data || []);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.warn("Search error:", err);
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query, firebaseUser, backendUrl]);

  if (!isOpen) return null;

  const handleSend = async (target: PublicUserProfile) => {
    const ok = await sendConnectionRequest({ id: target.id, displayName: target.display_name });
    if (ok) {
      onRequestSent(target.display_name);
      setSearchResults((prev) =>
        prev.map((u) => (u.id === target.id ? { ...u, relationship_status: "REQUEST_SENT" } : u))
      );
    }
  };

  const handleOpenProfile = (profile: PublicUserProfile) => {
    setSelectedProfile(profile);
    setIsProfileOpen(true);
  };

  const handleStartChat = (user: { id: string; username: string; displayName: string }) => {
    startChatWithUser({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      plexoChatId: `@${user.username}`,
      avatarBg: "from-blue-600 to-indigo-600",
      preferredLanguage: "English",
      online: true,
    });
    onClose();
  };

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs sm:p-4">
          <div className="absolute inset-0 z-0" onClick={onClose} />

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
                  Search registered users across PlexoChat
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
              {isLoading ? (
                <Loader2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin" />
              ) : (
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              )}
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
                  <p className="font-semibold text-foreground">Search by username or ID</p>
                  <p className="text-[11px]">
                    Enter at least 2 characters to discover users on PlexoChat.
                  </p>
                </div>
              ) : isLoading && searchResults.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
                  <Loader2 className="w-6 h-6 text-primary mx-auto animate-spin" />
                  <p>Searching database...</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground space-y-1">
                  <ShieldAlert className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                  <p className="font-semibold text-foreground">No member found</p>
                  <p className="text-[11px]">
                    No registered user matches &quot;{query}&quot;.
                  </p>
                </div>
              ) : (
                searchResults.map((target) => {
                  const isSent =
                    target.relationship_status === "REQUEST_SENT" || hasSentRequestTo(target.id);
                  const isConnected =
                    target.relationship_status === "ACCEPTED" || isConnectedWith(target.id);

                  return (
                    <div
                      key={target.id}
                      className="pt-3 pb-2.5 flex items-center justify-between gap-3 group cursor-pointer hover:bg-secondary/20 -mx-2 px-2 rounded-xl transition-colors"
                      onClick={() => handleOpenProfile(target)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                          {target.display_name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-xs text-foreground truncate">
                            {target.display_name}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono truncate">
                            @{target.username} • ID: {target.plexochat_id}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                        {isConnected ? (
                          <Button
                            size="sm"
                            onClick={() => handleStartChat({ id: target.id, username: target.username, displayName: target.display_name })}
                            className="h-8 px-3 text-xs font-semibold rounded-xl gap-1.5 shadow-xs"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Message</span>
                          </Button>
                        ) : isSent ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled
                            className="h-8 px-3 text-xs font-semibold rounded-xl gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Pending</span>
                          </Button>
                        ) : target.relationship_status === "REQUEST_RECEIVED" ? (
                          <Button
                            size="sm"
                            onClick={() => handleOpenProfile(target)}
                            className="h-8 px-3 text-xs font-semibold rounded-xl gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Respond</span>
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleSend(target)}
                            className="h-8 px-3 text-xs font-semibold rounded-xl gap-1.5 shadow-xs active:scale-95"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Connect</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Trust Notice */}
            <div className="pt-2.5 border-t border-border/40 text-[10px] text-muted-foreground flex items-center gap-1.5 shrink-0">
              <span>🔒 Direct messaging unlocks immediately once connection is accepted.</span>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      <UserProfileDialog
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={selectedProfile}
        onStartChat={handleStartChat}
        onActionComplete={() => {
          if (selectedProfile) {
            setSearchResults((prev) =>
              prev.map((u) =>
                u.id === selectedProfile.id
                  ? { ...u, relationship_status: selectedProfile.relationship_status }
                  : u
              )
            );
          }
        }}
      />
    </>
  );
}
