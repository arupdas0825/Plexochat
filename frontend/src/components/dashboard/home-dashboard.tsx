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
  Compass,
  Plus,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/lib/auth-context";
import { useConnections } from "@/lib/connections-context";
import { useChat } from "@/lib/chat-context";

export function HomeDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { threads, selectThread } = useChat();
  const { connections } = useConnections();

  // Dynamic greeting based on current local hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Compute live communication statistics
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

  const compactStats = [
    {
      label: "Active Conversations",
      value: threads.length.toString(),
      detail: `${threads.length} threads`,
      icon: MessageSquare,
      iconColor: "text-indigo-500",
    },
    {
      label: "Global Connections",
      value: connections.length.toString(),
      detail: `${connections.length} connected`,
      icon: Users,
      iconColor: "text-purple-500",
    },
    {
      label: "Languages Practiced",
      value: Math.max(uniqueLanguagesPracticed.size, 1).toString(),
      detail: uniqueLanguagesPracticed.size > 0 ? Array.from(uniqueLanguagesPracticed).slice(0, 3).join(", ") : "Direct",
      icon: Languages,
      iconColor: "text-emerald-500",
    },
    {
      label: "Photos Shared",
      value: totalPhotosCount.toString(),
      detail: `${totalPhotosCount} encrypted`,
      icon: ImageIcon,
      iconColor: "text-amber-500",
    },
  ];

  return (
    <div className="flex-1 h-full overflow-y-auto no-scrollbar p-4 md:p-6 lg:p-8 pb-28 md:pb-8 space-y-6 max-w-6xl mx-auto w-full">
      {/* 1. Compact Header: Personalized Greeting & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/70">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>{getGreeting()}, {user?.displayName || "Friend"} 👋</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
            <span>Your private communication dashboard.</span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-500 font-mono">
              <ShieldCheck className="w-3 h-3" />
              <span>E2EE Active</span>
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/explore">
            <Button
              variant="outline"
              size="sm"
              className="h-8.5 px-3 text-xs font-medium rounded-xl border-border/80 gap-1.5 hover:bg-secondary cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-primary" />
              <span>Explore</span>
            </Button>
          </Link>
          <Link href="/chats">
            <Button
              size="sm"
              className="h-8.5 px-3 text-xs font-semibold rounded-xl gap-1.5 shadow-xs cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Open Chats</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Compact Modern Stat Chips (Reduced visual weight, highly informative) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {compactStats.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="px-3.5 py-2.5 rounded-xl bg-card border border-border/70 hover:border-border transition-colors flex items-center justify-between gap-2 shadow-xs"
            >
              <div className="min-w-0">
                <div className="text-[11px] font-medium text-muted-foreground truncate">
                  {item.label}
                </div>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-lg font-bold text-foreground tracking-tight">
                    {item.value}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono truncate">
                    {item.detail}
                  </span>
                </div>
              </div>
              <div className="p-1.5 rounded-lg bg-secondary/80 shrink-0">
                <Icon className={`w-4 h-4 ${item.iconColor}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Recent Conversations — Main Focus of the Page */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground tracking-tight">
              Recent Conversations
            </h2>
            {threads.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-secondary text-[11px] font-mono font-medium text-muted-foreground">
                {threads.length}
              </span>
            )}
          </div>
          <Link
            href="/chats"
            className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 group"
          >
            <span>View All</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {threads.length === 0 ? (
          /* Clean Actionable Empty State */
          <EmptyState
            icon={MessageSquare}
            title="No conversations yet"
            description="Connect with global partners or start an encrypted multilingual chat using a friend's PlexoChat ID."
            action={
              <div className="flex items-center gap-2">
                <Link href="/explore">
                  <Button variant="outline" size="sm" className="text-xs rounded-xl gap-1.5 h-8">
                    <Compass className="w-3.5 h-3.5 text-primary" />
                    <span>Explore Community</span>
                  </Button>
                </Link>
                <Link href="/chats">
                  <Button size="sm" className="text-xs rounded-xl gap-1.5 h-8">
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Chat</span>
                  </Button>
                </Link>
              </div>
            }
          />
        ) : (
          /* High-Density Conversational Rows */
          <div className="rounded-2xl border border-border/80 bg-card divide-y divide-border/60 overflow-hidden shadow-xs">
            {threads.slice(0, 6).map((chat) => {
              const p = chat.participant;
              const lastText =
                chat.lastMessage?.translatedText ||
                chat.lastMessage?.originalText ||
                "No messages yet";

              return (
                <div
                  key={chat.id}
                  onClick={() => {
                    selectThread(chat.id);
                    router.push("/chats");
                  }}
                  className="p-3 sm:p-3.5 flex items-center justify-between gap-3 hover:bg-secondary/50 transition-colors cursor-pointer group select-none"
                >
                  {/* Left: Avatar with Online Ring */}
                  <UserAvatar
                    name={p.displayName}
                    avatarBg={p.avatarBg}
                    size="md"
                    online={p.online}
                  />

                  {/* Middle: Conversation Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="font-semibold text-xs sm:text-sm text-foreground truncate group-hover:text-primary transition-colors">
                        {p.displayName}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                        {chat.lastMessage?.timestamp || ""}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground truncate leading-snug">
                      {lastText}
                    </p>

                    <div className="mt-1 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[10px] text-primary/80 font-mono">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>Language: {p.preferredLanguage || "Direct"}</span>
                      </span>
                      {chat.unreadCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-primary text-white text-[9px] font-bold font-mono">
                          {chat.unreadCount} New
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Quick Action */}
                  <div className="shrink-0 flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2.5 text-xs text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 gap-1 rounded-xl"
                    >
                      <span className="hidden sm:inline font-medium text-xs">Open</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
