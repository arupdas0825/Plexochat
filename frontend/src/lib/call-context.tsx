"use client";

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "./auth-context";
import { useChat } from "./chat-context";

export type CallState =
  | "IDLE"
  | "CALLING"
  | "RINGING"
  | "CONNECTING"
  | "CONNECTED"
  | "RECONNECTING"
  | "ENDED"
  | "DECLINED"
  | "BUSY"
  | "FAILED";

export type CallType = "voice" | "video";

export interface CallParticipant {
  id: string;
  displayName: string;
  username?: string;
  avatarUrl?: string;
  avatarBg?: string;
}

interface CallContextType {
  callState: CallState;
  callType: CallType;
  activePeer: CallParticipant | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isCameraOff: boolean;
  facingMode: "user" | "environment";
  callDuration: number;
  formattedDuration: string;
  errorMessage: string | null;
  startCall: (peer: CallParticipant, type: CallType) => Promise<void>;
  acceptCall: () => Promise<void>;
  declineCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  switchCamera: () => Promise<void>;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

// ---------------------------------------------------------------------------
// Synthesized Audio Tones using Web Audio API (Zero external assets)
// ---------------------------------------------------------------------------

class CallTonePlayer {
  private ctx: AudioContext | null = null;
  private intervalId: NodeJS.Timeout | null = null;
  private activeOscs: OscillatorNode[] = [];

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    const AudioCtx =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx || this.ctx.state === "closed") {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  playOutgoingRingtone() {
    this.stop();
    const ctx = this.getContext();
    if (!ctx) return;

    const playPulse = () => {
      if (!this.ctx || this.ctx.state === "closed") return;
      try {
        const now = this.ctx.currentTime;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.frequency.value = 440;
        osc2.frequency.value = 480;

        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.2);
        osc2.stop(now + 1.2);
      } catch {
        // ignore
      }
    };

    playPulse();
    this.intervalId = setInterval(playPulse, 3200);
  }

  playIncomingRingtone() {
    this.stop();
    const ctx = this.getContext();
    if (!ctx) return;

    const playChime = () => {
      if (!this.ctx || this.ctx.state === "closed") return;
      try {
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          if (!this.ctx) return;
          const now = this.ctx.currentTime + idx * 0.14;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = "sine";
          osc.frequency.value = freq;

          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now);
          osc.stop(now + 0.35);
        });
      } catch {
        // ignore
      }
    };

    playChime();
    this.intervalId = setInterval(playChime, 2400);
  }

  playEndTone() {
    this.stop();
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.25);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // ignore
    }
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.activeOscs.forEach((o) => {
      try {
        o.stop();
        o.disconnect();
      } catch {
        // ignore
      }
    });
    this.activeOscs = [];
  }
}

const tonePlayer = new CallTonePlayer();

// ---------------------------------------------------------------------------
// STUN & TURN ICE Servers Config
// ---------------------------------------------------------------------------

function getIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [
    { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
  ];

  const turnUrl = process.env.NEXT_PUBLIC_TURN_URL;
  if (turnUrl) {
    const urls = turnUrl.split(",").map((u) => u.trim());
    servers.push({
      urls,
      username: process.env.NEXT_PUBLIC_TURN_USERNAME || undefined,
      credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL || undefined,
    });
  }

  return servers;
}

// ---------------------------------------------------------------------------
// Call Provider
// ---------------------------------------------------------------------------

