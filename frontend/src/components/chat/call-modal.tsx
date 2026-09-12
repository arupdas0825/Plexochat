"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { useCall } from "@/lib/call-context";
import { UserAvatar } from "@/components/ui/user-avatar";

export function CallModal() {
  const {
    callState,
    callType,
    activePeer,
    localStream,
    remoteStream,
    isMuted,
    isCameraOff,
    formattedDuration,
    errorMessage,
    acceptCall,
    declineCall,
    endCall,
    toggleMute,
    toggleCamera,
    switchCamera,
  } = useCall();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callState]);

  // Attach remote stream to video or audio element
  useEffect(() => {
    if (remoteStream) {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
      }
    }
  }, [remoteStream, callState]);

  if (callState === "IDLE") {
    return null;
  }

  const isIncoming = callState === "RINGING";
  const isActiveOrCalling = !isIncoming;

  return (
    <>
      {/* Hidden audio element to ensure remote audio always plays through speakers/headphones */}
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

      {/* 1. INCOMING CALL BANNER / DIALOG */}
      <AnimatePresence>
        {isIncoming && activePeer && (
          <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-black/60 backdrop-blur-md pointer-events-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-sm rounded-3xl bg-card border border-border/80 shadow-2xl p-6 text-center select-none"
            >
              {/* Caller Avatar with subtle pulsing ring */}
              <div className="relative mx-auto w-20 h-20 mb-4 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-60" />
                <UserAvatar
                  name={activePeer.displayName}
                  avatarBg={activePeer.avatarBg}
                  size="lg"
                  className="w-20 h-20 text-2xl relative z-10 ring-2 ring-primary/40 shadow-lg"
                />
              </div>

              {/* Caller Name & Type */}
              <h3 className="text-lg font-bold text-foreground truncate">
                {activePeer.displayName}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 font-medium">
                Incoming {callType === "video" ? "Video Call" : "Voice Call"}...
              </p>

              {/* Encryption trust badge */}
              <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary text-[11px] font-mono text-muted-foreground">
                <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Encrypted Call</span>
              </div>

              {/* Action Buttons: Accept & Decline */}
              <div className="mt-8 flex items-center justify-center gap-6">
                {/* Decline Button */}
                <button
                  type="button"
                  onClick={declineCall}
                  className="flex flex-col items-center gap-1.5 group cursor-pointer"
                  title="Decline"
                >
                  <div className="w-14 h-14 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg transition-transform active:scale-90 group-hover:opacity-90">
                    <PhoneOff className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground">
                    Decline
                  </span>
                </button>

                {/* Accept Button */}
                <button
                  type="button"
                  onClick={acceptCall}
                  className="flex flex-col items-center gap-1.5 group cursor-pointer"
                  title="Accept"
                >
                  <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg transition-transform active:scale-90 group-hover:bg-emerald-500 animate-bounce">
                    <Phone className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground">
                    Accept
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. ACTIVE CALL & OUTGOING CALLING OVERLAY */}
      <AnimatePresence>
        {isActiveOrCalling && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-2xl flex flex-col justify-between overflow-hidden select-none"
          >
            {/* Top Bar: Participant Info & Timer */}
            <div className="p-4 sm:p-6 flex items-center justify-between z-20">
              <div className="flex items-center gap-3">
                <UserAvatar
                  name={activePeer?.displayName || "User"}
                  avatarBg={activePeer?.avatarBg}
                  size="md"
                />
                <div>
                  <div className="font-bold text-sm text-foreground">
                    {activePeer?.displayName || "User"}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono flex items-center gap-2">
                    <span>
                      {callState === "CONNECTED"
                        ? formattedDuration
                        : callState === "CALLING"
                        ? "Calling..."
                        : callState === "CONNECTING"
                        ? "Connecting..."
                        : callState === "RECONNECTING"
                        ? "Reconnecting..."
                        : callState === "BUSY"
                        ? "User busy"
                        : callState === "DECLINED"
                        ? "Call declined"
                        : callState === "ENDED"
                        ? "Call ended"
                        : "Calling"}
                    </span>
                    <span className="opacity-40">•</span>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-muted-foreground" />
                      <span>Encrypted</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Error banner if any */}
              {errorMessage && (
                <div className="px-3 py-1 rounded-full bg-destructive/15 border border-destructive/30 text-destructive text-xs flex items-center gap-1.5 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            {/* Main Stage: Video stream or Audio visualizer */}
            <div className="flex-1 relative flex items-center justify-center p-4 min-h-0">
              {callType === "video" && remoteStream && !isCameraOff ? (
                /* Remote Video Full Container */
                <div className="w-full h-full max-w-5xl max-h-full rounded-3xl overflow-hidden bg-black/80 relative flex items-center justify-center shadow-2xl border border-border/40">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                /* Audio Call Central Stage / Video Waiting State */
                <div className="flex flex-col items-center justify-center text-center space-y-4">
                  <div className="relative flex items-center justify-center">
                    {callState === "CONNECTED" && (
                      <div className="absolute w-36 h-36 rounded-full bg-primary/15 animate-ping" />
                    )}
                    <UserAvatar
                      name={activePeer?.displayName || "User"}
                      avatarBg={activePeer?.avatarBg}
                      size="lg"
                      className="w-28 h-28 text-3xl shadow-2xl ring-4 ring-border relative z-10"
                    />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-foreground">
                      {activePeer?.displayName || "User"}
                    </h2>
                    <p className="text-xs text-muted-foreground font-mono mt-1">
                      {callState === "CONNECTED"
                        ? `Connected (${formattedDuration})`
                        : callState === "CALLING"
                        ? "Ringing peer..."
                        : callState === "CONNECTING"
                        ? "Establishing encrypted P2P handshake..."
                        : callState === "RECONNECTING"
                        ? "Network changed, reconnecting..."
                        : callState === "BUSY"
                        ? "User is on another call"
                        : callState === "DECLINED"
                        ? "Call was declined"
                        : "Ending..."}
                    </p>
                  </div>
                </div>
              )}

              {/* Local Video PIP in Corner (for video calls) */}
              {callType === "video" && localStream && (
                <div className="absolute bottom-6 right-6 w-28 h-40 sm:w-36 sm:h-48 rounded-2xl overflow-hidden shadow-2xl border-2 border-border/80 bg-card/90 z-20">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                  {isCameraOff && (
                    <div className="absolute inset-0 bg-secondary flex items-center justify-center text-muted-foreground text-xs font-mono">
                      Camera Off
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Control Bar: Minimal, restrained pill */}
            <div className="p-6 pb-10 flex justify-center z-20">
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-card/90 border border-border/80 shadow-2xl backdrop-blur-xl">
                {/* Mute Microphone Toggle */}
                <button
                  type="button"
                  onClick={toggleMute}
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                    isMuted
                      ? "bg-destructive text-destructive-foreground hover:opacity-90"
                      : "bg-secondary text-foreground hover:bg-secondary/80"
                  }`}
                  title={isMuted ? "Unmute microphone" : "Mute microphone"}
                  aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                {/* Video Camera Toggle (Video Calls only) */}
                {callType === "video" && (
                  <button
                    type="button"
                    onClick={toggleCamera}
                    className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                      isCameraOff
                        ? "bg-destructive text-destructive-foreground hover:opacity-90"
                        : "bg-secondary text-foreground hover:bg-secondary/80"
                    }`}
                    title={isCameraOff ? "Turn camera on" : "Turn camera off"}
                    aria-label={isCameraOff ? "Turn camera on" : "Turn camera off"}
                  >
                    {isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                  </button>
                )}

                {/* Switch Camera (Front/Back on Mobile) */}
                {callType === "video" && (
                  <button
                    type="button"
                    onClick={switchCamera}
                    className="w-11 h-11 rounded-full bg-secondary text-foreground hover:bg-secondary/80 flex items-center justify-center transition-colors cursor-pointer"
                    title="Flip camera"
                    aria-label="Flip camera"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}

                {/* Hang Up Button */}
                <button
                  type="button"
                  onClick={endCall}
                  className="w-12 h-12 rounded-full bg-destructive text-destructive-foreground hover:opacity-90 flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer ml-1"
                  title="End call"
                  aria-label="End call"
                >
                  <PhoneOff className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
