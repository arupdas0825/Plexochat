import { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { ConversationCalendarView } from "@/components/calendar/conversation-calendar-view";

export const metadata: Metadata = {
  title: "Conversation Calendar — PlexoChat",
  description: "Track your language practice frequency, message milestones, and shared cultural moments.",
};

export default function CalendarPage() {
  return (
    <AppShell>
      <ConversationCalendarView />
    </AppShell>
  );
}
