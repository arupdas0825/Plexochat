"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SidebarNav } from "./sidebar-nav";
import { ConversationView } from "./conversation-view";
import { NewChatDialog } from "./new-chat-dialog";
import { MessageSquare, Plus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChat } from "@/lib/chat-context";
import { useVisualViewport } from "@/lib/use-visual-viewport";

export function MainChatLayout() {
  const { threads, activeThreadId, selectThread, sendMessage } = useChat();
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const viewport = useVisualViewport();

  const activeThread = threads.find((t) => t.id === activeThreadId);

  return (
    <div className="h-full w-full overflow-hidden flex bg-background text-foreground relative">
      
      {/* 1. Sidebar Navigation (Always mounted on mobile to preserve scroll state) */}
      <div className="w-full md:w-80 lg:w-96 shrink-0 h-full flex">
        <SidebarNav
          threads={threads}
          activeThreadId={activeThreadId}
          onSelectThread={(id) => selectThread(id)}
          onOpenNewChat={() => setIsNewChatOpen(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      </div>

      {/* 2. Mobile Fullscreen Slide-in Conversation Stack */}
      <AnimatePresence>
        {activeThread && (
          <motion.div
            key={`mobile-chat-${activeThread.id}`}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 350 }}
            style={{
              height: viewport ? `${viewport.height}px` : "100dvh",
              top: viewport ? `${viewport.offsetTop}px` : "0px",
            }}
            className="fixed left-0 right-0 z-30 md:hidden bg-background flex flex-col overflow-hidden max-h-[100dvh]"
          >
            <ConversationView
              thread={activeThread}
              onBack={() => selectThread(null)}
              onSendMessage={(threadId, text) => sendMessage(threadId, text)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Desktop Main View Area */}
      <main className="hidden md:flex flex-1 h-full min-w-0 flex-col">
        {activeThread ? (
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
