"use client";

import React, { useState, useRef } from "react";
import { Search, Loader2, MessageSquare, ArrowRight, UserPlus, Check, X, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { useConnections } from "@/lib/connections-context";
import { useAuth, getBackendUrl } from "@/lib/auth-context";
import { useChat } from "@/lib/chat-context";
import { PublicUserProfile } from "./user-profile-dialog";

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
  const { sendConnectionRequest, isConnectedWith, hasSentRequestTo } = useConnections();
  const { firebaseUser } = useAuth();
  const { startChatWithUser, threads, selectThread } = useChat();

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PublicUserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const backendUrl = getBackendUrl();

  if (!isOpen) return null;

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanQuery = query.trim();
    if (!cleanQuery || !firebaseUser) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      const token = await firebaseUser.getIdToken();
      // Uses the verified backend search endpoint that handles @-stripping and ID normalization
      const res = await fetch(
        `${backendUrl}/api/v1/users/search?q=${encodeURIComponent(cleanQuery)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setSearchResults(Array.isArray(data) ? data : []);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.warn("Search request error:", err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleOpenExistingConversation = (userId: string) => {
    const existingThread = threads.find((t) => t.participant?.id === userId || t.id === userId);
    if (existingThread) {
      selectThread(existingThread.id);
    }
    onClose();
  };

  const handleStartChat = async (targetUser: PublicUserProfile) => {
    // If already connected, open chat directly
    if (isConnectedWith(targetUser.id) || targetUser.relationship_status === "ACCEPTED") {
      startChatWithUser({
        id: targetUser.id,
        username: targetUser.username,
        displayName: targetUser.display_name,
        plexoChatId: `@${targetUser.username}`,
        avatarBg: "from-blue-600 to-indigo-600",
        preferredLanguage: targetUser.preferred_receiving_language || "English",
        online: true,
      });
      onClose();
      return;
    }

    // If not yet connected, send connection request
    const success = await sendConnectionRequest({
      id: targetUser.id,
      displayName: targetUser.display_name,
    });
    if (success) {
      onRequestSent(targetUser.display_name);
      setSearchResults((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, relationship_status: "REQUEST_SENT" } : u))
      );
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs sm:p-4">
        {/* Backdrop click to dismiss */}
        <div className="absolute inset-0 z-0" onClick={onClose} />

        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          className="relative z-10 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-card border border-border p-5 sm:p-6 shadow-2xl flex flex-col max-h-[85dvh] sm:max-h-[560px] pb-[max(1.5rem,env(safe-area-inset-bottom))]"
        >
          {/* Mobile Drag Indicator */}
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mb-3 sm:hidden shrink-0" />

          {/* Modal Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border/70 shrink-0">
            <div>
              <h3 className="text-base font-bold text-foreground">New Conversation</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Search a member by PlexoChat ID or username
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="pt-3 pb-2 shrink-0">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    if (!e.target.value.trim()) {
                      setHasSearched(false);
                      setSearchResults([]);
                    }
                  }}
                  placeholder="Enter PlexoChat ID (e.g. @alpha or username)"
                  autoFocus
                  className="w-full h-9 pl-9 pr-3 rounded-xl border border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground text-xs focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
                />
              </div>

              <Button
                type="submit"
                disabled={!query.trim() || isSearching}
                className="h-9 px-3.5 rounded-xl text-xs font-semibold gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSearching ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span>Search</span>
                )}
              </Button>
            </div>
          </form>

          {/* Explicit States Area */}
          <div className="flex-1 overflow-y-auto no-scrollbar py-2">
            {/* State 1: Searching Spinner */}
            {isSearching && (
              <div className="py-12 flex flex-col items-center justify-center space-y-2 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">Searching PlexoChat directory...</p>
              </div>
            )}

            {/* State 2: User Not Found */}
            {!isSearching && hasSearched && searchResults.length === 0 && (
              <EmptyState
                icon={Search}
                title="No PlexoChat user found"
                description={`We couldn't find anyone matching "${query}". Verify the PlexoChat ID or username and try again.`}
                className="border-none bg-transparent py-8"
              />
            )}

            {/* State 3: User Found (Search Results List) */}
            {!isSearching && searchResults.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
                  Found Members ({searchResults.length})
                </div>

                <div className="divide-y divide-border/50 rounded-2xl border border-border/70 bg-secondary/20 overflow-hidden">
                  {searchResults.map((target) => {
                    const alreadyConnected =
                      isConnectedWith(target.id) || target.relationship_status === "ACCEPTED";
                    const requestAlreadySent =
                      hasSentRequestTo(target.id) || target.relationship_status === "REQUEST_SENT";

                    return (
                      <div
                        key={target.id}
                        className="p-3 flex items-center justify-between gap-3 hover:bg-secondary/40 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <UserAvatar
                            name={target.display_name}
                            size="md"
                            online={true}
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-xs text-foreground truncate">
                              {target.display_name}
                            </div>
                            <div className="text-[11px] text-muted-foreground font-mono truncate">
                              @{target.username}
                            </div>
                            {target.preferred_receiving_language && (
                              <div className="text-[10px] text-primary/80 font-mono mt-0.5">
                                Language: {target.preferred_receiving_language.toUpperCase()}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Button: State-dependent */}
                        <div className="shrink-0">
                          {alreadyConnected ? (
                            <Button
                              size="sm"
                              onClick={() => handleOpenExistingConversation(target.id)}
                              className="h-8 px-3 rounded-xl text-xs font-semibold gap-1 cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Open Conversation</span>
                            </Button>
                          ) : requestAlreadySent ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled
                              className="h-8 px-3 rounded-xl text-xs text-muted-foreground gap-1 opacity-70"
                            >
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Request Sent</span>
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleStartChat(target)}
                              className="h-8 px-3 rounded-xl text-xs font-semibold gap-1 cursor-pointer"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Start Chat</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* State 4: Initial Prompt */}
            {!isSearching && !hasSearched && (
              <div className="py-10 text-center space-y-2 select-none">
                <div className="w-10 h-10 rounded-2xl bg-secondary mx-auto flex items-center justify-center text-muted-foreground">
                  <MessageSquare className="w-5 h-5 opacity-75" />
                </div>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  Type a friend&apos;s username or PlexoChat ID to search and initiate an encrypted conversation.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
