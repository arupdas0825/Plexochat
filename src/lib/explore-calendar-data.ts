/**
 * Global Discoverable People, Map Clusters, Connections & Calendar Data Store
 * Clean production domain types and dynamic generators from real user sessions.
 */
import { ChatThread } from "./mock-chat-data";

export interface DiscoverableUser {
  id: string;
  username: string;
  displayName: string;
  avatarBg: string;
  city: string;
  country: string;
  countryFlag: string;
  mapCoords: { x: number; y: number };
  languagesSpoken: string[];
  languagesLearning: string[];
  interests: string[];
  bio: string;
  online: boolean;
  isStrongMatch: boolean;
  matchScore: number;
  matchReason?: string;
}

export interface MapCluster {
  id: string;
  cityName: string;
  countryName: string;
  flag: string;
  coords: { x: number; y: number };
  activeMembers: number;
  languages: string[];
}

export interface StoredConnectionRequest {
  id: string;
  type: "incoming" | "outgoing";
  userId: string;
  displayName: string;
  username: string;
  avatarBg: string;
  countryFlag: string;
  city: string;
  country: string;
  languagesSpoken: string[];
  languagesLearning: string[];
  note: string;
  sentAt: string;
  status: "pending" | "accepted" | "declined";
}

export interface ConnectedFriend {
  id: string;
  userId: string;
  displayName: string;
  username: string;
  avatarBg: string;
  countryFlag: string;
  city: string;
  country: string;
  languagesSpoken: string[];
  languagesLearning: string[];
  chatId: string;
  lastActive: string;
  online: boolean;
}

export interface CalendarDayActivity {
  dateStr: string; // YYYY-MM-DD
  dayNumber: number;
  messagesCount: number;
  photosCount: number;
  newConnection?: boolean;
  conversations: {
    chatId: string;
    partnerName: string;
    partnerAvatarBg: string;
    countryFlag: string;
    languagePair: string;
    messagesCount: number;
    photosCount: number;
    previewSnippet: string;
    photoSamples?: string[];
  }[];
}

// Genuinely empty production initial arrays
export const INITIAL_EXPLORE_USERS: DiscoverableUser[] = [];
export const MAP_CLUSTERS: MapCluster[] = [];
export const INITIAL_STORED_REQUESTS: StoredConnectionRequest[] = [];
export const INITIAL_CONNECTED_FRIENDS: ConnectedFriend[] = [];
export const MONTHLY_CALENDAR_DATA: Record<string, CalendarDayActivity> = {};

/**
 * Dynamically computes map clusters from real registered users with approximate location enabled.
 */
export function computeClustersFromUsers(users: DiscoverableUser[]): MapCluster[] {
  const cityMap = new Map<string, { userCount: number; user: DiscoverableUser; languages: Set<string> }>();

  for (const u of users) {
    if (!u.city) continue;
    const key = u.city.toLowerCase().trim();
    if (!cityMap.has(key)) {
      cityMap.set(key, {
        userCount: 1,
        user: u,
        languages: new Set(u.languagesSpoken),
      });
    } else {
      const entry = cityMap.get(key)!;
      entry.userCount += 1;
      u.languagesSpoken.forEach((l) => entry.languages.add(l));
    }
  }

  const clusters: MapCluster[] = [];
  for (const [key, val] of cityMap.entries()) {
    clusters.push({
      id: `cl-${key}`,
      cityName: val.user.city,
      countryName: val.user.country || "",
      flag: val.user.countryFlag || "🌐",
      coords: val.user.mapCoords || { x: 50, y: 50 },
      activeMembers: val.userCount,
      languages: Array.from(val.languages),
    });
  }

  return clusters;
}

/**
 * Dynamically computes monthly calendar activity from real conversation threads and messages.
 */
export function computeCalendarDataFromThreads(
  threads: ChatThread[]
): Record<string, CalendarDayActivity> {
  const activityMap: Record<string, CalendarDayActivity> = {};

  for (const thread of threads) {
    for (const msg of thread.messages) {
      // Extract ISO date YYYY-MM-DD from timestamp or fallback to today
      let dateKey = new Date().toISOString().split("T")[0];
      if (msg.timestamp) {
        const parsed = new Date(msg.timestamp);
        if (!isNaN(parsed.getTime())) {
          dateKey = parsed.toISOString().split("T")[0];
        }
      }

      const dayNum = parseInt(dateKey.split("-")[2], 10) || 1;

      if (!activityMap[dateKey]) {
        activityMap[dateKey] = {
          dateStr: dateKey,
          dayNumber: dayNum,
          messagesCount: 0,
          photosCount: 0,
          newConnection: false,
          conversations: [],
        };
      }

      const dayRecord = activityMap[dateKey];
      dayRecord.messagesCount += 1;
      if (msg.isPhoto) {
        dayRecord.photosCount += 1;
      }

      // Check if thread is already in conversations for that day
      let convEntry = dayRecord.conversations.find((c) => c.chatId === thread.id);
      if (!convEntry) {
        convEntry = {
          chatId: thread.id,
          partnerName: thread.participant.displayName,
          partnerAvatarBg: thread.participant.avatarBg,
          countryFlag: "🌐",
          languagePair: `Direct ↔ ${thread.participant.preferredLanguage || "English"}`,
          messagesCount: 1,
          photosCount: msg.isPhoto ? 1 : 0,
          previewSnippet: msg.translatedText || msg.originalText,
        };
        dayRecord.conversations.push(convEntry);
      } else {
        convEntry.messagesCount += 1;
        if (msg.isPhoto) convEntry.photosCount += 1;
        convEntry.previewSnippet = msg.translatedText || msg.originalText;
      }
    }
  }

  return activityMap;
}
