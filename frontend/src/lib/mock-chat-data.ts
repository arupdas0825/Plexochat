/**
 * Chat System Domain Types & Initial Empty Collections
 * Real production data structures for 1-to-1 encrypted multilingual conversations.
 */

export interface ChatUser {
  id: string;
  username: string;
  displayName: string;
  plexoChatId: string;
  avatarBg: string;
  preferredLanguage: string;
  languageCode?: string;
  online: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string; // 'me' or user id
  senderName: string;
  originalText: string;
  translatedText: string;
  originalLang: string;
  targetLangCode: string;
  timestamp: string;
  status: "sent" | "delivered" | "read";
  isPhoto?: boolean;
  photoUrl?: string;
}

export interface ChatThread {
  id: string;
  participant: ChatUser;
  lastMessage: ChatMessage;
  unreadCount: number;
  messages: ChatMessage[];
}

export interface ConnectionRequest {
  id: string;
  sender: ChatUser;
  timestamp: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "BLOCKED";
}

// Production initial state: Genuinely empty for real users
export const INITIAL_THREADS: ChatThread[] = [];
export const INITIAL_REQUESTS: ConnectionRequest[] = [];
