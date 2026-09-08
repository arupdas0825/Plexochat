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
  const [requests, setRequests] = useState<StoredConnectionRequest[]>([]);
  const [connections, setConnections] = useState<ConnectedFriend[]>([]);
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

  // Fetch real connections from MongoDB
  const fetchConnections = useCallback(async () => {
    if (!firebaseUser) return;
    try {
      const res = await authFetch("/connections");
      if (!res.ok) {
        console.warn("Failed to fetch connections:", res.status);
        return;
      }
      const data = await res.json();
      const mappedConns: ConnectedFriend[] = (data || []).map((c: any) => ({
        id: c.id,
        userId: c.peer_user_id,
        displayName: c.peer_profile?.display_name || "User",
        username: c.peer_profile?.username || "user",
        avatarBg: "from-blue-600 to-indigo-600",
        countryFlag: "🌐",
        city: "",
        country: "",
        languagesSpoken: [c.peer_profile?.preferred_receiving_language || "English"],
        languagesLearning: [],
        chatId: c.id,
        lastActive: "Connected",
        online: true,
      }));
      setConnections(mappedConns);
    } catch (err) {
      console.warn("Error fetching connections:", err);
    }
  }, [firebaseUser, authFetch]);

  // Fetch incoming and outgoing connection requests from MongoDB
  const fetchRequests = useCallback(async () => {
    if (!firebaseUser) return;
    try {
      const [inRes, outRes] = await Promise.all([
        authFetch("/connections/requests/incoming"),
        authFetch("/connections/requests/outgoing"),
      ]);

      const inData = inRes.ok ? await inRes.json() : [];
      const outData = outRes.ok ? await outRes.json() : [];

      const mappedIn: StoredConnectionRequest[] = inData.map((r: any) => ({
        id: r.id,
        type: "incoming",
        userId: r.sender_id,
        displayName: r.peer_profile?.display_name || "User",
        username: r.peer_profile?.username || "user",
        avatarBg: "from-blue-600 to-indigo-600",
        countryFlag: "🌐",
        city: "",
        country: "",
        languagesSpoken: [r.peer_profile?.preferred_receiving_language || "English"],
        languagesLearning: [],
        note: r.note || "Hi, I'd like to connect on PlexoChat!",
        sentAt: new Date(r.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        status: "pending",
      }));

      const mappedOut: StoredConnectionRequest[] = outData.map((r: any) => ({
        id: r.id,
        type: "outgoing",
        userId: r.receiver_id,
        displayName: r.peer_profile?.display_name || "User",
        username: r.peer_profile?.username || "user",
        avatarBg: "from-blue-600 to-indigo-600",
        countryFlag: "🌐",
        city: "",
        country: "",
        languagesSpoken: [r.peer_profile?.preferred_receiving_language || "English"],
        languagesLearning: [],
        note: r.note || "Connection request sent",
        sentAt: new Date(r.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        status: "pending",
      }));

      setRequests([...mappedIn, ...mappedOut]);
    } catch (err) {
      console.warn("Error fetching connection requests:", err);
    }
  }, [firebaseUser, authFetch]);

  const refreshConnections = useCallback(async () => {
    await Promise.all([fetchConnections(), fetchRequests()]);
  }, [fetchConnections, fetchRequests]);

  // Load initially when user / firebaseUser is ready
  useEffect(() => {
    if (firebaseUser) {
      refreshConnections();
    } else {
      setConnections([]);
      setRequests([]);
    }
  }, [firebaseUser, refreshConnections]);

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
