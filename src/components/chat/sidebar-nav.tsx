"use client";

/**
 * Design Source: 21st.dev two-pane messenger sidebar pattern
 * Features:
 * - Brand header with logo.png
 * - User identity chip with PlexoChat ID
 * - Chats / Connections / Settings tab navigation
 * - Search bar with instant filter
 * - Unread message & connection request badges
 */
import React from "react";
import Image from "next/image";
import {
  MessageSquare,
  Users,
  Settings,
  Plus,
  Search,
  Sparkles,
  Lock,
  Globe2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChatThread } from "@/lib/mock-chat-data";
import { useAuth } from "@/lib/auth-context";

interface SidebarNavProps {
  activeTab: "chats" | "connections" | "settings";
  setActiveTab: (tab: "chats" | "connections" | "settings") => void;
  threads: ChatThread[];
  activeThreadId: string | null;
  onSelectThread: (id: string) => void;
  onOpenNewChat: () => void;
  pendingRequestsCount: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function SidebarNav({
  activeTab,
  setActiveTab,
  threads,
  activeThreadId,
  onSelectThread,
  onOpenNewChat,
  pendingRequestsCount,
  searchQuery,
  setSearchQuery,
}: SidebarNavProps) {
  const { user } = useAuth();

  const filteredThreads = threads.filter(
    (t) =>
      t.participant.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.participant.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.lastMessage.translatedText.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className="w-full md:w-80 lg:w-96 h-full flex flex-col bg-card border-r border-border select-none">
      
      {/* Top Header: Logo + New Chat Action */}
      <div className="p-4 border-b border-border/70 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 relative flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="PlexoChat Logo"
              width={32}
              height={32}
              className="w-8 h-8 object-contain"
              priority
            />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-foreground block">
              PlexoChat
            </span>
            <span className="text-[10px] text-emerald-500 font-mono font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              E2EE Relay Active
            </span>
          </div>
        </div>

        <Button
          size="sm"
          onClick={onOpenNewChat}
          className="h-8 px-3 rounded-xl gap-1.5 text-xs font-semibold shadow-sm"
          title="Start new chat with someone"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Chat</span>
        </Button>
      </div>

      {/* Logged in user profile chip */}
      {user && (
        <div className="px-4 py-2.5 bg-secondary/30 border-b border-border/40 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-primary to-violet-500 text-white flex items-center justify-center font-bold text-xs">
              {user.displayName.substring(0, 1).toUpperCase()}
            </div>
            <div>
              <div className="font-semibold text-foreground leading-tight">
                {user.displayName}
              </div>
              <div className="text-[10px] text-muted-foreground font-mono">
                @{user.username}
              </div>
            </div>
          </div>
          <Badge variant="accent" className="text-[10px] font-mono py-0 px-2">
            {user.plexoChatId}
          </Badge>
        </div>
      )}

      {/* Tabs Navigation (Chats, Connections, Settings) */}
      <div className="grid grid-cols-3 p-2 bg-secondary/50 border-b border-border/60 text-xs font-medium gap-1">
        <button
          type="button"
          onClick={() => setActiveTab("chats")}
          className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === "chats"
              ? "bg-card text-foreground font-semibold shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Chats</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("connections")}
          className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors relative ${
            activeTab === "connections"
              ? "bg-card text-foreground font-semibold shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Contacts</span>
          {pendingRequestsCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
              {pendingRequestsCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("settings")}
          className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === "settings"
              ? "bg-card text-foreground font-semibold shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </button>
      </div>

      {/* Search Bar (Only when in Chats tab) */}
      {activeTab === "chats" && (
        <div className="p-3 border-b border-border/50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full h-9 pl-9 pr-3 rounded-xl border border-border/80 bg-secondary/40 text-foreground placeholder:text-muted-foreground text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
      )}

      {/* Thread List Content */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/30">
        {activeTab === "chats" && (
          filteredThreads.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground space-y-3">
              <div className="w-12 h-12 rounded-full bg-secondary mx-auto flex items-center justify-center text-muted-foreground">
                <MessageSquare className="w-6 h-6" />
              </div>
              <p>No chats found.</p>
              <Button size="sm" variant="outline" onClick={onOpenNewChat} className="text-xs">
                Start a New Chat
              </Button>
            </div>
          ) : (
            filteredThreads.map((thread) => {
              const isActive = activeThreadId === thread.id;
              const p = thread.participant;

              return (
                <div
                  key={thread.id}
                  onClick={() => onSelectThread(thread.id)}
                  tabIndex={0}
                  role="button"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      onSelectThread(thread.id);
                    }
                  }}
                  className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors text-left focus:outline-none focus:bg-secondary/70 ${
                    isActive
                      ? "bg-primary/10 border-l-4 border-primary"
                      : "hover:bg-secondary/50"
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div
                      className={`w-11 h-11 rounded-full bg-gradient-to-br ${p.avatarBg} text-white font-bold text-sm flex items-center justify-center shadow-sm`}
                    >
                      {p.displayName.substring(0, 2).toUpperCase()}
                    </div>
                    {p.online && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-card" />
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-semibold text-sm text-foreground truncate">
                        {p.displayName}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                        {thread.lastMessage.timestamp}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground truncate leading-snug">
                      {thread.lastMessage.translatedText}
                    </p>

                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 text-[10px] text-primary/80 font-mono">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>Translated • {thread.lastMessage.targetLangCode}</span>
                      </span>

                      {thread.unreadCount > 0 && (
                        <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                          {thread.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )
        )}
      </div>

    </aside>
  );
}
