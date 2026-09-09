"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Image as ImageIcon,
  Star,
  ArrowRight,
  TrendingUp,
  Languages,
  Clock,
  ListFilter,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { useChat } from "@/lib/chat-context";
import {
  computeCalendarDataFromThreads,
  CalendarDayActivity,
} from "@/lib/explore-calendar-data";

export function ConversationCalendarView() {
  const router = useRouter();
  const { threads, selectThread } = useChat();

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [mobileView, setMobileView] = useState<"agenda" | "month">("agenda");

  const currentMonthName = today.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-indexed

  // Compute days in current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday
  const startDayOffset = (firstDayOfMonth + 6) % 7; // Convert to Mon = 0

  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Compute dynamic calendar activity from REAL user messages
  const dynamicCalendarData = useMemo(() => {
    return computeCalendarDataFromThreads(threads);
  }, [threads]);

  // Compute real dynamic monthly totals
  const allRecordedDays = Object.values(dynamicCalendarData);
  const totalMessagesMonth = allRecordedDays.reduce((acc, d) => acc + d.messagesCount, 0);
  const totalPhotosMonth = allRecordedDays.reduce((acc, d) => acc + d.photosCount, 0);
  const activeDaysCount = allRecordedDays.length;

  // Real languages practiced
  const uniqueLangs = new Set<string>();
  threads.forEach((t) => {
    if (t.participant?.preferredLanguage) {
      uniqueLangs.add(t.participant.preferredLanguage);
    }
  });

  const selectedActivity: CalendarDayActivity | undefined = dynamicCalendarData[selectedDate];

  // Agenda list of all active days sorted chronologically descending
  const agendaDays = useMemo(() => {
    return Object.entries(dynamicCalendarData)
      .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
      .map(([date, activity]) => ({ date, activity }));
  }, [dynamicCalendarData]);

  return (
    <div className="flex-1 h-full overflow-y-auto no-scrollbar p-4 md:p-6 lg:p-8 pb-28 md:pb-8 space-y-6 max-w-6xl mx-auto w-full select-none">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/70">
        <div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Conversation Calendar
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Track your language practice frequency, message milestones, and shared cultural moments.
          </p>
        </div>

        {/* Mobile View Toggle (Agenda vs Month) */}
        <div className="flex items-center gap-1.5 md:hidden">
          <button
            type="button"
            onClick={() => setMobileView("agenda")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
              mobileView === "agenda"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary text-muted-foreground border-border/80"
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Agenda</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileView("month")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
              mobileView === "month"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary text-muted-foreground border-border/80"
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Month</span>
          </button>
        </div>
      </div>

      {/* 2. Compact Monthly Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="p-3.5 rounded-xl bg-card border border-border/70 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
            <span className="text-[11px] font-medium">Messages Exchanged</span>
            <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-xl font-bold text-foreground tracking-tight">
            {totalMessagesMonth}
          </div>
          <div className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate">
            {totalMessagesMonth === 0 ? "0 messages" : `${totalMessagesMonth} messages`}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-card border border-border/70 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
            <span className="text-[11px] font-medium">Active Practice Days</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-foreground tracking-tight">
            {activeDaysCount} {activeDaysCount === 1 ? "Day" : "Days"}
          </div>
          <div className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate">
            {activeDaysCount === 0 ? "0 sessions" : "Active chat days"}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-card border border-border/70 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
            <span className="text-[11px] font-medium">Photos Shared</span>
            <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-foreground tracking-tight">
            {totalPhotosMonth}
          </div>
          <div className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate">
            {totalPhotosMonth === 0 ? "0 photos" : `${totalPhotosMonth} encrypted`}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-card border border-border/70 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
            <span className="text-[11px] font-medium">Languages Practiced</span>
            <Languages className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <div className="text-xl font-bold text-foreground tracking-tight">
            {Math.max(uniqueLangs.size, 1)}
          </div>
          <div className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate">
            {uniqueLangs.size === 0 ? "Direct" : Array.from(uniqueLangs).join(", ")}
          </div>
        </div>
      </div>

      {/* 3. Mobile Agenda View (when on mobile and 'agenda' selected) */}
      <div className={`space-y-3 ${mobileView === "agenda" ? "block md:hidden" : "hidden"}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">Practice Agenda</h2>
          <span className="text-[11px] font-mono text-muted-foreground">
            {agendaDays.length} Active Days
          </span>
        </div>

        {agendaDays.length === 0 ? (
          <EmptyState
            icon={CalendarIcon}
            title="No scheduled practice sessions"
            description="Start chatting with connections to automatically log language exchange sessions and milestones."
            className="p-8"
          />
        ) : (
          <div className="space-y-2.5">
            {agendaDays.map(({ date, activity }) => (
              <div
                key={date}
                className="p-3.5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between pb-2 border-b border-border/50">
                  <span className="font-bold text-xs text-foreground">
                    {new Date(date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                    <span>💬 {activity.messagesCount} msgs</span>
                    {activity.photosCount > 0 && <span>📷 {activity.photosCount} photos</span>}
                  </div>
                </div>

                {activity.conversations.map((session, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 p-2 rounded-xl bg-secondary/40"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <UserAvatar
                        name={session.partnerName}
                        avatarBg={session.partnerAvatarBg}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-foreground truncate">
                          {session.partnerName}
                        </div>
                        <div className="text-[10px] text-primary font-mono truncate">
                          {session.languagePair}
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        selectThread(session.chatId);
                        router.push("/chats");
                      }}
                      className="h-7 px-2 text-[11px] rounded-lg text-primary gap-1"
                    >
                      <span>Chat</span>
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Desktop Month Grid (7 Cols) + Day Breakdown (5 Cols) / Mobile Month View */}
      <div
        className={`grid grid-cols-1 lg:grid-cols-12 gap-5 ${
          mobileView === "agenda" ? "hidden md:grid" : "grid"
        }`}
      >
        {/* Calendar Month Grid */}
        <div className="lg:col-span-7 rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border/50">
            <h2 className="text-sm sm:text-base font-bold text-foreground">
              {currentMonthName}
            </h2>
            <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Messages Active</span>
            </div>
          </div>

          {/* Weekdays */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-mono">
            {weekdays.map((day) => (
              <div key={day} className="py-0.5">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {Array.from({ length: startDayOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square rounded-xl bg-secondary/10 opacity-20" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateStr = `${year}-${(month + 1).toString().padStart(2, "0")}-${dayNum.toString().padStart(2, "0")}`;
              const activity = dynamicCalendarData[dateStr];
              const isSelected = selectedDate === dateStr;

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => setSelectedDate(dateStr)}
                  className={`aspect-square p-1 sm:p-1.5 rounded-xl border transition-all flex flex-col justify-between text-left cursor-pointer ${
                    isSelected
                      ? "bg-primary/15 border-primary ring-1.5 ring-primary/30"
                      : activity
                      ? "bg-secondary/40 border-border/70 hover:border-primary/40"
                      : "bg-card border-border/40 text-muted-foreground hover:bg-secondary/30"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-bold ${
                        isSelected ? "text-primary" : activity ? "text-foreground" : "text-muted-foreground/80"
                      }`}
                    >
                      {dayNum}
                    </span>
                    {activity?.newConnection && (
                      <Star className="w-2.5 h-2.5 text-purple-500 fill-purple-500" />
                    )}
                  </div>

                  {activity && (
                    <div className="flex items-center gap-0.5 mt-auto">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                      {activity.photosCount > 0 && (
                        <ImageIcon className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Activity Panel */}
        <div className="lg:col-span-5 rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="space-y-3">
            <div className="pb-2.5 border-b border-border/60">
              <span className="text-[10px] font-mono uppercase tracking-wider text-primary font-bold">
                Daily Conversation Log
              </span>
              <h3 className="text-sm sm:text-base font-bold text-foreground mt-0.5">
                {new Date(selectedDate).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </h3>
              {selectedActivity ? (
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono mt-0.5">
                  <span>💬 {selectedActivity.messagesCount} msgs</span>
                  <span>•</span>
                  <span>📷 {selectedActivity.photosCount} photos</span>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mt-0.5">
                  No sessions recorded on this day.
                </p>
              )}
            </div>

            {selectedActivity && selectedActivity.conversations.length > 0 ? (
              <div className="space-y-2">
                {selectedActivity.conversations.map((session, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-secondary/30 border border-border/60 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserAvatar
                          name={session.partnerName}
                          avatarBg={session.partnerAvatarBg}
                          size="sm"
                        />
                        <div>
                          <div className="font-bold text-xs text-foreground truncate">
                            {session.partnerName}
                          </div>
                          <div className="text-[10px] text-primary font-mono">
                            {session.languagePair}
                          </div>
                        </div>
                      </div>

                      <span className="px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground text-[10px] font-mono">
                        {session.messagesCount} msgs
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground italic bg-card/60 p-2 rounded-lg border border-border/40 line-clamp-2">
                      &quot;{session.previewSnippet}&quot;
                    </p>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        selectThread(session.chatId);
                        router.push("/chats");
                      }}
                      className="w-full text-xs font-semibold rounded-xl text-primary hover:bg-primary/10 gap-1.5 h-7.5 mt-0.5"
                    >
                      <span>Jump to Chat</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center rounded-xl bg-secondary/20 border border-dashed border-border/60 space-y-2">
                <Clock className="w-6 h-6 text-muted-foreground mx-auto opacity-70" />
                <p className="text-xs text-muted-foreground">
                  No conversation logs for this day.
                </p>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-border/50 text-[10px] text-muted-foreground text-center font-mono">
            🔒 Logged from encrypted client sessions
          </div>
        </div>
      </div>
    </div>
  );
}