export function CallProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { sendWsFrame, registerCallSignalHandler } = useChat();

  const [callState, setCallState] = useState<CallState>("IDLE");
  const [callType, setCallType] = useState<CallType>("voice");
  const [activePeer, setActivePeer] = useState<CallParticipant | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isCameraOff, setIsCameraOff] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [callDuration, setCallDuration] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const currentCallIdRef = useRef<string | null>(null);
  const pendingRemoteCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const pendingIncomingOfferRef = useRef<{ sdp: RTCSessionDescriptionInit; peer: CallParticipant; type: CallType } | null>(null);
  const ringTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Keep localStreamRef synchronized
  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  // Cleanup helper
  const cleanUpCallResources = useCallback(() => {
    tonePlayer.stop();

    if (ringTimeoutRef.current) {
      clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = null;
    }
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
      localStreamRef.current = null;
    }

    if (pcRef.current) {
      pcRef.current.ontrack = null;
      pcRef.current.onicecandidate = null;
      pcRef.current.oniceconnectionstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
    }

    setRemoteStream(null);
    currentCallIdRef.current = null;
    pendingRemoteCandidatesRef.current = [];
    pendingIncomingOfferRef.current = null;
    setIsMuted(false);
    setIsCameraOff(false);
  }, []);

  // Format call duration MM:SS or HH:MM:SS
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remMins = mins % 60;
      return `${hrs.toString().padStart(2, "0")}:${remMins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Call duration counter
  useEffect(() => {
    if (callState === "CONNECTED") {
      setCallDuration(0);
      durationTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
    }
    return () => {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
    };
  }, [callState]);

  // Acquire local audio / video media
  const acquireMedia = useCallback(
    async (type: CallType, cameraFacing: "user" | "environment" = "user"): Promise<MediaStream> => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Your browser does not support audio/video calling.");
      }

      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video:
          type === "video"
            ? {
                facingMode: { ideal: cameraFacing },
                width: { ideal: 1280 },
                height: { ideal: 720 },
              }
            : false,
      };

      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        setLocalStream(stream);
        return stream;
      } catch (err: unknown) {
        const errName = (err as Error)?.name || "";
        if (errName === "NotAllowedError" || errName === "PermissionDeniedError") {
          throw new Error("Microphone or camera permission was denied. Please allow access in browser settings.");
        } else if (errName === "NotFoundError" || errName === "DevicesNotFoundError") {
          throw new Error("No camera or microphone was found on this device.");
        } else if (errName === "NotReadableError" || errName === "TrackStartError") {
          throw new Error("Microphone or camera is currently in use by another application.");
        }
        throw new Error((err as Error)?.message || "Failed to access microphone or camera.");
      }
    },
    []
  );

  // Initialize RTCPeerConnection
  const createPeerConnection = useCallback(
    (callId: string, peerId: string): RTCPeerConnection => {
      const pc = new RTCPeerConnection({ iceServers: getIceServers() });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendWsFrame({
            type: "call_signal",
            signal_type: "ice_candidate",
            call_id: callId,
            to_user_id: peerId,
            candidate: event.candidate.toJSON(),
          });
        }
      };

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        } else {
          const newStream = new MediaStream();
          newStream.addTrack(event.track);
          setRemoteStream(newStream);
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (!pc) return;
        const state = pc.iceConnectionState;
        if (state === "connected" || state === "completed") {
          setCallState("CONNECTED");
          tonePlayer.stop();
        } else if (state === "disconnected") {
          setCallState("RECONNECTING");
        } else if (state === "failed") {
          setCallState("FAILED");
          setErrorMessage("Connection lost. Direct P2P could not be established.");
          cleanUpCallResources();
          setTimeout(() => setCallState("IDLE"), 3000);
        }
      };

      pcRef.current = pc;
      return pc;
    },
    [sendWsFrame, cleanUpCallResources]
  );

  // 1. Start an outgoing call
  const startCall = useCallback(
    async (peer: CallParticipant, type: CallType) => {
      if (callState !== "IDLE" || !user?.id) return;

      const callId = `call_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      currentCallIdRef.current = callId;
      setActivePeer(peer);
      setCallType(type);
      setCallState("CALLING");
      setErrorMessage(null);

      try {
        const stream = await acquireMedia(type, "user");
        const pc = createPeerConnection(callId, peer.id);

        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: type === "video",
        });
        await pc.setLocalDescription(offer);

        const sent = sendWsFrame({
          type: "call_signal",
          signal_type: "invite",
          call_id: callId,
          to_user_id: peer.id,
          call_type: type,
          sdp: offer,
        });

        if (!sent) {
          throw new Error("Unable to reach message relay. Please check your internet connection.");
        }

        tonePlayer.playOutgoingRingtone();

        // 45s Ringing Timeout
        ringTimeoutRef.current = setTimeout(() => {
          sendWsFrame({
            type: "call_signal",
            signal_type: "end",
            call_id: callId,
            to_user_id: peer.id,
            reason: "timeout",
          });
          cleanUpCallResources();
          setCallState("DECLINED");
          setErrorMessage("No answer");
          setTimeout(() => setCallState("IDLE"), 2500);
        }, 45000);
      } catch (err) {
        cleanUpCallResources();
        setCallState("FAILED");
        setErrorMessage((err as Error)?.message || "Could not start call.");
        setTimeout(() => setCallState("IDLE"), 3000);
      }
    },
    [callState, user?.id, acquireMedia, createPeerConnection, sendWsFrame, cleanUpCallResources]
  );

  // 2. Accept an incoming call
  const acceptCall = useCallback(async () => {
    const offerData = pendingIncomingOfferRef.current;
    if (!offerData || !currentCallIdRef.current || !activePeer) return;

    tonePlayer.stop();
    if (ringTimeoutRef.current) {
      clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = null;
    }

    setCallState("CONNECTING");

    try {
      const stream = await acquireMedia(offerData.type, facingMode);
      const pc = createPeerConnection(currentCallIdRef.current, activePeer.id);

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(offerData.sdp));

      // Flush any queued ICE candidates
      while (pendingRemoteCandidatesRef.current.length > 0) {
        const cand = pendingRemoteCandidatesRef.current.shift();
        if (cand) await pc.addIceCandidate(new RTCIceCandidate(cand));
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      sendWsFrame({
        type: "call_signal",
        signal_type: "accept",
        call_id: currentCallIdRef.current,
        to_user_id: activePeer.id,
        call_type: offerData.type,
        sdp: answer,
      });
    } catch (err) {
      cleanUpCallResources();
      setCallState("FAILED");
      setErrorMessage((err as Error)?.message || "Failed to answer call.");
      setTimeout(() => setCallState("IDLE"), 3000);
    }
  }, [acquireMedia, facingMode, createPeerConnection, activePeer, sendWsFrame, cleanUpCallResources]);

  // 3. Decline an incoming call
  const declineCall = useCallback(() => {
    if (currentCallIdRef.current && activePeer) {
      sendWsFrame({
        type: "call_signal",
        signal_type: "decline",
        call_id: currentCallIdRef.current,
        to_user_id: activePeer.id,
        reason: "declined",
      });
    }
    tonePlayer.playEndTone();
    cleanUpCallResources();
    setCallState("DECLINED");
    setTimeout(() => setCallState("IDLE"), 1500);
  }, [activePeer, sendWsFrame, cleanUpCallResources]);

  // 4. Hang up / End active call
  const endCall = useCallback(() => {
    if (currentCallIdRef.current && activePeer) {
      sendWsFrame({
        type: "call_signal",
        signal_type: "end",
        call_id: currentCallIdRef.current,
        to_user_id: activePeer.id,
        reason: "hung_up",
      });
    }
    tonePlayer.playEndTone();
    cleanUpCallResources();
    setCallState("ENDED");
    setTimeout(() => setCallState("IDLE"), 1500);
  }, [activePeer, sendWsFrame, cleanUpCallResources]);

  // 5. Mute/Unmute microphone
  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  }, []);

  // 6. Camera On/Off
  const toggleCamera = useCallback(() => {
    if (!localStreamRef.current) return;
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsCameraOff(!videoTrack.enabled);
    }
  }, []);

  // 7. Switch Camera (front/back on mobile)
  const switchCamera = useCallback(async () => {
    if (callType !== "video" || !localStreamRef.current || !pcRef.current) return;
    const nextFacing = facingMode === "user" ? "environment" : "user";

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: nextFacing } },
        audio: false,
      });
      const newVideoTrack = newStream.getVideoTracks()[0];
      const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];

      if (newVideoTrack && oldVideoTrack) {
        const sender = pcRef.current.getSenders().find((s) => s.track && s.track.kind === "video");
        if (sender) {
          await sender.replaceTrack(newVideoTrack);
        }
        localStreamRef.current.removeTrack(oldVideoTrack);
        oldVideoTrack.stop();
        localStreamRef.current.addTrack(newVideoTrack);
        setFacingMode(nextFacing);
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
      }
    } catch (err) {
      console.warn("Could not switch camera facing mode:", err);
    }
  }, [callType, facingMode]);

  // Listen for incoming call signals over WebSocket
  useEffect(() => {
    const unregister = registerCallSignalHandler(async (signal: {
      signal_type: string;
      call_id: string;
      from_user_id: string;
      caller_name?: string;
      caller_avatar?: string;
      call_type?: CallType;
      sdp?: RTCSessionDescriptionInit;
      candidate?: RTCIceCandidateInit;
      reason?: string;
    }) => {
      const { signal_type, call_id, from_user_id, caller_name, caller_avatar, call_type: sigCallType, sdp, candidate, reason } = signal;

      switch (signal_type) {
        case "invite": {
          // If already in a call, notify peer with busy
          if (callState !== "IDLE") {
            sendWsFrame({
              type: "call_signal",
              signal_type: "busy",
              call_id,
              to_user_id: from_user_id,
              reason: "in_another_call",
            });
            return;
          }

          currentCallIdRef.current = call_id;
          const peer: CallParticipant = {
            id: from_user_id,
            displayName: caller_name || "User",
            avatarUrl: caller_avatar,
          };
          setActivePeer(peer);
          setCallType(sigCallType || "voice");
          setCallState("RINGING");
          setErrorMessage(null);

          if (sdp) {
            pendingIncomingOfferRef.current = {
              sdp,
              peer,
              type: sigCallType || "voice",
            };
          }

          tonePlayer.playIncomingRingtone();

          // 45s Ringing timeout
          ringTimeoutRef.current = setTimeout(() => {
            tonePlayer.stop();
            cleanUpCallResources();
            setCallState("DECLINED");
            setTimeout(() => setCallState("IDLE"), 2000);
          }, 45000);
          break;
        }

        case "accept": {
          if (call_id !== currentCallIdRef.current || !pcRef.current) return;
          tonePlayer.stop();
          if (ringTimeoutRef.current) {
            clearTimeout(ringTimeoutRef.current);
            ringTimeoutRef.current = null;
          }

          setCallState("CONNECTING");

          if (sdp) {
            try {
              await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
              while (pendingRemoteCandidatesRef.current.length > 0) {
                const cand = pendingRemoteCandidatesRef.current.shift();
                if (cand) await pcRef.current.addIceCandidate(new RTCIceCandidate(cand));
              }
            } catch (sdpErr) {
              console.error("Failed to set remote answer SDP:", sdpErr);
            }
          }
          break;
        }

        case "ice_candidate": {
          if (call_id !== currentCallIdRef.current || !candidate) return;
          if (pcRef.current && pcRef.current.remoteDescription) {
            try {
              await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (candErr) {
              console.warn("Failed to add remote ICE candidate:", candErr);
            }
          } else {
            pendingRemoteCandidatesRef.current.push(candidate);
          }
          break;
        }

        case "decline": {
          if (call_id !== currentCallIdRef.current) return;
          tonePlayer.playEndTone();
          cleanUpCallResources();
          setCallState("DECLINED");
          setErrorMessage(reason === "busy" ? "User is busy" : "Call declined");
          setTimeout(() => setCallState("IDLE"), 2500);
          break;
        }

        case "busy": {
          if (call_id !== currentCallIdRef.current) return;
          tonePlayer.playEndTone();
          cleanUpCallResources();
          setCallState("BUSY");
          setErrorMessage("User is currently on another call");
          setTimeout(() => setCallState("IDLE"), 2500);
          break;
        }

        case "unavailable": {
          if (call_id !== currentCallIdRef.current) return;
          tonePlayer.playEndTone();
          cleanUpCallResources();
          setCallState("FAILED");
          setErrorMessage("User is currently offline");
          setTimeout(() => setCallState("IDLE"), 2500);
          break;
        }

        case "end": {
          if (call_id !== currentCallIdRef.current) return;
          tonePlayer.playEndTone();
          cleanUpCallResources();
          setCallState("ENDED");
          setTimeout(() => setCallState("IDLE"), 1500);
          break;
        }

        default:
          break;
      }
    });

    return () => unregister();
  }, [registerCallSignalHandler, callState, sendWsFrame, cleanUpCallResources]);

  return (
    <CallContext.Provider
      value={{
        callState,
        callType,
        activePeer,
        localStream,
        remoteStream,
        isMuted,
        isCameraOff,
        facingMode,
        callDuration,
        formattedDuration: formatDuration(callDuration),
        errorMessage,
        startCall,
        acceptCall,
        declineCall,
        endCall,
        toggleMute,
        toggleCamera,
        switchCamera,
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error("useCall must be used within a CallProvider");
  }
  return context;
}
