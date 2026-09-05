"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  DiscoverableUser,
  StoredConnectionRequest,
  ConnectedFriend,
} from "./explore-calendar-data";
import { useAuth } from "./auth-context";

interface ConnectionsContextType {
  exploreUsers: DiscoverableUser[];
  requests: StoredConnectionRequest[];
  connections: ConnectedFriend[];
  pendingIncomingCount: number;
  sendConnectionRequest: (user: DiscoverableUser, note?: string) => boolean;
  acceptConnectionRequest: (requestId: string) => void;
  declineConnectionRequest: (requestId: string) => void;
  cancelConnectionRequest: (requestId: string) => void;
  blockConnectionUser: (requestId: string) => void;
  hasSentRequestTo: (userId: string) => boolean;
  isConnectedWith: (userId: string) => boolean;
}

const ConnectionsContext = createContext<ConnectionsContextType | undefined>(undefined);

export function ConnectionsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [exploreUsers, setExploreUsers] = useState<DiscoverableUser[]>([]);
  const [requests, setRequests] = useState<StoredConnectionRequest[]>([]);
  const [connections, setConnections] = useState<ConnectedFriend[]>([]);

  // Load real registered users (excluding current user) who are discoverable
  useEffect(() => {
    try {
      const storedUsersRaw = localStorage.getItem("plexochat_registered_users");
      if (storedUsersRaw) {
        const parsedUsers = JSON.parse(storedUsersRaw);
        // Exclude current authenticated user
        const otherUsers = parsedUsers
          .filter((u: any) => u.username !== user?.username && u.id !== user?.id && u.isDiscoverable !== false)
          .map((u: any): DiscoverableUser => {
            // Coordinate mapping based on approximate city or country
            return {
              id: u.id,
              username: u.username,
              displayName: u.displayName,
              avatarBg: u.avatarBg || "from-blue-600 to-indigo-600",
              city: u.city || "",
              country: u.country || "",
              countryFlag: u.countryFlag || "🌐",
              mapCoords: u.mapCoords || { x: 50, y: 50 },
              languagesSpoken: u.languagesSpoken || [u.preferredLanguageName || "English"],
              languagesLearning: u.languagesLearning || [],
              interests: u.interests || [],
              bio: u.bio || "",
              online: true,
              isStrongMatch: false,
              matchScore: 85,
            };
          });
        setExploreUsers(otherUsers);
      } else {
        setExploreUsers([]);
      }
    } catch (e) {
      console.error("Failed to load registered users", e);
      setExploreUsers([]);
    }
  }, [user]);

  // Load user-specific connection requests and friends
  useEffect(() => {
    if (!user) {
      setRequests([]);
      setConnections([]);
      return;
    }

    try {
      const storedReqs = localStorage.getItem(`plexochat_reqs_${user.id}`);
      if (storedReqs) {
        setRequests(JSON.parse(storedReqs));
      } else {
        setRequests([]);
      }

      const storedConns = localStorage.getItem(`plexochat_conns_${user.id}`);
      if (storedConns) {
        setConnections(JSON.parse(storedConns));
      } else {
        setConnections([]);
      }
    } catch (e) {
      console.error("Failed to load user connections", e);
      setRequests([]);
      setConnections([]);
    }
  }, [user]);

  const saveRequests = (newReqs: StoredConnectionRequest[]) => {
    setRequests(newReqs);
    if (user) {
      try {
        localStorage.setItem(`plexochat_reqs_${user.id}`, JSON.stringify(newReqs));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const saveConnections = (newConns: ConnectedFriend[]) => {
    setConnections(newConns);
    if (user) {
      try {
        localStorage.setItem(`plexochat_conns_${user.id}`, JSON.stringify(newConns));
      } catch (e) {
        console.error(e);
      }
    }
  };

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

  const sendConnectionRequest = (targetUser: DiscoverableUser, note?: string) => {
    if (hasSentRequestTo(targetUser.id) || isConnectedWith(targetUser.id)) return false;

    const newReq: StoredConnectionRequest = {
      id: "req-out-" + Date.now(),
      type: "outgoing",
      userId: targetUser.id,
      displayName: targetUser.displayName,
      username: targetUser.username,
      avatarBg: targetUser.avatarBg,
      countryFlag: targetUser.countryFlag,
      city: targetUser.city,
      country: targetUser.country,
      languagesSpoken: targetUser.languagesSpoken,
      languagesLearning: targetUser.languagesLearning,
      note: note?.trim() || `Hi ${targetUser.displayName}, I would love to connect and exchange languages!`,
      sentAt: "Just now",
      status: "pending",
    };

    saveRequests([newReq, ...requests]);
    return true;
  };

  const acceptConnectionRequest = (requestId: string) => {
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;

    const newFriend: ConnectedFriend = {
      id: "conn-" + Date.now(),
      userId: req.userId,
      displayName: req.displayName,
      username: req.username,
      avatarBg: req.avatarBg,
      countryFlag: req.countryFlag,
      city: req.city,
      country: req.country,
      languagesSpoken: req.languagesSpoken,
      languagesLearning: req.languagesLearning,
      chatId: "chat-" + Date.now(),
      lastActive: "Active now",
      online: true,
    };

    saveConnections([newFriend, ...connections]);
    saveRequests(requests.filter((r) => r.id !== requestId));
  };

  const declineConnectionRequest = (requestId: string) => {
    saveRequests(requests.filter((r) => r.id !== requestId));
  };

  const cancelConnectionRequest = (requestId: string) => {
    saveRequests(requests.filter((r) => r.id !== requestId));
  };

  const blockConnectionUser = (requestId: string) => {
    saveRequests(requests.filter((r) => r.id !== requestId));
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
