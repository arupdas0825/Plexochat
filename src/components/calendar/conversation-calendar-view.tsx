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
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

  return (
    <div className="flex-1 h-full overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
              Conversation Calendar
            </h1>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Track your language practice frequency, message milestones, and shared photos in real-time.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs bg-secondary/50 border border-border/70 rounded-2xl px-3 py-1.5 self-start md:self-center">
          <span className="flex items-center gap-1 text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Messages</span>
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <ImageIcon className="w-3 h-3 text-amber-500" />
            <span>Photos</span>
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Star className="w-3 h-3 text-purple-500 fill-purple-500" />
            <span>Connection</span>
          </span>
        </div>
      </div>

      {/* 2. Monthly Summary Stat Cards (100% Real Dynamic Values) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs mb-2">
            <span>Total Messages</span>
            <MessageSquare className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {totalMessagesMonth}
          </div>
          <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
            {totalMessagesMonth === 0 ? "No messages recorded yet" : `${totalMessagesMonth} messages exchanged`}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs mb-2">
            <span>Active Days</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {activeDaysCount} {activeDaysCount === 1 ? "Day" : "Days"}
          </div>
          <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
            {activeDaysCount === 0 ? "0 practice sessions" : "Active chatting sessions"}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs mb-2">
            <span>Photos Shared</span>
            <ImageIcon className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {totalPhotosMonth}
          </div>
          <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
            {totalPhotosMonth === 0 ? "0 encrypted photos" : `${totalPhotosMonth} shared photos`}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs mb-2">
            <span>Languages Practiced</span>
            <Languages className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {uniqueLangs.size}
          </div>
          <div className="text-[11px] text-muted-foreground font-mono mt-0.5 truncate">
            {uniqueLangs.size === 0 ? "0 language pairs" : Array.from(uniqueLangs).join(", ")}
          </div>
        </div>
      </div>

      {/* 3. Main Split Section: Calendar Grid (Left) + Selected Day Breakdown (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Calendar Grid (7 Cols) */}
        <div className="lg:col-span-7 rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm space-y-4">
          
          {/* Calendar Month Navigation Header */}
          <div className="flex items-center justify-between pb-2 border-b border-border/50">
            <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
              <span>{currentMonthName}</span>
            </h2>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" className="h-8 w-8 rounded-xl" disabled>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 rounded-xl" disabled>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">
            {weekdays.map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Day Cells */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {/* Empty prefix slots */}
            {Array.from({ length: startDayOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square rounded-2xl bg-secondary/10 opacity-30" />
            ))}

            {/* Actual Month Days */}
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
                  className={`aspect-square p-1.5 sm:p-2 rounded-2xl border transition-all flex flex-col justify-between text-left relative group ${
                    isSelected
                      ? "bg-primary/15 border-primary ring-2 ring-primary/30 shadow-md"
                      : activity
                      ? "bg-secondary/40 border-border hover:border-primary/40 hover:bg-secondary/70"
                      : "bg-card border-border/40 text-muted-foreground hover:bg-secondary/30"
                  }`}
                >
                  {/* Day Number */}
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-bold ${
                        isSelected
                          ? "text-primary"
                          : activity
                          ? "text-foreground"
                          : "text-muted-foreground/80"
                      }`}
                    >
                      {dayNum}
                    </span>

                    {activity?.newConnection && (
                      <Star className="w-2.5 h-2.5 text-purple-500 fill-purple-500" />
                    )}
                  </div>

                  {/* Activity Indicators */}
                  {activity && (
                    <div className="flex items-center gap-1 mt-auto pt-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      {activity.photosCount > 0 && (
                        <ImageIcon className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                      )}
                      <span className="text-[9px] font-mono text-muted-foreground ml-auto hidden sm:inline">
                        {activity.messagesCount}m
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

        </div>

        {/* Selected Day Activity Detail Panel (5 Cols) */}
        <div className="lg:col-span-5 rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
          
          <div className="space-y-4">
            {/* Day Header */}
            <div className="pb-3 border-b border-border/60">
              <span className="text-[10px] font-mono uppercase tracking-wider text-primary font-bold">
                Daily Conversation Log
              </span>
              <h3 className="text-lg font-bold text-foreground mt-0.5">
                {new Date(selectedDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </h3>

              {selectedActivity ? (
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 font-mono">
                  <span>💬 {selectedActivity.messagesCount} messages</span>
                  <span>•</span>
                  <span>📷 {selectedActivity.photosCount} photos</span>
                  <span>•</span>
                  <span>{selectedActivity.conversations.length} sessions</span>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">
                  No conversations logged on this date.
                </p>
              )}
            </div>

            {/* Conversation list for that day */}
            {selectedActivity && selectedActivity.conversations.length > 0 ? (
              <div className="space-y-3">
                {selectedActivity.conversations.map((session, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-secondary/30 border border-border/60 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-full bg-gradient-to-br ${session.partnerAvatarBg} text-white font-bold text-xs flex items-center justify-center shadow-sm`}
                        >
                          {session.partnerName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-foreground flex items-center gap-1.5">
                            <span>{session.partnerName}</span>
                          </div>
                          <div className="text-[10px] text-primary font-mono font-medium">
                            {session.languagePair}
                          </div>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground text-[10px] font-mono">
                        {session.messagesCount} msgs
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed italic bg-card/60 p-2.5 rounded-xl border border-border/40">
                      &quot;{session.previewSnippet}&quot;
                    </p>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        selectThread(session.chatId);
                        router.push("/chats");
                      }}
                      className="w-full text-xs font-semibold rounded-xl text-primary hover:bg-primary/10 gap-1.5 mt-1"
                    >
                      <span>Jump to Chat History</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl bg-secondary/20 border border-dashed border-border/70 space-y-2">
                <Clock className="w-8 h-8 text-muted-foreground mx-auto opacity-70" />
                <p className="text-xs text-muted-foreground">
                  No communication recorded on this day. Start a chat or explore members to begin practicing!
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push("/explore")}
                  className="text-xs rounded-xl"
                >
                  Explore Partners
                </Button>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-border/50 text-[10px] text-muted-foreground text-center">
            🔒 Calendar activity is computed dynamically from real encrypted device sessions.
          </div>

        </div>

      </div>

    </div>
  );
}
