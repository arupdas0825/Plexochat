"use client";

/**
 * Design Source: 21st.dev customer stories & use-case card showcase
 * Demonstrates real cross-language friendship & study scenarios
 */
import React from "react";
import { MessageCircle, Quote } from "lucide-react";

interface StoryItem {
  name: string;
  location: string;
  languages: string;
  quote: string;
  scenario: string;
  avatarColor: string;
}

const STORIES: StoryItem[] = [
  {
    name: "Tanvir & Lukas",
    location: "Dhaka & Munich",
    languages: "Banglish / German",
    quote:
      "I type in natural Bengali-English mix exactly how I chat with friends. Lukas reads German in Berlin without having to stop and paste my messages into a translator.",
    scenario: "International Study Partners",
    avatarColor: "from-blue-500 to-indigo-600",
  },
  {
    name: "Elena & Kenji",
    location: "Madrid & Tokyo",
    languages: "Spanish / Japanese",
    quote:
      "When we talk about software design, double-clicking to see Elena's original Spanish phrasing helps me pick up natural vocabulary while we chat effortlessly.",
    scenario: "Open Source Collaborators",
    avatarColor: "from-amber-500 to-rose-600",
  },
  {
    name: "Sarah & Amira",
    location: "Toronto & Cairo",
    languages: "English / Arabic",
    quote:
      "The connection request model means zero spam. Only verified friends can message me, and having end-to-end encrypted photo sharing makes it our favorite place to catch up.",
    scenario: "Cross-border Friendships",
    avatarColor: "from-emerald-500 to-teal-600",
  },
];

export function SocialProofSection() {
  return (
    <section id="use-cases" className="w-full py-24 sm:py-32 bg-background border-b border-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary mb-3 block">
            Real Stories
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
            Connecting people across languages and cultures.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground">
            See how everyday friendships, study groups, and international collaborators chat naturally with PlexoChat.
          </p>
        </div>

        {/* 3-Column Stories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STORIES.map((story) => (
            <div
              key={story.name}
              className="relative p-8 rounded-3xl bg-card border border-border/80 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <Quote className="w-8 h-8 text-primary/30 mb-4" />
                <p className="text-base text-foreground/90 leading-relaxed italic mb-6">
                  &ldquo;{story.quote}&rdquo;
                </p>
              </div>

              <div className="pt-6 border-t border-border/50 flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-full bg-gradient-to-br ${story.avatarColor} flex items-center justify-center text-white font-bold text-sm`}
                >
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-foreground">
                    {story.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {story.location} • <span className="text-primary font-medium">{story.languages}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
