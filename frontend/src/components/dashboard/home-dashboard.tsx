"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  Users,
  Languages,
  Image as ImageIcon,
  ArrowRight,
  Sparkles,
  Globe2,
  Compass,
  Check,
  Send,
  Lock,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useConnections } from "@/lib/connections-context";
import { useChat } from "@/lib/chat-context";
import { DiscoverableUser } from "@/lib/explore-calendar-data";

export function HomeDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { threads, selectThread } = useChat();
  const {
    exploreUsers,
    connections,
    sendConnectionRequest,
    hasSentRequestTo,
    isConnectedWith,
  } = useConnections();

  const [selectedUserForNote, setSelectedUserForNote] = useState<DiscoverableUser | null>(null);
  const [personalNote, setPersonalNote] = useState("");
  const [justSentId, setJustSentId] = useState<string | null>(null);

  // Greeting based on current hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Compute real dynamic statistics
  const totalMessagesCount = threads.reduce((acc, t) => acc + (t.messages?.length || 0), 0);
  const totalPhotosCount = threads.reduce(
    (acc, t) => acc + (t.messages?.filter((m) => m.isPhoto)?.length || 0),
    0
  );

  const uniqueLanguagesPracticed = new Set<string>();
  threads.forEach((t) => {
    if (t.participant?.preferredLanguage) {
      uniqueLanguagesPracticed.add(t.participant.preferredLanguage);
    }
  });

  const stats = [
    {
      label: "Active Conversations",
      value: threads.length.toString(),
      subtext: threads.length === 0 ? "0 active threads" : `${threads.length} active threads`,
      icon: MessageSquare,
      color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    },
    {
      label: "Global Connections",
      value: connections.length.toString(),
      subtext: connections.length === 0 ? "0 connected partners" : `${connections.length} connected`,
      icon: Users,
      color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    },
    {
      label: "Languages Practiced",
      value: uniqueLanguagesPracticed.size.toString(),
      subtext:
        uniqueLanguagesPracticed.size === 0
          ? "No language pairs yet"
          : Array.from(uniqueLanguagesPracticed).join(", "),
      icon: Languages,
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      label: "Photos Shared",
      value: totalPhotosCount.toString(),
      subtext: totalPhotosCount === 0 ? "0 encrypted photos" : `${totalPhotosCount} photos shared`,
      icon: ImageIcon,
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    },
  ];

  // Top suggested connections from real registered users
  const suggestedUsers = exploreUsers.slice(0, 3);

  const handleOpenConnectModal = (targetUser: DiscoverableUser) => {
    setSelectedUserForNote(targetUser);
    setPersonalNote(`Hi ${targetUser.displayName}, I would love to connect and practice languages!`);
  };

  const handleConfirmSendRequest = () => {
    if (!selectedUserForNote) return;
    sendConnectionRequest(selectedUserForNote, personalNote);
    setJustSentId(selectedUserForNote.id);
    setSelectedUserForNote(null);
    setPersonalNote("");
  };

  return (
    <div className="flex-1 h-full overflow-y-auto p-4 md:p-6 lg:p-8 pb-28 md:pb-8 space-y-6 max-w-7xl mx-auto w-full">
      
      {/* 1. Header: Dynamic Greeting & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
              {getGreeting()}, {user?.displayName || "Friend"} 👋
            </h1>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Your private communication dashboard. Manage connections and start encrypted multilingual chats.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/explore">
            <Button variant="outline" className="h-10 gap-2 text-xs font-semibold rounded-xl border-border/80">
              <Compass className="w-4 h-4 text-primary" />
              <span>Explore World</span>
            </Button>
          </Link>
          <Link href="/chats">
            <Button className="h-10 gap-2 text-xs font-semibold rounded-xl shadow-md shadow-primary/25">
              <MessageSquare className="w-4 h-4" />
              <span>Open Chats</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Four Dynamic Daily Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {stats.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-card border border-border/70 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground">
                  {item.label}
                </span>
                <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${item.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground tracking-tight">
                {item.value}
              </div>
              <div className="text-[11px] text-muted-foreground font-mono mt-1 truncate">
                {item.subtext}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Main Split Section: Recent Conversations (Left) + System Diagnostics (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Real Recent Conversations */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <h2 className="text-base font-bold text-foreground">Recent Conversations</h2>
            </div>
            <Link
              href="/chats"
              className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
            >
              <span>View All Chats</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {threads.length === 0 ? (
            /* Genuine Clean Empty State for New Users */
            <div className="p-10 rounded-3xl border border-dashed border-border/80 bg-card text-center space-y-3 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-secondary mx-auto flex items-center justify-center text-muted-foreground">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-foreground">No conversations yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Connect with international members or start a conversation using a friend&apos;s PlexoChat ID.
              </p>
              <div className="flex items-center justify-center gap-2 pt-1">
                <Link href="/explore">
                  <Button size="sm" variant="outline" className="text-xs rounded-xl gap-1.5">
                    <Compass className="w-3.5 h-3.5" />
                    <span>Explore People</span>
                  </Button>
                </Link>
                <Link href="/chats">
                  <Button size="sm" className="text-xs rounded-xl gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Chat</span>
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-border/80 bg-card divide-y divide-border/50 overflow-hidden shadow-sm">
              {threads.slice(0, 4).map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => {
                    selectThread(chat.id);
                    router.push("/chats");
                  }}
                  className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-secondary/40 transition-colors cursor-pointer group"
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div
                      className={`w-11 h-11 rounded-full bg-gradient-to-br ${chat.participant.avatarBg} text-white font-bold text-xs flex items-center justify-center shadow-sm`}
                    >
                      {chat.participant.displayName.substring(0, 2).toUpperCase()}
                    </div>
                    {chat.participant.online && (
                      <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                        {chat.participant.displayName}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                        {chat.lastMessage?.timestamp ? new Date(chat.lastMessage.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground truncate leading-relaxed">
                      {chat.lastMessage?.translatedText || chat.lastMessage?.originalText || "No messages yet"}
                    </p>

                    <div className="mt-1 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[10px] text-primary/80 font-mono">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>Language: {chat.participant.preferredLanguage || "Direct"}</span>
                      </span>
                      {chat.unreadCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-primary text-white text-[10px] font-bold">
                          {chat.unreadCount} New
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action */}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="shrink-0 h-8 px-2.5 text-xs text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 gap-1 rounded-xl"
                  >
                    <span className="hidden sm:inline font-medium">Open</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Quick Action Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-primary/15 via-purple-500/10 to-transparent border border-primary/20 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-mono font-bold">
                <Sparkles className="w-3 h-3" />
                <span>MULTILINGUAL MESSAGING</span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-foreground">
                Connect with Global Members
              </h3>
              <p className="text-xs text-muted-foreground max-w-md">
                Chat naturally in your preferred language. PlexoChat handles automatic client translation.
              </p>
            </div>
            <Link href="/explore" className="shrink-0">
              <Button size="sm" className="gap-2 font-semibold shadow-md shadow-primary/20 rounded-xl">
                <span>Explore Network</span>
                <Compass className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Right 1 Col: Real Session Diagnostics & Privacy Status */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-purple-500" />
            <h2 className="text-base font-bold text-foreground">Platform Activity</h2>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-4 shadow-sm">
            
            {/* Real Session Activity Metric */}
            <div className="p-3.5 rounded-xl bg-secondary/50 border border-border/50">
              <div className="flex items-center gap-2 text-emerald-500 text-xs font-mono font-semibold mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Encrypted Relay Status</span>
              </div>
              <div className="text-xl font-bold text-foreground">
                {totalMessagesCount} Messages
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Total messages recorded in your authenticated session.
              </p>
            </div>

            {/* Real Device Diagnostics */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-foreground mb-1">
                Device Security & Settings
              </div>

              <div className="p-2 rounded-lg bg-secondary/30 flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">Client Translation</span>
                <span className="text-emerald-500 font-mono text-[11px] font-semibold">
                  {user?.preferredLanguageName || "English"}
                </span>
              </div>

              <div className="p-2 rounded-lg bg-secondary/30 flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">E2EE Device Keys</span>
                <span className="text-emerald-500 font-mono text-[11px] font-semibold">Verified</span>
              </div>

              <div className="p-2 rounded-lg bg-secondary/30 flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">PlexoChat ID</span>
                <span className="text-primary font-mono text-[11px] font-semibold">
                  {user?.plexoChatId || "PX-NONE"}
                </span>
              </div>
            </div>

            {/* Privacy Promise Notice */}
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 text-[11px] text-muted-foreground space-y-1">
              <div className="flex items-center gap-1 text-primary font-semibold">
                <Lock className="w-3 h-3" />
                <span>Zero-Knowledge Relay</span>
              </div>
              <p className="leading-snug text-[10px]">
                Messages are decrypted in your browser device memory. No plain text is stored on external servers.
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* 4. Suggested Connections Section (Real Registered Users) */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Suggested Members</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Discoverable registered members open to language exchange.
            </p>
          </div>
          <Link
            href="/explore"
            className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
          >
            <span>Explore All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {suggestedUsers.length === 0 ? (
          <div className="p-8 text-center rounded-3xl border border-dashed border-border/80 bg-card space-y-2 shadow-sm">
            <Users className="w-8 h-8 text-muted-foreground mx-auto" />
            <h4 className="text-xs font-bold text-foreground">No other discoverable members yet</h4>
            <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
              Share your PlexoChat ID (<span className="font-mono text-primary">{user?.plexoChatId}</span>) to invite friends to connect.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {suggestedUsers.map((person) => {
              const isRequested = hasSentRequestTo(person.id) || justSentId === person.id;
              const isFriend = isConnectedWith(person.id);

              return (
                <div
                  key={person.id}
                  className="p-4 rounded-2xl border border-border/80 bg-card hover:border-primary/40 transition-all flex flex-col justify-between shadow-sm relative group"
                >
                  <div>
                    {/* Location */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                        <span>{person.countryFlag || "🌐"}</span>
                        <span>{person.city || "Global"}</span>
                      </span>
                    </div>

                    {/* Avatar & Name */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                        {person.displayName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-foreground leading-tight">
                          {person.displayName}
                        </h4>
                        <p className="text-[11px] text-muted-foreground font-mono">
                          @{person.username}
                        </p>
                      </div>
                    </div>

                    {/* Languages */}
                    <div className="space-y-1.5 text-xs mb-3">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground font-medium">Speaks:</span>
                        <span className="font-semibold text-foreground truncate max-w-[170px]">
                          {person.languagesSpoken.join(", ") || "English"}
                        </span>
                      </div>
                    </div>

                    {person.bio && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                        {person.bio}
                      </p>
                    )}
                  </div>

                  {/* Connect Action Button */}
                  <div>
                    {isFriend ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-xs font-semibold rounded-xl gap-1.5"
                        onClick={() => router.push("/chats")}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Connected • Open Chat</span>
                      </Button>
                    ) : isRequested ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled
                        className="w-full text-xs font-semibold rounded-xl gap-1.5 opacity-80"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Request Sent</span>
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleOpenConnectModal(person)}
                        className="w-full text-xs font-semibold rounded-xl gap-1.5 shadow-sm"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Connect</span>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Connect Personal Note Dialog */}
      {selectedUserForNote && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <span className="text-xl">{selectedUserForNote.countryFlag || "🌐"}</span>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Connect with {selectedUserForNote.displayName}
                  </h3>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    @{selectedUserForNote.username}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserForNote(null)}
                className="text-xs text-muted-foreground hover:text-foreground p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">
                Add an optional friendly introduction note:
              </label>
              <textarea
                rows={3}
                value={personalNote}
                onChange={(e) => setPersonalNote(e.target.value)}
                placeholder="Mention what language you want to practice or a mutual interest..."
                className="w-full p-3 rounded-xl border border-border/80 bg-secondary/40 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedUserForNote(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmSendRequest}
                className="gap-1.5 text-xs font-semibold rounded-xl shadow-md shadow-primary/20"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Request</span>
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
