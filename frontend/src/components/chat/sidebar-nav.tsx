"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Users,
  Plus,
  Search,
  MoreVertical,
  BellOff,
  Volume2,
  Archive,
  CheckCheck,
  Trash2,
  X,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { ChatThread } from "@/lib/mock-chat-data";
import { useConnections } from "@/lib/connections-context";

interface SidebarNavProps {
  threads: ChatThread[];
  activeThreadId: string | null;
  onSelectThread: (id: string) => void;
  onOpenNewChat: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function SidebarNav({
  threads,
  activeThreadId,
  onSelectThread,
  onOpenNewChat,
  searchQuery,
  setSearchQuery,
}: SidebarNavProps) {
  const { pendingIncomingCount } = useConnections();
  const [mutedThreads, setMutedThreads] = useState<Record<string, boolean>>({});
  const [archivedThreads, setArchivedThreads] = useState<Record<string, boolean>>({});
  const [deletedThreads, setDeletedThreads] = useState<Record<string, boolean>>({});
  const [unreadOverride, setUnreadOverride] = useState<Record<string, boolean>>({});

  const filteredThreads = threads
    .filter((t) => !deletedThreads[t.id] && !archivedThreads[t.id])
    .filter(
      (t) =>
        t.participant.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.participant.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.lastMessage?.translatedText || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

  const searchRef = useRef<HTMLInputElement>(null);

  // Global shortcut: press '/' to focus conversation search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleMute = (threadId: string) => {
    setMutedThreads((prev) => ({ ...prev, [threadId]: !prev[threadId] }));
  };

  const handleArchive = (threadId: string) => {
    setArchivedThreads((prev) => ({ ...prev, [threadId]: true }));
  };

  const handleDelete = (threadId: string) => {
    setDeletedThreads((prev) => ({ ...prev, [threadId]: true }));
  };

  const handleToggleUnread = (threadId: string) => {
    setUnreadOverride((prev) => ({ ...prev, [threadId]: !prev[threadId] }));
  };

  return (
    <aside className="w-full h-full flex flex-col bg-card border-r border-border select-none overflow-hidden">
      {/* 1. Top Header: Chats Title + Actions */}
      <div className="p-3.5 sm:p-4 border-b border-border/70 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold tracking-tight text-foreground">
            Chats
          </h1>
          {filteredThreads.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-secondary text-[11px] font-mono font-medium text-muted-foreground">
              {filteredThreads.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Link href="/explore?tab=connections">
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary relative border-border/70 cursor-pointer"
              title="Contacts & Connection Requests"
              aria-label="Contacts & Connection Requests"
            >
              <Users className="w-4 h-4" />
              {pendingIncomingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center font-mono shadow-xs">
                  {pendingIncomingCount}
                </span>
              )}
            </Button>
          </Link>

          <Button
            size="sm"
            onClick={onOpenNewChat}
            className="h-8 px-2.5 rounded-xl gap-1.5 text-xs font-semibold shadow-xs active:scale-95 cursor-pointer"
            title="Start new conversation"
            aria-label="Start new conversation"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </Button>
        </div>
      </div>

      {/* 2. Search Bar */}
      <div className="p-2.5 border-b border-border/50 shrink-0">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 absolute left-3 text-muted-foreground pointer-events-none" />
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            aria-label="Search conversations"
            className="w-full h-8.5 pl-8.5 pr-10 rounded-xl border border-border/80 bg-secondary/50 text-foreground placeholder:text-muted-foreground text-xs focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          ) : (
            <kbd className="absolute right-2.5 text-[10px] font-mono text-muted-foreground border border-border/80 px-1.5 py-0.5 rounded bg-muted/60 hidden sm:inline-block pointer-events-none">
              /
            </kbd>
          )}
        </div>
      </div>

      {/* 3. Thread List with Clean Contextual Menu (Fix Problem 1) */}
      <div className="flex-1 overflow-y-auto no-scrollbar momentum-scroll divide-y divide-border/40 pb-20 md:pb-4">
        {filteredThreads.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title={searchQuery ? "No matching chats" : "No active chats"}
            description={
              searchQuery
                ? `No conversation found matching "${searchQuery}".`
                : "Start a private conversation or discover new partners."
            }
            action={
              <Button size="sm" variant="outline" onClick={onOpenNewChat} className="text-xs rounded-xl h-8">
                Start a New Chat
              </Button>
            }
            className="border-none bg-transparent m-4 p-6"
          />
        ) : (
          filteredThreads.map((thread) => {
            const isActive = activeThreadId === thread.id;
            const p = thread.participant;
            const isMuted = !!mutedThreads[thread.id];
            const isMarkedUnread = unreadOverride[thread.id];
            const hasUnread = isMarkedUnread || (thread.unreadCount > 0 && !unreadOverride[thread.id]);

            const lastMessagePreview =
              thread.lastMessage?.translatedText ||
              thread.lastMessage?.originalText ||
              "No messages yet";

            const menuItems: DropdownMenuItem[] = [
              {
                id: "mute",
                label: isMuted ? "Unmute notifications" : "Mute notifications",
                icon: isMuted ? Volume2 : BellOff,
                onClick: () => handleMute(thread.id),
              },
              {
                id: "unread",
                label: hasUnread ? "Mark as read" : "Mark as unread",
                icon: CheckCheck,
                onClick: () => handleToggleUnread(thread.id),
              },
              {
                id: "archive",
                label: "Archive conversation",
                icon: Archive,
                onClick: () => handleArchive(thread.id),
              },
              {
                id: "delete",
                label: "Delete conversation",
                icon: Trash2,
                destructive: true,
                onClick: () => handleDelete(thread.id),
              },
            ];

            return (
              <div
                key={thread.id}
                onClick={() => onSelectThread(thread.id)}
                className={`relative px-3.5 py-3 flex items-start gap-3 cursor-pointer transition-colors text-left select-none group ${
                  isActive
                    ? "bg-primary/10 dark:bg-primary/15 border-l-3 border-primary"
                    : "hover:bg-secondary/60 active:bg-secondary"
                }`}
              >
                {/* Avatar with live status indicator */}
                <UserAvatar
                  name={p.displayName}
                  avatarBg={p.avatarBg}
                  size="md"
                  online={p.online}
                />

                {/* Chat Item Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="font-semibold text-xs text-foreground truncate flex items-center gap-1.5">
                      <span className={isActive ? "text-primary font-bold" : ""}>
                        {p.displayName}
                      </span>
                      {isMuted && <BellOff className="w-3 h-3 text-muted-foreground opacity-70" />}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                      {thread.lastMessage?.timestamp || ""}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground truncate leading-snug">
                    {lastMessagePreview}
                  </p>

                  <div className="mt-1 flex items-center justify-between gap-1">
                    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                      <Sparkles className="w-2.5 h-2.5 text-primary/70" />
                      <span>{p.preferredLanguage || "Direct"}</span>
                    </span>

                    {hasUnread && (
                      <span className="px-1.5 py-0.2 rounded-full bg-primary text-white text-[9px] font-bold font-mono">
                        {thread.unreadCount > 0 ? thread.unreadCount : "1"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Problem 1 Fix: Replace huge colored swipe blocks with sleek ⋮ contextual menu */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0 self-center"
                >
                  <DropdownMenu
                    trigger={
                      <button
                        type="button"
                        className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        title="More options"
                        aria-label="Conversation options"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    }
                    items={menuItems}
                    align="right"
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
