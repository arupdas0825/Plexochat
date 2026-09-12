"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  DiscoverableUser,
  StoredConnectionRequest,
  ConnectedFriend,
} from "./explore-calendar-data";
import { useAuth, getBackendUrl } from "./auth-context";

interface ConnectionsContextType {
  exploreUsers: DiscoverableUser[];
  requests: StoredConnectionRequest[];
  connections: ConnectedFriend[];
  pendingIncomingCount: number;
  sendConnectionRequest: (user: { id: string; displayName?: string }, note?: string) => Promise<boolean>;
  acceptConnectionRequest: (requestId: string) => Promise<void>;
  declineConnectionRequest: (requestId: string) => Promise<void>;
  cancelConnectionRequest: (requestId: string) => Promise<void>;
  blockConnectionUser: (targetId: string) => Promise<void>;
  hasSentRequestTo: (userId: string) => boolean;
  isConnectedWith: (userId: string) => boolean;
  refreshConnections: () => Promise<void>;
}

const ConnectionsContext = createContext<ConnectionsContextType | undefined>(undefined);

export function ConnectionsProvider({ children }: { children: React.ReactNode }) {
  const { user, firebaseUser } = useAuth();
  const [exploreUsers, setExploreUsers] = useState<DiscoverableUser[]>([]);
  const [requests, setRequests] = useState<StoredConnectionRequest[]>(() => {
    if (typeof window !== "undefined" && user?.id) {
      try {
        const cached = localStorage.getItem(`plexochat_reqs_${user.id}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {}
    }
    return [];
  });
  const [connections, setConnections] = useState<ConnectedFriend[]>(() => {
    if (typeof window !== "undefined" && user?.id) {
      try {
        const cached = localStorage.getItem(`plexochat_conns_${user.id}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {}
    }
    return [];
  });
  const backendUrl = getBackendUrl();

  const authFetch = useCallback(
    async (path: string, init?: RequestInit) => {
      if (!firebaseUser) throw new Error("Not authenticated");
      const token = await firebaseUser.getIdToken();
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...init?.headers,
      };
      return fetch(`${backendUrl}/api/v1${path}`, { ...init, headers });
    },
    [firebaseUser, backendUrl]
  );

  // Hydrate connections and requests from cache on mount / user change
  useEffect(() => {
    if (!user?.id) {
      return;
    }
    try {
      const cachedConns = localStorage.getItem(`plexochat_conns_${user.id}`);
      if (cachedConns) {
        const parsed = JSON.parse(cachedConns);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setConnections((prev) => (prev.length === 0 ? parsed : prev));
        }
      }
      const cachedReqs = localStorage.getItem(`plexochat_reqs_${user.id}`);
      if (cachedReqs) {
        const parsed = JSON.parse(cachedReqs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRequests((prev) => (prev.length === 0 ? parsed : prev));
        }
      }
    } catch {
      // ignore
    }
  }, [user?.id]);

  // Fetch real connections from MongoDB
  const fetchConnections = useCallback(async () => {
    if (!firebaseUser || !user?.id) return;
    try {
      const res = await authFetch("/connections");
      if (!res.ok) {
        console.warn("Failed to fetch connections:", res.status);
        return;
      }
      const data = await res.json();
      const mappedConns: ConnectedFriend[] = (data || []).map((c: Record<string, unknown>) => {
        const profile = (c.peer_profile || {}) as Record<string, string>;
        return {
          id: String(c.id || ""),
          userId: String(c.peer_user_id || ""),
          displayName: profile.display_name || "User",
          username: profile.username || "user",
          avatarBg: "from-blue-600 to-indigo-600",
          countryFlag: "🌐",
          city: "",
          country: "",
          languagesSpoken: [profile.preferred_receiving_language || "English"],
          languagesLearning: [],
          chatId: String(c.id || ""),
          lastActive: "Connected",
          online: true,
          preferredReceivingLanguage: profile.preferred_receiving_language || "en",
        };
      });
      setConnections(mappedConns);
      try {
        localStorage.setItem(`plexochat_conns_${user.id}`, JSON.stringify(mappedConns));
      } catch {
        // ignore
      }
    } catch (err) {
      console.warn("Error fetching connections:", err);
    }
  }, [firebaseUser, user?.id, authFetch]);

  // Fetch incoming and outgoing connection requests from MongoDB
  const fetchRequests = useCallback(async () => {
    if (!firebaseUser || !user?.id) return;
    try {
      const [inRes, outRes] = await Promise.all([
        authFetch("/connections/requests/incoming"),
        authFetch("/connections/requests/outgoing"),
      ]);

      const inData = inRes.ok ? await inRes.json() : [];
      const outData = outRes.ok ? await outRes.json() : [];

      const mappedIn: StoredConnectionRequest[] = inData.map((r: Record<string, unknown>) => {
        const profile = (r.peer_profile || {}) as Record<string, string>;
        return {
          id: String(r.id || ""),
          type: "incoming",
          userId: String(r.sender_id || ""),
          displayName: profile.display_name || "User",
          username: profile.username || "user",
          avatarBg: "from-blue-600 to-indigo-600",
          countryFlag: "🌐",
          city: "",
          country: "",
          languagesSpoken: [profile.preferred_receiving_language || "English"],
          languagesLearning: [],
          note: (r.note as string) || "Hi, I'd like to connect on PlexoChat!",
          sentAt: new Date(r.created_at as string).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          status: "pending",
        };
      });

      const mappedOut: StoredConnectionRequest[] = outData.map((r: Record<string, unknown>) => {
        const profile = (r.peer_profile || {}) as Record<string, string>;
        return {
          id: String(r.id || ""),
          type: "outgoing",
          userId: String(r.receiver_id || ""),
          displayName: profile.display_name || "User",
          username: profile.username || "user",
          avatarBg: "from-blue-600 to-indigo-600",
          countryFlag: "🌐",
          city: "",
          country: "",
          languagesSpoken: [profile.preferred_receiving_language || "English"],
          languagesLearning: [],
          note: (r.note as string) || "Connection request sent",
          sentAt: new Date(r.created_at as string).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          status: "pending",
        };
      });

      const allRequests = [...mappedIn, ...mappedOut];
      setRequests(allRequests);
      try {
        localStorage.setItem(`plexochat_reqs_${user.id}`, JSON.stringify(allRequests));
      } catch {
        // ignore
      }
    } catch (err) {
      console.warn("Error fetching connection requests:", err);
    }
  }, [firebaseUser, user?.id, authFetch]);

  const refreshConnections = useCallback(async () => {
    await Promise.all([fetchConnections(), fetchRequests()]);
  }, [fetchConnections, fetchRequests]);

  // Load in background when user / firebaseUser is ready
  useEffect(() => {
    let active = true;
    if (firebaseUser && user?.id) {
      void refreshConnections();
    } else if (!user && !firebaseUser) {
      if (active) {
        setConnections((prev) => (prev.length > 0 ? [] : prev));
        setRequests((prev) => (prev.length > 0 ? [] : prev));
      }
    }
    return () => {
      active = false;
    };
  }, [firebaseUser, user?.id, refreshConnections]);

  const pendingIncomingCount = requests.filter(
    (r) => r.type === "incoming" && r.status === "pending"
  ).length;

  const hasSentRequestTo = (userId: string) => {
    return requests.some(
      (r) => r.userId === userId && r.type === "outgoing" && r.status === "pending"
    );
  };

  const isConnectedWith = (userId: string) => {
    return connections.some((c) => c.userId === userId);
  };

  const sendConnectionRequest = async (
    targetUser: { id: string; displayName?: string },
    note?: string
  ): Promise<boolean> => {
    try {
      const res = await authFetch("/connections/requests", {
        method: "POST",
        body: JSON.stringify({
          target_user_id: targetUser.id,
          note: note?.trim() || undefined,
        }),
      });
      if (res.ok) {
        await fetchRequests();
        return true;
      } else {
        const err = await res.json().catch(() => ({}));
        console.warn("Connection request rejected:", err);
        return false;
      }
    } catch (e) {
      console.error("Failed to send connection request", e);
      return false;
    }
  };

  const acceptConnectionRequest = async (requestId: string) => {
    try {
      const res = await authFetch(`/connections/requests/${requestId}/accept`, {
        method: "POST",
      });
      if (res.ok) {
        await refreshConnections();
      }
    } catch (e) {
      console.error("Failed to accept connection request", e);
    }
  };

  const declineConnectionRequest = async (requestId: string) => {
    try {
      const res = await authFetch(`/connections/requests/${requestId}/decline`, {
        method: "POST",
      });
      if (res.ok) {
        await fetchRequests();
      }
    } catch (e) {
      console.error("Failed to decline connection request", e);
    }
  };

  const cancelConnectionRequest = async (requestId: string) => {
    // Decline or remove
    await declineConnectionRequest(requestId);
  };

  const blockConnectionUser = async (targetIdOrReqId: string) => {
    try {
      // If targetIdOrReqId is a request ID, find the target userId
      let targetUserId = targetIdOrReqId;
      const matchingReq = requests.find((r) => r.id === targetIdOrReqId);
      if (matchingReq) {
        targetUserId = matchingReq.userId;
      } else {
        const matchingConn = connections.find((c) => c.id === targetIdOrReqId);
        if (matchingConn) {
          targetUserId = matchingConn.userId;
        }
      }

      const res = await authFetch(`/connections/${targetUserId}/block`, {
        method: "POST",
      });
      if (res.ok) {
        await refreshConnections();
      }
    } catch (e) {
      console.error("Failed to block user", e);
    }
  };

  return (
    <ConnectionsContext.Provider
      value={{
        exploreUsers,
        requests,
        connections,
        pendingIncomingCount,
        sendConnectionRequest,
        acceptConnectionRequest,
        declineConnectionRequest,
        cancelConnectionRequest,
        blockConnectionUser,
        hasSentRequestTo,
        isConnectedWith,
        refreshConnections,
      }}
    >
      {children}
    </ConnectionsContext.Provider>
  );
}

export function useConnections() {
  const context = useContext(ConnectionsContext);
  if (!context) {
    throw new Error("useConnections must be used within ConnectionsProvider");
  }
  return context;
}
