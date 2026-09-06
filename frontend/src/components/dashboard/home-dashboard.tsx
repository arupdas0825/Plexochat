"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  Users,
  Languages,
  Image as ImageIcon,
  ArrowRight,
  Sparkles,
  Compass,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useConnections } from "@/lib/connections-context";
import { useChat } from "@/lib/chat-context";

export function HomeDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { threads, selectThread } = useChat();
  const { connections } = useConnections();

  // Greeting based on current hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Compute real dynamic statistics
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

  return (
    <div className="flex-1 h-full overflow-y-auto no-scrollbar p-4 md:p-6 lg:p-8 pb-28 md:pb-8 space-y-6 max-w-7xl mx-auto w-full">
      
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

      {/* 3. Recent Conversations */}
      <div className="space-y-4">
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
      </div>

    </div>
  );
}
