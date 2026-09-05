"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Compass,
  Search,
  Sparkles,
  Send,
  Check,
  Languages,
  MessageSquare,
  Globe2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorldVectorMap } from "./world-vector-map";
import { useConnections } from "@/lib/connections-context";
import { DiscoverableUser, MapCluster } from "@/lib/explore-calendar-data";

const INTEREST_TAGS = [
  "All",
  "Tech",
  "Culture",
  "Anime",
  "Literature",
  "Music",
  "Cooking",
  "Photography",
  "Travel",
  "Architecture",
];

const LANGUAGE_OPTIONS = [
  "Any Language",
  "Japanese",
  "English",
  "Bengali",
  "German",
  "French",
  "Spanish",
  "Arabic",
  "Portuguese",
  "Korean",
];

export function ExploreWorldView() {
  const router = useRouter();
  const {
    exploreUsers,
    sendConnectionRequest,
    hasSentRequestTo,
    isConnectedWith,
  } = useConnections();

  const [selectedCluster, setSelectedCluster] = useState<MapCluster | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [targetLangFilter, setTargetLangFilter] = useState("Any Language");
  const [theySpeakFilter, setTheySpeakFilter] = useState("Any Language");
  const [onlyOnline, setOnlyOnline] = useState(false);
  const [selectedInterest, setSelectedInterest] = useState("All");

  const [selectedUserForNote, setSelectedUserForNote] = useState<DiscoverableUser | null>(null);
  const [personalNote, setPersonalNote] = useState("");
  const [justSentId, setJustSentId] = useState<string | null>(null);

  // Filter logic
  const filteredUsers = useMemo(() => {
    return exploreUsers.filter((u) => {
      // 1. Cluster filter
      if (selectedCluster && u.city.toLowerCase() !== selectedCluster.cityName.toLowerCase()) {
        return false;
      }

      // 2. Search query (name, username, bio, city, country)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          u.displayName.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q) ||
          u.city.toLowerCase().includes(q) ||
          u.country.toLowerCase().includes(q) ||
          u.bio.toLowerCase().includes(q);
        if (!match) return false;
      }

      // 3. Online filter
      if (onlyOnline && !u.online) {
        return false;
      }

      // 4. "I want to learn..." -> Target speaks this language
      if (targetLangFilter !== "Any Language") {
        const speaks = u.languagesSpoken.some((l) =>
          l.toLowerCase().includes(targetLangFilter.toLowerCase())
        );
        if (!speaks) return false;
      }

      // 5. "They speak..." -> Target speaks this language
      if (theySpeakFilter !== "Any Language") {
        const speaks = u.languagesSpoken.some((l) =>
          l.toLowerCase().includes(theySpeakFilter.toLowerCase())
        );
        if (!speaks) return false;
      }

      // 6. Interest tag
      if (selectedInterest !== "All") {
        const hasInterest = u.interests.some(
          (i) => i.toLowerCase() === selectedInterest.toLowerCase()
        );
        if (!hasInterest) return false;
      }

      return true;
    });
  }, [
    exploreUsers,
    selectedCluster,
    searchQuery,
    targetLangFilter,
    theySpeakFilter,
    onlyOnline,
    selectedInterest,
  ]);

  const handleOpenConnectModal = (user: DiscoverableUser) => {
    setSelectedUserForNote(user);
    setPersonalNote(
      `Hi ${user.displayName}! I noticed you're interested in ${user.interests[0] || "languages"}. Would love to exchange language practice!`
    );
  };

  const handleConfirmSendRequest = () => {
    if (!selectedUserForNote) return;
    sendConnectionRequest(selectedUserForNote, personalNote);
    setJustSentId(selectedUserForNote.id);
    setSelectedUserForNote(null);
    setPersonalNote("");
  };

  const handleResetFilters = () => {
    setSelectedCluster(null);
    setSearchQuery("");
    setTargetLangFilter("Any Language");
    setTheySpeakFilter("Any Language");
    setOnlyOnline(false);
    setSelectedInterest("All");
  };

  const hasActiveFilters =
    selectedCluster !== null ||
    searchQuery !== "" ||
    targetLangFilter !== "Any Language" ||
    theySpeakFilter !== "Any Language" ||
    onlyOnline ||
    selectedInterest !== "All";

  return (
    <div className="flex-1 h-full overflow-y-auto p-4 md:p-6 lg:p-8 pb-28 md:pb-8 space-y-6 max-w-7xl mx-auto w-full">
      
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Compass className="w-4 h-4" />
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
              Explore World
            </h1>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Discover conversation partners across timezones with reciprocal language matching.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-secondary/80 border border-border/60 text-xs font-mono font-medium text-foreground">
            🌍 {exploreUsers.length} Global Members Available
          </span>
        </div>
      </div>

      {/* 2. Interactive SVG World Map */}
      <WorldVectorMap
        users={exploreUsers}
        selectedClusterId={selectedCluster?.id || null}
        onSelectCluster={(cluster) => setSelectedCluster(cluster)}
      />

      {/* 3. Search and Multi-Filter Controls */}
      <div className="p-4 sm:p-5 rounded-3xl border border-border/80 bg-card space-y-4 shadow-sm">
        
        {/* Main Search Input */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, username, city, or bio keywords..."
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-border/80 bg-secondary/30 text-foreground placeholder:text-muted-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Online now toggle */}
          <button
            type="button"
            onClick={() => setOnlyOnline(!onlyOnline)}
            className={`h-11 px-4 rounded-xl border text-xs font-medium flex items-center gap-2 transition-colors ${
              onlyOnline
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold"
                : "bg-secondary/30 border-border/80 text-muted-foreground hover:text-foreground"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                onlyOnline ? "bg-emerald-500" : "bg-muted-foreground/50"
              }`}
            />
            <span>Online Now</span>
          </button>
        </div>

        {/* Dropdowns for Language Matching */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
              <Languages className="w-3.5 h-3.5 text-primary" />
              <span>Language I Want to Practice / Learn</span>
            </label>
            <select
              value={targetLangFilter}
              onChange={(e) => setTargetLangFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-border/80 bg-secondary/30 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
            >
              {LANGUAGE_OPTIONS.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
              <Globe2 className="w-3.5 h-3.5 text-primary" />
              <span>Native Language They Speak</span>
            </label>
            <select
              value={theySpeakFilter}
              onChange={(e) => setTheySpeakFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-border/80 bg-secondary/30 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
            >
              {LANGUAGE_OPTIONS.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Interest Tag Pills */}
        <div className="space-y-1.5 pt-1">
          <div className="text-[11px] font-semibold text-muted-foreground">
            Filter by Shared Interests:
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {INTEREST_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedInterest(tag)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors shrink-0 ${
                  selectedInterest === tag
                    ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                    : "bg-secondary/40 text-muted-foreground hover:text-foreground border border-border/50"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Active Filter Chips & Reset */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span>Showing</span>
              <span className="font-bold text-foreground font-mono">{filteredUsers.length}</span>
              <span>matches</span>
            </div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
          </div>
        )}

      </div>

      {/* 4. Discoverable People Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <span>Discoverable People</span>
            <span className="text-xs text-muted-foreground font-normal font-mono">
              ({filteredUsers.length} available)
            </span>
          </h2>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center rounded-3xl border border-dashed border-border/80 bg-card space-y-3">
            <div className="w-12 h-12 rounded-full bg-secondary mx-auto flex items-center justify-center text-muted-foreground">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-foreground">No matching people found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Try adjusting your language, cluster, or interest filters to discover more global members.
            </p>
            <Button size="sm" variant="outline" onClick={handleResetFilters} className="text-xs">
              Clear All Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((person) => {
              const isRequested = hasSentRequestTo(person.id) || justSentId === person.id;
              const isFriend = isConnectedWith(person.id);

              return (
                <div
                  key={person.id}
                  className="p-5 rounded-3xl border border-border/80 bg-card hover:border-primary/40 transition-all flex flex-col justify-between shadow-sm relative group"
                >
                  <div>
                    {/* Header: Location & Match Score */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-medium">
                        <span className="text-base">{person.countryFlag}</span>
                        <span>{person.city}, {person.country}</span>
                      </span>

                      {person.isStrongMatch ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                          <Sparkles className="w-3 h-3" />
                          <span>Strong Match ({person.matchScore}%)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-muted-foreground text-[10px] font-medium font-mono">
                          {person.matchScore}% Match
                        </span>
                      )}
                    </div>

                    {/* Avatar, Name & Status */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative">
                        <div
                          className={`w-12 h-12 rounded-full bg-gradient-to-br ${person.avatarBg} text-white font-bold text-sm flex items-center justify-center shadow-sm`}
                        >
                          {person.displayName.substring(0, 2).toUpperCase()}
                        </div>
                        {person.online && (
                          <span
                            title="Online Now"
                            className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-card"
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-base text-foreground leading-tight truncate">
                          {person.displayName}
                        </h3>
                        <p className="text-xs text-muted-foreground font-mono truncate">
                          @{person.username}
                        </p>
                      </div>
                    </div>

                    {/* Reciprocal Language Exchange Row */}
                    <div className="space-y-1.5 p-2.5 rounded-xl bg-secondary/30 border border-border/50 text-xs mb-3">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground font-medium">Speaks:</span>
                        <span className="font-semibold text-foreground truncate max-w-[180px]">
                          {person.languagesSpoken.join(", ")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground font-medium">Learning:</span>
                        <span className="font-semibold text-primary truncate max-w-[180px]">
                          {person.languagesLearning.join(", ")}
                        </span>
                      </div>
                    </div>

                    {/* Bio */}
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">
                      {person.bio}
                    </p>

                    {/* Interests tags */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {person.interests.map((interest, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-secondary/60 text-muted-foreground text-[10px] font-medium"
                        >
                          #{interest}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Connect Action Button */}
                  <div>
                    {isFriend ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-xs font-semibold rounded-xl gap-1.5"
                        onClick={() => router.push("/chats")}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Connected • Open Chat</span>
                      </Button>
                    ) : isRequested ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled
                        className="w-full text-xs font-semibold rounded-xl gap-1.5 opacity-80"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Connection Request Sent</span>
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleOpenConnectModal(person)}
                        className="w-full text-xs font-semibold rounded-xl gap-1.5 shadow-sm"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Connection Request</span>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Connect Personal Note Modal */}
      {selectedUserForNote && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <span className="text-xl">{selectedUserForNote.countryFlag}</span>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Connect with {selectedUserForNote.displayName}
                  </h3>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    {selectedUserForNote.city}, {selectedUserForNote.country}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserForNote(null)}
                className="text-xs text-muted-foreground hover:text-foreground p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">
                Add an optional friendly introduction note:
              </label>
              <textarea
                rows={3}
                value={personalNote}
                onChange={(e) => setPersonalNote(e.target.value)}
                placeholder="Mention what languages you want to practice or common hobbies..."
                className="w-full p-3 rounded-xl border border-border/80 bg-secondary/40 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-[10px] text-muted-foreground">
                Protected by client-side translation and end-to-end encryption.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedUserForNote(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmSendRequest}
                className="gap-1.5 text-xs font-semibold rounded-xl shadow-md shadow-primary/20"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Request</span>
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
