import { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { MainChatLayout } from "@/components/chat/main-chat-layout";

export const metadata: Metadata = {
  title: "Chats — PlexoChat",
  description: "Your private, end-to-end encrypted multilingual conversations.",
};

export default function ChatsPage() {
  return (
    <AppShell>
      <MainChatLayout />
    </AppShell>
  );
}
