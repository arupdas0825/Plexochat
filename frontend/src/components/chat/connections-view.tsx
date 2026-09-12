"use client";

/**
 * Screen: Contacts & Connection Requests View
 * Mobile Polish + WhatsApp/Messenger-grade contact management
 * 
 * Features:
 * - Direct integration with ConnectionsContext & ChatContext
 * - Mobile header with back button to Chats
 * - Tabs: My Contacts, Pending Requests, Sent Invites
 * - Accept / Decline / Block / Cancel actions with instant feedback
 * - Tap contact to start or open encrypted chat immediately
 * - Discover new language partners button linking to /explore
 */
import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  UserCheck,
  UserPlus,
  UserX,
  ArrowLeft,
  MessageSquare,
  Compass,
  Clock,
  Ban,
  ShieldCheck,
  Send,
  ChevronRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useConnections } from "@/lib/connections-context";
import { useChat } from "@/lib/chat-context";
import { ConnectionRequest, ChatThread, ChatUser } from "@/lib/mock-chat-data";

interface ConnectionsViewProps {
  requests?: ConnectionRequest[];
  onAcceptRequest?: (reqId: string) => void;
  onDeclineRequest?: (reqId: string) => void;
  onBlockUser?: (reqId: string) => void;
  activeThreads?: ChatThread[];
  onSelectChat?: (threadId: string) => void;
  onBack?: () => void;
}

