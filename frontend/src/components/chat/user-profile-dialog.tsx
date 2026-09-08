"use client";

import React, { useState } from "react";
import {
  X,
  UserPlus,
  Check,
  MessageSquare,
  ShieldAlert,
  Ban,
  Globe,
  Lock,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useConnections } from "@/lib/connections-context";
import { useAuth, getBackendUrl } from "@/lib/auth-context";

export interface PublicUserProfile {
  id: string;
  username: string;
  plexochat_id: string;
  display_name: string;
  photo_url?: string;
  preferred_receiving_language?: string;
  relationship_status?: "NONE" | "REQUEST_SENT" | "REQUEST_RECEIVED" | "ACCEPTED" | "BLOCKED";
  connection_request_id?: string;
}

interface UserProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PublicUserProfile | null;
  onStartChat?: (user: { id: string; username: string; displayName: string }) => void;
  onActionComplete?: () => void;
}

export function UserProfileDialog({
  isOpen,
  onClose,
  profile,
  onStartChat,
  onActionComplete,
}: UserProfileDialogProps) {
  const {
    sendConnectionRequest,
    acceptConnectionRequest,
    declineConnectionRequest,
    blockConnectionUser,
    refreshConnections,
  } = useConnections();
  const { firebaseUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [note, setNote] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string | undefined>(
    profile?.relationship_status
  );

  // Sync state when profile changes
  React.useEffect(() => {
    setCurrentStatus(profile?.relationship_status);
    setShowNoteInput(false);
    setNote("");
  }, [profile]);

  if (!isOpen || !profile) return null;

  const handleSendRequest = async () => {
    setIsSubmitting(true);
    try {
      const ok = await sendConnectionRequest({ id: profile.id, displayName: profile.display_name }, note);
      if (ok) {
        setCurrentStatus("REQUEST_SENT");
        setShowNoteInput(false);
        if (onActionComplete) onActionComplete();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAccept = async () => {
    if (!profile.connection_request_id) return;
    setIsSubmitting(true);
    try {
      await acceptConnectionRequest(profile.connection_request_id);
      setCurrentStatus("ACCEPTED");
      if (onActionComplete) onActionComplete();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecline = async () => {
    if (!profile.connection_request_id) return;
    setIsSubmitting(true);
    try {
      await declineConnectionRequest(profile.connection_request_id);
      setCurrentStatus("NONE");
      if (onActionComplete) onActionComplete();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBlock = async () => {
    if (!window.confirm(`Are you sure you want to block ${profile.display_name}? This will revoke chat and communication.`)) {
      return;
    }
    setIsSubmitting(true);
    try {
      await blockConnectionUser(profile.id);
      setCurrentStatus("BLOCKED");
      if (onActionComplete) onActionComplete();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMessage = () => {
    onClose();
    if (onStartChat) {
      onStartChat({
        id: profile.id,
        username: profile.username,
        displayName: profile.display_name,
      });
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs sm:p-4">
        <div className="absolute inset-0 z-0" onClick={onClose} />

        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          className="relative z-10 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-card border border-border p-6 shadow-2xl flex flex-col gap-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-border/50">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              Verified Profile
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Profile Card */}
          <div className="flex items-center gap-4 py-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xl flex items-center justify-center shadow-md shrink-0">
              {profile.display_name.substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-bold text-foreground truncate">
                {profile.display_name}
              </h3>
              <p className="text-xs text-muted-foreground font-mono">
                @{profile.username}
              </p>
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-md font-mono">
                  ID: {profile.plexochat_id}
                </Badge>
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Globe className="w-3 h-3 text-primary" />
                  {profile.preferred_receiving_language?.toUpperCase() || "EN"}
                </span>
              </div>
            </div>
          </div>

          {/* Note Input if Sending Request */}
          {showNoteInput && currentStatus === "NONE" && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground">
                Optional Greeting Note
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Hi, let's connect and exchange languages!"
                maxLength={120}
                className="w-full h-10 px-3 rounded-xl border border-border bg-secondary/40 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          )}

          {/* Action Buttons based on Relationship Status */}
          <div className="pt-2 flex flex-col gap-2">
            {currentStatus === "ACCEPTED" ? (
              <Button
                onClick={handleMessage}
                className="w-full h-11 rounded-xl gap-2 font-semibold shadow-md active:scale-98 transition-transform"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Message on PlexoChat</span>
              </Button>
            ) : currentStatus === "REQUEST_SENT" ? (
              <Button
                disabled
                variant="secondary"
                className="w-full h-11 rounded-xl gap-2 font-medium"
              >
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Connection Request Pending</span>
              </Button>
            ) : currentStatus === "REQUEST_RECEIVED" ? (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={handleAccept}
                  disabled={isSubmitting}
                  className="h-11 rounded-xl font-semibold gap-1.5 shadow-sm"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Accept</span>
                </Button>
                <Button
                  onClick={handleDecline}
                  disabled={isSubmitting}
                  variant="outline"
                  className="h-11 rounded-xl font-semibold gap-1.5"
                >
                  <X className="w-4 h-4" />
                  <span>Decline</span>
                </Button>
              </div>
            ) : currentStatus === "BLOCKED" ? (
              <Button
                disabled
                variant="destructive"
                className="w-full h-11 rounded-xl gap-2 font-medium opacity-80"
              >
                <Ban className="w-4 h-4" />
                <span>User Blocked</span>
              </Button>
            ) : (
              // NONE
              showNoteInput ? (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={handleSendRequest}
                    disabled={isSubmitting}
                    className="h-11 rounded-xl font-semibold gap-1.5 shadow-sm"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                    <span>Send Now</span>
                  </Button>
                  <Button
                    onClick={() => setShowNoteInput(false)}
                    variant="outline"
                    className="h-11 rounded-xl font-semibold"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => setShowNoteInput(true)}
                  className="w-full h-11 rounded-xl gap-2 font-semibold shadow-md active:scale-98 transition-transform"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Send Connection Request</span>
                </Button>
              )
            )}

            {/* Block Action */}
            {currentStatus !== "BLOCKED" && (
              <button
                type="button"
                onClick={handleBlock}
                disabled={isSubmitting}
                className="text-[11px] text-muted-foreground/80 hover:text-destructive text-center py-1 transition-colors flex items-center justify-center gap-1"
              >
                <Ban className="w-3 h-3" />
                <span>Block User</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
