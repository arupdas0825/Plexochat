"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Phone,
  Video,
  Copy,
  Check,
  Bell,
  BellOff,
  Star,
  Globe2,
  Clock,
  ShieldCheck,
  Trash2,
  Ban,
  Image as ImageIcon,
  ChevronRight,
  Lock,
  Search,
} from "lucide-react";
import { ChatThread, ChatUser } from "@/lib/mock-chat-data";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useChat } from "@/lib/chat-context";
import { useCall } from "@/lib/call-context";
import { useConnections } from "@/lib/connections-context";
import { SUPPORTED_LANGUAGES } from "@/lib/auth-context";

interface ChatInfoPanelProps {
  thread: ChatThread;
  onClose: () => void;
  autoTranslateEnabled?: boolean;
  onToggleAutoTranslate?: () => void;
}

const DISAPPEARING_OPTIONS = [
  { label: "Off", value: null },
  { label: "24 hours", value: 86400 },
  { label: "7 days", value: 604800 },
  { label: "90 days", value: 7776000 },
];

export function ChatInfoPanel({
  thread,
  onClose,
  autoTranslateEnabled = true,
  onToggleAutoTranslate,
}: ChatInfoPanelProps) {
  const { clearChat, deleteChat, updateThreadPreferences, refreshPeerProfile } = useChat();
  const { startCall, callState } = useCall();
  const { connections, blockConnectionUser } = useConnections();

  const [copiedId, setCopiedId] = useState(false);
  const [showTtlPicker, setShowTtlPicker] = useState(false);
  const [confirmModal, setConfirmModal] = useState<"clear" | "delete" | "block" | null>(null);
  const [peerData, setPeerData] = useState<ChatUser>(thread.participant);

  // Check relationship status from connections context
  const isAccepted = useMemo(() => {
    return connections.some(
      (c) => c.userId === thread.participant.id || c.username === thread.participant.username
    );
  }, [connections, thread.participant.id, thread.participant.username]);

  // Fetch real profile data from backend when panel opens
  useEffect(() => {
    let isMounted = true;
    if (thread.participant.id) {
      refreshPeerProfile(thread.participant.id).then((fresh) => {
        if (isMounted && fresh) {
          setPeerData(fresh);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [thread.participant.id, refreshPeerProfile]);

  // Extract shared photos from messages
  const sharedMedia = useMemo(() => {
    return (thread.messages || []).filter((m) => m.isPhoto && m.photoUrl);
  }, [thread.messages]);

  const handleCopyId = () => {
    const textToCopy = peerData.plexoChatId || `@${peerData.username}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleToggleMute = () => {
    updateThreadPreferences(thread.id, { muted: !thread.muted });
  };

  const handleToggleFavorite = () => {
    updateThreadPreferences(thread.id, { favorite: !thread.favorite });
  };

  const handleSelectTtl = (ttl: number | null) => {
    updateThreadPreferences(thread.id, { disappearing_ttl: ttl });
    setShowTtlPicker(false);
  };

  const currentTtlLabel = useMemo(() => {
    if (!thread.disappearingTtl) return "Off";
    const found = DISAPPEARING_OPTIONS.find((o) => o.value === thread.disappearingTtl);
    return found ? found.label : `${Math.round(thread.disappearingTtl / 86400)} days`;
  }, [thread.disappearingTtl]);

  const receivingLangObj = useMemo(() => {
    return SUPPORTED_LANGUAGES.find(
      (l) => l.code.toLowerCase() === (peerData.languageCode || "en").toLowerCase()
    );
  }, [peerData.languageCode]);

  const isCallActive = callState !== "IDLE";

  return (
    <>
      <aside className="w-full md:w-88 lg:w-96 shrink-0 h-full border-l border-border/70 bg-card/98 backdrop-blur-md flex flex-col z-30 overflow-hidden select-none">
        {/* Panel Header */}
        <div className="h-14 px-4 border-b border-border/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
              title="Close panel"
              aria-label="Close panel"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-sm font-semibold text-foreground">Contact info</h2>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
          {/* Hero / Identity */}
          <div className="flex flex-col items-center text-center">
            <UserAvatar
              name={peerData.displayName}
              avatarBg={peerData.avatarBg}
              photoUrl={peerData.photoUrl}
              size="xl"
              online={peerData.online}
              className="mb-3"
            />
            <h3 className="text-lg font-bold text-foreground tracking-tight">
              {peerData.displayName}
            </h3>

            {/* PlexoChat ID with Copy Button */}
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs font-mono text-muted-foreground">
                {peerData.plexoChatId || `@${peerData.username}`}
              </span>
              <button
                type="button"
                onClick={handleCopyId}
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                title="Copy PlexoChat ID"
                aria-label="Copy PlexoChat ID"
              >
                {copiedId ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Online / Presence status */}
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
              <span
                className={`w-2 h-2 rounded-full ${
                  peerData.online ? "bg-emerald-500" : "bg-muted-foreground/40"
                }`}
              />
              <span>{peerData.online ? "Online" : "Offline"}</span>
              <span className="text-muted-foreground/40">•</span>
              <span className="font-mono text-[11px] text-muted-foreground">
                {isAccepted ? "Connected" : "Pending"}
              </span>
            </div>

            {/* Quick Action Bar (Voice / Video / Mute) */}
            <div className="grid grid-cols-3 gap-2 w-full mt-5">
              <button
                type="button"
                onClick={() => isAccepted && startCall(peerData, "voice")}
                disabled={!isAccepted || isCallActive}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-border/60 bg-background/50 hover:bg-secondary/70 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title={isAccepted ? `Voice call ${peerData.displayName}` : "Requires accepted connection"}
              >
                <Phone className="w-4 h-4 text-foreground mb-1" />
                <span className="text-[11px] font-medium text-foreground">Audio</span>
              </button>

              <button
                type="button"
                onClick={() => isAccepted && startCall(peerData, "video")}
                disabled={!isAccepted || isCallActive}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-border/60 bg-background/50 hover:bg-secondary/70 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title={isAccepted ? `Video call ${peerData.displayName}` : "Requires accepted connection"}
              >
                <Video className="w-4 h-4 text-foreground mb-1" />
                <span className="text-[11px] font-medium text-foreground">Video</span>
              </button>

              <button
                type="button"
                onClick={handleToggleMute}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-border/60 bg-background/50 hover:bg-secondary/70 transition-colors cursor-pointer"
                title={thread.muted ? "Unmute notifications" : "Mute notifications"}
              >
                {thread.muted ? (
                  <BellOff className="w-4 h-4 text-foreground mb-1" />
                ) : (
                  <Bell className="w-4 h-4 text-foreground mb-1" />
                )}
                <span className="text-[11px] font-medium text-foreground">
                  {thread.muted ? "Muted" : "Mute"}
                </span>
              </button>
            </div>
          </div>

          {/* About / Bio Section */}
          <div className="p-3.5 rounded-2xl border border-border/60 bg-background/40 space-y-1.5">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              About
            </h4>
            <p className="text-xs text-foreground leading-relaxed select-text">
              {peerData.bio?.trim() ? (
                peerData.bio.trim()
              ) : (
                <span className="text-muted-foreground/70 italic">No bio provided yet.</span>
              )}
            </p>
          </div>

          {/* Languages & Interests */}
          <div className="p-3.5 rounded-2xl border border-border/60 bg-background/40 space-y-3.5">
            {/* Preferred Receiving Language */}
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                <Globe2 className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Receiving Language</span>
              </div>
              <p className="text-xs font-medium text-foreground">
                {receivingLangObj
                  ? receivingLangObj.name
                  : peerData.preferredLanguage || "English"}
              </p>
              <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                Incoming messages are translated into this language.
              </p>
            </div>

            {/* Languages Spoken */}
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Languages Spoken
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {peerData.spokenLanguages && peerData.spokenLanguages.length > 0 ? (
                  peerData.spokenLanguages.map((lang, idx) => (
                    <span
                      key={`spoken-${idx}`}
                      className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-secondary text-secondary-foreground border border-border/40"
                    >
                      {lang}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground/70 italic">None listed</span>
                )}
              </div>
            </div>

            {/* Languages Learning */}
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Languages Learning
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {peerData.learningLanguages && peerData.learningLanguages.length > 0 ? (
                  peerData.learningLanguages.map((lang, idx) => (
                    <span
                      key={`learning-${idx}`}
                      className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-secondary text-secondary-foreground border border-border/40"
                    >
                      {lang}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground/70 italic">None listed</span>
                )}
              </div>
            </div>

            {/* Interests */}
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Interests
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {peerData.interests && peerData.interests.length > 0 ? (
                  peerData.interests.map((interest, idx) => (
                    <span
                      key={`interest-${idx}`}
                      className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-secondary text-secondary-foreground border border-border/40"
                    >
                      {interest}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground/70 italic">None listed</span>
                )}
              </div>
            </div>
          </div>

          {/* Conversation Preferences / Toggles */}
          <div className="p-3.5 rounded-2xl border border-border/60 bg-background/40 divide-y divide-border/40">
            {/* Mute Notifications */}
            <div className="flex items-center justify-between py-2.5 first:pt-0">
              <div className="flex items-center gap-2.5">
                <Bell className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium text-foreground">Mute notifications</p>
                  <p className="text-[10px] text-muted-foreground">Silence notifications for this chat</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={!!thread.muted}
                onChange={handleToggleMute}
                className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                aria-label="Mute notifications"
              />
            </div>

            {/* Favorite Conversation */}
            <div className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2.5">
                <Star className={`w-4 h-4 ${thread.favorite ? "text-amber-500 fill-amber-500" : "text-muted-foreground"}`} />
                <div>
                  <p className="text-xs font-medium text-foreground">Favorite chat</p>
                  <p className="text-[10px] text-muted-foreground">Keep pinned at top of your conversations</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={!!thread.favorite}
                onChange={handleToggleFavorite}
                className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                aria-label="Favorite chat"
              />
            </div>

            {/* Auto-Translate Messages */}
            {onToggleAutoTranslate && (
              <div className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2.5">
                  <Globe2 className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-medium text-foreground">Auto-translate</p>
                    <p className="text-[10px] text-muted-foreground">Translate messages automatically</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autoTranslateEnabled}
                  onChange={onToggleAutoTranslate}
                  className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                  aria-label="Auto-translate"
                />
              </div>
            )}

            {/* Disappearing Messages */}
            <div className="pt-2.5">
              <button
                type="button"
                onClick={() => setShowTtlPicker((prev) => !prev)}
                className="w-full flex items-center justify-between text-left cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-medium text-foreground">Disappearing messages</p>
                    <p className="text-[10px] text-muted-foreground">
                      Local messages auto-deleted from this device
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>{currentTtlLabel}</span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showTtlPicker ? "rotate-90" : ""}`} />
                </div>
              </button>

              {/* TTL Picker Dropdown */}
              <AnimatePresence>
                {showTtlPicker && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mt-2 pt-2 border-t border-border/40 space-y-1"
                  >
                    {DISAPPEARING_OPTIONS.map((opt) => {
                      const isSelected = thread.disappearingTtl === opt.value;
                      return (
                        <button
                          key={`ttl-opt-${opt.label}`}
                          type="button"
                          onClick={() => handleSelectTtl(opt.value)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-secondary text-foreground font-semibold"
                              : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                          }`}
                        >
                          <span>{opt.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Media, Links & Docs */}
          <div className="p-3.5 rounded-2xl border border-border/60 bg-background/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-muted-foreground" />
                <h4 className="text-xs font-medium text-foreground">Media & photos</h4>
              </div>
              <span className="text-[11px] font-mono text-muted-foreground">
                {sharedMedia.length}
              </span>
            </div>

            {sharedMedia.length > 0 ? (
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {sharedMedia.slice(0, 4).map((m, idx) => (
                  <div
                    key={`shared-media-${idx}`}
                    className="aspect-square rounded-lg bg-secondary overflow-hidden border border-border/40"
                  >
                    <img
                      src={m.photoUrl}
                      alt="Shared media"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground/70 italic pt-1">
                No media shared in this chat yet.
              </p>
            )}
          </div>

          {/* Encryption & Security Verification */}
          <div className="p-3.5 rounded-2xl border border-border/60 bg-background/40 space-y-2">
            <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>End-to-End Encryption</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Messages and calls are secured with client-side Olm Double-Ratchet encryption. Only you and {peerData.displayName} hold the cryptographic keys.
            </p>
            <div className="pt-1 font-mono text-[10px] text-muted-foreground/70 space-y-0.5">
              <div>Protocol: Olm v3.2 (Signal Double Ratchet)</div>
              <div>Verification: Peer session verified on-device</div>
            </div>
          </div>

          {/* Destructive Actions */}
          <div className="p-2 rounded-2xl border border-border/60 bg-background/40 space-y-1">
            {/* Clear Chat */}
            <button
              type="button"
              onClick={() => setConfirmModal("clear")}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer text-left"
            >
              <Trash2 className="w-4 h-4 text-rose-500" />
              <span>Clear chat</span>
            </button>

            {/* Delete Chat */}
            <button
              type="button"
              onClick={() => setConfirmModal("delete")}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer text-left"
            >
              <Trash2 className="w-4 h-4 text-rose-500" />
              <span>Delete chat</span>
            </button>

            {/* Block User */}
            <button
              type="button"
              onClick={() => setConfirmModal("block")}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer text-left"
            >
              <Ban className="w-4 h-4 text-rose-500" />
              <span>Block {peerData.displayName}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Confirmation Dialogs for Destructive Actions */}
      <AnimatePresence>
        {confirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm p-5 rounded-2xl bg-card border border-border shadow-2xl text-left space-y-3"
            >
              <h3 className="text-sm font-bold text-foreground">
                {confirmModal === "clear" && "Clear this chat?"}
                {confirmModal === "delete" && "Delete this chat?"}
                {confirmModal === "block" && `Block ${peerData.displayName}?`}
              </h3>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {confirmModal === "clear" &&
                  `This clears your local copy of this conversation on this device. It does not affect ${peerData.displayName}'s copy.`}
                {confirmModal === "delete" &&
                  `This deletes your local copy of this conversation and removes it from your chat list. It does not affect ${peerData.displayName}'s copy.`}
                {confirmModal === "block" &&
                  `Blocked contacts will no longer be able to send you messages or call you.`}
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmModal(null)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-secondary transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (confirmModal === "clear") {
                      await clearChat(thread.id);
                      setConfirmModal(null);
                    } else if (confirmModal === "delete") {
                      await deleteChat(thread.id);
                      setConfirmModal(null);
                      onClose();
                    } else if (confirmModal === "block") {
                      await blockConnectionUser(peerData.id);
                      setConfirmModal(null);
                      onClose();
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-colors cursor-pointer shadow-xs"
                >
                  {confirmModal === "clear" && "Clear Chat"}
                  {confirmModal === "delete" && "Delete Chat"}
                  {confirmModal === "block" && "Block"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