export function ConnectionsView({
  onSelectChat,
  onBack,
}: ConnectionsViewProps) {
  const {
    requests,
    connections,
    acceptConnectionRequest,
    declineConnectionRequest,
    cancelConnectionRequest,
    blockConnectionUser,
  } = useConnections();

  const { threads, selectThread, startChatWithUser } = useChat();
  const [activeTab, setActiveTab] = useState<"contacts" | "incoming" | "outgoing">("contacts");

  const incomingRequests = requests.filter(
    (r) => r.type === "incoming" && r.status === "pending"
  );
  const outgoingRequests = requests.filter(
    (r) => r.type === "outgoing" && r.status === "pending"
  );

  // Handle tapping a contact to open or start a chat
  const handleOpenChat = (friend: {
    userId: string;
    displayName: string;
    username: string;
    avatarBg: string;
    languagesSpoken?: string[];
    countryFlag?: string;
  }) => {
    // Check if an existing thread has this participant
    const existingThread = threads.find(
      (t) => t.participant.id === friend.userId || t.participant.username === friend.username
    );

    if (existingThread) {
      if (onSelectChat) {
        onSelectChat(existingThread.id);
      } else {
        selectThread(existingThread.id);
      }
    } else {
      // Create new thread via ChatContext
      const primaryLang = friend.languagesSpoken?.[0] || "English";
      const chatUser: ChatUser = {
        id: friend.userId,
        username: friend.username,
        displayName: friend.displayName,
        plexoChatId: `@${friend.username}`,
        avatarBg: friend.avatarBg || "from-blue-600 to-indigo-600",
        preferredLanguage: primaryLang,
        languageCode: primaryLang.substring(0, 2).toUpperCase(),
        online: true,
      };
      const newThreadId = startChatWithUser(chatUser, "Hi! Connected on PlexoChat.");
      if (onSelectChat) {
        onSelectChat(newThreadId);
      } else {
        selectThread(newThreadId);
      }
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto momentum-scroll p-4 sm:p-6 lg:p-8 space-y-6 bg-background pb-[max(2rem,env(safe-area-inset-bottom))]">
      
      {/* 1. Header with Mobile Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/70">
        <div className="flex items-center gap-2.5">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="md:hidden p-2 -ml-2 rounded-xl text-muted-foreground hover:text-foreground active:bg-secondary touch-manipulation transition-colors"
              aria-label="Back to chats"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Contacts &amp; Requests
              </h2>
              {incomingRequests.length > 0 && (
                <Badge variant="secondary" className="text-[10px] py-0 px-2 font-mono font-semibold">
                  {incomingRequests.length} new
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Only verified connections can message you with end-to-end encryption.
            </p>
          </div>
        </div>

        <Link href="/explore" className="self-start sm:self-auto">
          <Button
            size="sm"
            className="h-8 sm:h-9 px-3.5 gap-1.5 text-xs font-semibold rounded-xl shadow-sm active:scale-95 touch-manipulation"
          >
            <Compass className="w-4 h-4" />
            <span>Discover Partners</span>
          </Button>
        </Link>
      </div>

      {/* 2. Sub-Navigation Tabs */}
      <div className="flex rounded-2xl bg-secondary/60 p-1 border border-border/70 text-xs font-medium max-w-md gap-1">
        <button
          type="button"
          onClick={() => setActiveTab("contacts")}
          className={`flex-1 py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 touch-manipulation ${
            activeTab === "contacts"
              ? "bg-card text-foreground font-semibold shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Contacts</span>
          <span className="px-1.5 py-0.2 rounded-full bg-secondary text-muted-foreground text-[10px] font-mono">
            {connections.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("incoming")}
          className={`flex-1 py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 touch-manipulation relative ${
            activeTab === "incoming"
              ? "bg-card text-foreground font-semibold shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Incoming</span>
          {incomingRequests.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-primary text-primary-foreground text-[10px] font-bold font-mono">
              {incomingRequests.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("outgoing")}
          className={`flex-1 py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 touch-manipulation ${
            activeTab === "outgoing"
              ? "bg-card text-foreground font-semibold shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Sent</span>
          <span className="px-1.5 py-0.2 rounded-full bg-secondary text-muted-foreground text-[10px] font-mono">
            {outgoingRequests.length}
          </span>
        </button>
      </div>

      {/* 3. Tab Content */}
      <div className="max-w-2xl space-y-3">
        {/* Tab A: My Contacts */}
        {activeTab === "contacts" && (
          <div>
            {connections.length === 0 ? (
              <div className="p-8 rounded-3xl bg-secondary/30 border border-border/60 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-secondary mx-auto flex items-center justify-center text-muted-foreground">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-foreground">No contacts yet</h4>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    Explore language partners around the world or search for friends to connect.
                  </p>
                </div>
                <Link href="/explore">
                  <Button size="sm" className="mt-2 text-xs gap-1.5">
                    <Compass className="w-3.5 h-3.5" />
                    <span>Find People on World Map</span>
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {connections.map((friend) => (
                  <div
                    key={friend.userId}
                    onClick={() => handleOpenChat(friend)}
                    className="p-3.5 rounded-2xl bg-card border border-border/80 hover:border-primary/40 hover:bg-secondary/40 active:scale-[0.99] transition-all flex items-center justify-between cursor-pointer group shadow-xs touch-manipulation"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-full bg-gradient-to-br ${friend.avatarBg} text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs`}
                      >
                        {friend.displayName.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-foreground truncate">
                          {friend.displayName}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono truncate">
                          @{friend.username} • Speaks {friend.languagesSpoken?.[0] || "English"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 px-3 rounded-xl text-xs font-semibold gap-1 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat</span>
                      </Button>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab B: Incoming Pending Requests */}
        {activeTab === "incoming" && (
          <div>
            {incomingRequests.length === 0 ? (
              <div className="p-8 rounded-3xl bg-secondary/30 border border-border/60 text-center text-xs text-muted-foreground space-y-1">
                <UserCheck className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <p className="font-semibold text-foreground">No pending requests</p>
                <p>When someone wants to message you, their invitation will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {incomingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl bg-card border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-full bg-gradient-to-br ${req.avatarBg} text-white font-bold text-sm flex items-center justify-center shrink-0`}
                      >
                        {req.displayName.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-foreground truncate">
                          {req.displayName}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono truncate">
                          @{req.username}
                        </div>
                        <div className="text-[11px] text-primary/80 mt-0.5 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 shrink-0" />
                          <span>Sent {req.sentAt}</span>
                        </div>
                        {req.note && (
                          <p className="text-xs text-muted-foreground mt-1 bg-secondary/50 p-2 rounded-xl border border-border/40">
                            &quot;{req.note}&quot;
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions: Accept, Decline, Block */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <Button
                        size="sm"
                        onClick={() => acceptConnectionRequest(req.id)}
                        className="h-8 px-3.5 text-xs font-semibold gap-1.5 shadow-sm active:scale-95 touch-manipulation"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Accept</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => declineConnectionRequest(req.id)}
                        className="h-8 px-3 text-xs active:scale-95 touch-manipulation"
                      >
                        <UserX className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Decline</span>
                      </Button>
                      <button
                        type="button"
                        onClick={() => blockConnectionUser(req.id)}
                        className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 active:scale-95 touch-manipulation transition-colors"
                        title="Block user"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab C: Outgoing Sent Invites */}
        {activeTab === "outgoing" && (
          <div>
            {outgoingRequests.length === 0 ? (
              <div className="p-8 rounded-3xl bg-secondary/30 border border-border/60 text-center text-xs text-muted-foreground space-y-1">
                <Send className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <p className="font-semibold text-foreground">No sent requests pending</p>
                <p>Invitations you send to other users will show here until accepted.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {outgoingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl bg-card border border-border shadow-xs flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-full bg-gradient-to-br ${req.avatarBg} text-white font-bold text-xs flex items-center justify-center shrink-0`}
                      >
                        {req.displayName.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-xs sm:text-sm text-foreground truncate">
                          {req.displayName}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono truncate">
                          @{req.username} • Sent {req.sentAt}
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => cancelConnectionRequest(req.id)}
                      className="h-8 px-3 text-xs text-muted-foreground hover:text-destructive active:scale-95 touch-manipulation shrink-0"
                    >
                      <X className="w-3.5 h-3.5 mr-1" />
                      <span>Cancel</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Trust Notice */}
      <div className="max-w-2xl p-3.5 rounded-2xl bg-secondary/30 border border-border/50 text-xs text-muted-foreground flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-muted-foreground shrink-0" />
        <span>PlexoChat zero-spam guarantee: only mutually accepted contacts can transmit encrypted messages.</span>
      </div>

    </div>
  );
}
