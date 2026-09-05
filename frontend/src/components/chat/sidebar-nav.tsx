"use client";

/**
 * Screen: Sidebar Navigation (WhatsApp/Messenger Mobile Polish)
 * 
 * MOBILE INTERACTION FEATURES:
 * - Swipe-to-action on chat rows (swipe left to reveal Mute, Archive, Delete).
 * - Pull-to-refresh at the top of the chat list with tactile spinner.
 * - Real-time unread badges.
 * - Touch-manipulation on tabs and buttons for zero tap-delay.
 */
import React, { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Users,
  Settings,
  Plus,
  Search,
  Sparkles,
  BellOff,
  Archive,
  Trash2,
  RefreshCw,
  Volume2,
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
  const [mutedThreads, setMutedThreads] = useState<Record<string, boolean>>({});
  const [archivedThreads, setArchivedThreads] = useState<Record<string, boolean>>({});
  const [deletedThreads, setDeletedThreads] = useState<Record<string, boolean>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullY, setPullY] = useState(0);

  const filteredThreads = threads
    .filter((t) => !deletedThreads[t.id] && !archivedThreads[t.id])
    .filter(
      (t) =>
        t.participant.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.participant.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.lastMessage.translatedText.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const handleMute = (threadId: string) => {
    setMutedThreads((prev) => ({ ...prev, [threadId]: !prev[threadId] }));
  };

  const handleArchive = (threadId: string) => {
    setArchivedThreads((prev) => ({ ...prev, [threadId]: true }));
  };

  const handleDelete = (threadId: string) => {
    setDeletedThreads((prev) => ({ ...prev, [threadId]: true }));
  };

  // Pull to refresh handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop === 0) {
      e.currentTarget.dataset.startY = e.touches[0].clientY.toString();
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const startY = parseFloat(e.currentTarget.dataset.startY || "0");
    if (startY > 0 && e.currentTarget.scrollTop === 0) {
      const currentY = e.touches[0].clientY;
      const diff = currentY - startY;
      if (diff > 0) {
        setPullY(Math.min(diff * 0.4, 60));
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    e.currentTarget.dataset.startY = "0";
    if (pullY > 40) {
      setIsRefreshing(true);
      setTimeout(() => {
        setIsRefreshing(false);
        setPullY(0);
      }, 700);
    } else {
      setPullY(0);
    }
  };

  return (
    <aside className="w-full md:w-80 lg:w-96 h-full flex flex-col bg-card border-r border-border select-none overflow-hidden">
      
      {/* 1. Top Header: Logo + New Chat Action */}
      <div className="p-3.5 sm:p-4 border-b border-border/70 flex items-center justify-between shrink-0">
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
            <span className="font-bold text-base tracking-tight text-foreground block leading-tight">
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
          className="h-8 px-3 rounded-xl gap-1.5 text-xs font-semibold shadow-sm active:scale-95 touch-manipulation"
          title="Start new chat with someone"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Chat</span>
        </Button>
      </div>

      {/* 2. Logged in user profile chip */}
      {user && (
        <div className="px-3.5 py-2 bg-secondary/30 border-b border-border/40 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-primary to-violet-500 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
              {user.displayName.substring(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-foreground truncate text-xs leading-none">
                {user.displayName}
              </div>
              <div className="text-[9px] text-muted-foreground font-mono truncate mt-0.5">
                @{user.username}
              </div>
            </div>
          </div>
          <Badge variant="accent" className="text-[9px] font-mono py-0 px-1.5 shrink-0">
            {user.plexoChatId}
          </Badge>
        </div>
      )}

      {/* 3. Tabs Navigation */}
      <div className="grid grid-cols-3 p-1.5 bg-secondary/50 border-b border-border/60 text-xs font-medium gap-1 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab("chats")}
          className={`py-1.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all touch-manipulation active:scale-95 ${
            activeTab === "chats"
              ? "bg-card text-foreground font-semibold shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Chats</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("connections")}
          className={`py-1.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all touch-manipulation active:scale-95 relative ${
            activeTab === "connections"
              ? "bg-card text-foreground font-semibold shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Contacts</span>
          {pendingRequestsCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center">
              {pendingRequestsCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("settings")}
          className={`py-1.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all touch-manipulation active:scale-95 ${
            activeTab === "settings"
              ? "bg-card text-foreground font-semibold shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Settings</span>
        </button>
      </div>

      {/* 4. Search Bar */}
      {activeTab === "chats" && (
        <div className="p-2.5 border-b border-border/50 shrink-0">
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

      {/* 5. Pull-to-Refresh Visual Indicator */}
      <div
        style={{
          height: isRefreshing ? "40px" : `${pullY}px`,
          opacity: pullY > 10 || isRefreshing ? 1 : 0,
        }}
        className="flex items-center justify-center overflow-hidden transition-all duration-150 bg-secondary/30 shrink-0 text-muted-foreground"
      >
        <RefreshCw
          className={`w-4 h-4 text-primary ${isRefreshing ? "animate-spin" : ""}`}
        />
        <span className="text-[10px] ml-1.5 font-medium">
          {isRefreshing ? "Refreshing chats..." : "Pull to sync"}
        </span>
      </div>

      {/* 6. Thread List with Swipe-to-Action */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="flex-1 overflow-y-auto momentum-scroll divide-y divide-border/30"
      >
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
              const isMuted = !!mutedThreads[thread.id];

              return (
                <div key={thread.id} className="relative overflow-hidden group">
                  
                  {/* Revealed Swipe Actions Background (Underneath) */}
                  <div className="absolute inset-y-0 right-0 flex items-stretch z-0">
                    <button
                      type="button"
                      onClick={() => handleMute(thread.id)}
                      className="px-3 bg-amber-500 text-white flex flex-col items-center justify-center gap-1 text-[9px] font-semibold active:opacity-80"
                      title={isMuted ? "Unmute" : "Mute"}
                    >
                      {isMuted ? <Volume2 className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                      <span>{isMuted ? "Unmute" : "Mute"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleArchive(thread.id)}
                      className="px-3 bg-indigo-600 text-white flex flex-col items-center justify-center gap-1 text-[9px] font-semibold active:opacity-80"
                      title="Archive"
                    >
                      <Archive className="w-4 h-4" />
                      <span>Archive</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(thread.id)}
                      className="px-3 bg-destructive text-white flex flex-col items-center justify-center gap-1 text-[9px] font-semibold active:opacity-80"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>

                  {/* Foreground Draggable Row */}
                  <motion.div
                    drag="x"
                    dragConstraints={{ left: -140, right: 0 }}
                    dragElastic={0.08}
                    onClick={() => onSelectThread(thread.id)}
                    tabIndex={0}
                    role="button"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        onSelectThread(thread.id);
                      }
                    }}
                    className={`relative z-10 p-3.5 flex items-start gap-3 cursor-pointer transition-colors text-left focus:outline-none bg-card ${
                      isActive
                        ? "bg-primary/10 border-l-4 border-primary"
                        : "hover:bg-secondary/50 active:bg-secondary/70"
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
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
                      )}
                    </div>

                    {/* Chat Item Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-semibold text-sm text-foreground truncate flex items-center gap-1.5">
                          <span>{p.displayName}</span>
                          {isMuted && <BellOff className="w-3 h-3 text-muted-foreground" />}
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
                          <span className="min-w-[1.125rem] h-4.5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-xs">
                            {thread.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>

                </div>
              );
            })
          )
        )}
      </div>

    </aside>
  );
}
