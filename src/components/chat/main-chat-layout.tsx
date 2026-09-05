"use client";

import React, { useState } from "react";
import { SidebarNav } from "./sidebar-nav";
import { ConversationView } from "./conversation-view";
import { ConnectionsView } from "./connections-view";
import { SettingsView } from "./settings-view";
import { NewChatDialog } from "./new-chat-dialog";
import { ConnectionRequest } from "@/lib/mock-chat-data";
import { MessageSquare, Plus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChat } from "@/lib/chat-context";
import { useConnections } from "@/lib/connections-context";

export function MainChatLayout() {
  const [activeTab, setActiveTab] = useState<"chats" | "connections" | "settings">("chats");
  const { threads, activeThreadId, selectThread, sendMessage } = useChat();
  const {
    requests: storedRequests,
    acceptConnectionRequest,
    declineConnectionRequest,
    blockConnectionUser,
  } = useConnections();

  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const activeThread = threads.find((t) => t.id === activeThreadId);

  // Adapt storedRequests to ConnectionRequest interface
  const adaptedRequests: ConnectionRequest[] = storedRequests
    .filter((r) => r.type === "incoming" && r.status === "pending")
    .map((r) => ({
      id: r.id,
      sender: {
        id: r.userId,
        username: r.username,
        displayName: r.displayName,
        plexoChatId: "PX-VERIFIED",
        avatarBg: r.avatarBg,
        preferredLanguage: r.languagesSpoken[0] || "English",
        languageCode: "AUTO",
        online: true,
      },
      timestamp: r.sentAt,
      status: "PENDING",
    }));

  return (
    <div className="h-full w-full overflow-hidden flex bg-background text-foreground">
      
      {/* Left Sidebar Navigation (Desktop or Mobile Chats list) */}
      <div
        className={`${
          activeThreadId && activeTab === "chats"
            ? "hidden md:flex"
            : "flex"
        } w-full md:w-80 lg:w-96 shrink-0 h-full`}
      >
        <SidebarNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          threads={threads}
          activeThreadId={activeThreadId}
          onSelectThread={(id) => {
            selectThread(id);
            setActiveTab("chats");
          }}
          onOpenNewChat={() => setIsNewChatOpen(true)}
          pendingRequestsCount={adaptedRequests.length}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      </div>

      {/* Right Content Area: Active Conversation / Contacts / Settings / Empty State */}
      <main
        className={`${
          !activeThreadId && activeTab === "chats"
            ? "hidden md:flex"
            : "flex"
        } flex-1 h-full min-w-0 flex-col`}
      >
        {activeTab === "connections" ? (
          <ConnectionsView
            requests={adaptedRequests}
            onAcceptRequest={(id) => acceptConnectionRequest(id)}
            onDeclineRequest={(id) => declineConnectionRequest(id)}
            onBlockUser={(id) => blockConnectionUser(id)}
            activeThreads={threads}
            onSelectChat={(id) => {
              selectThread(id);
              setActiveTab("chats");
            }}
          />
        ) : activeTab === "settings" ? (
          <SettingsView />
        ) : activeThread ? (
          <ConversationView
            thread={activeThread}
            onBack={() => selectThread(null)}
            onSendMessage={(threadId, text) => sendMessage(threadId, text)}
          />
        ) : (
          /* Clean Empty State when no chat is chosen or 0 chats exist */
          <div className="flex-1 h-full flex flex-col items-center justify-center p-8 text-center bg-mesh-gradient">
            <div className="w-16 h-16 rounded-3xl bg-secondary flex items-center justify-center text-muted-foreground mb-4">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-foreground">
              Select a conversation to start chatting
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-6">
              Write naturally in your own language. PlexoChat will automatically translate into your recipient&apos;s preferred language.
            </p>
            <Button onClick={() => setIsNewChatOpen(true)} className="gap-2 font-semibold">
              <Plus className="w-4 h-4" />
              <span>Start a New Chat</span>
            </Button>
            <div className="mt-8 text-xs text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>End-to-End Encrypted Relay Active</span>
            </div>
          </div>
        )}
      </main>

      {/* New Chat Search Modal */}
      <NewChatDialog
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        onRequestSent={(name) => {
          setIsNewChatOpen(false);
          alert(`Connection request sent to ${name}. You will be able to message them once accepted.`);
        }}
      />

    </div>
  );
}
