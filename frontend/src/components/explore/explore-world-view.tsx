"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
  Users,
  UserCheck,
  UserPlus,
  Clock,
  ShieldAlert,
  ArrowRight,
  Filter,
  CheckCircle2,
  MapPin,
  Smile,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorldVectorMap } from "./world-vector-map";
import { useConnections } from "@/lib/connections-context";
import { useAuth } from "@/lib/auth-context";
import { useChat } from "@/lib/chat-context";
import {
  DiscoverableUser,
  MapCluster,
  StoredConnectionRequest,
  ConnectedFriend,
} from "@/lib/explore-calendar-data";

export type ExploreTabId = "map" | "discover" | "match" | "requests" | "connections";

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
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { threads, selectThread, startChatWithUser } = useChat();
  const {
    exploreUsers,
    requests,
    connections,
    pendingIncomingCount,
    sendConnectionRequest,
    acceptConnectionRequest,
    declineConnectionRequest,
    cancelConnectionRequest,
    blockConnectionUser,
    hasSentRequestTo,
    isConnectedWith,
  } = useConnections();

  // Tab state synced with URL query (?tab=...)
  const tabParam = searchParams.get("tab") as ExploreTabId | null;
  const initialTab: ExploreTabId =
    tabParam && ["map", "discover", "match", "requests", "connections"].includes(tabParam)
      ? tabParam
      : "map";

  const [activeTab, setActiveTab] = useState<ExploreTabId>(initialTab);

  // Sync state if URL changes externally
  useEffect(() => {
    if (tabParam && ["map", "discover", "match", "requests", "connections"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: ExploreTabId) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`/explore?${params.toString()}`, { scroll: false });
  };

  // 1. World Map State
  const [selectedCluster, setSelectedCluster] = useState<MapCluster | null>(null);

  // 2. Discover Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [targetLangFilter, setTargetLangFilter] = useState("Any Language");
  const [theySpeakFilter, setTheySpeakFilter] = useState("Any Language");
  const [onlyOnline, setOnlyOnline] = useState(false);
  const [selectedInterest, setSelectedInterest] = useState("All");

  // 3. Language Match State
  const [myTeachLang, setMyTeachLang] = useState(
    user?.languagesSpoken?.[0] || user?.preferredLanguageName || "English"
  );
  const [myLearnLang, setMyLearnLang] = useState(
    user?.languagesLearning?.[0] || "Japanese"
  );

  // 4. Requests sub-tab
  const [requestsSubTab, setRequestsSubTab] = useState<"incoming" | "outgoing">("incoming");

  // 5. Connections search
  const [connectionSearch, setConnectionSearch] = useState("");

  // Connect Modal State
  const [selectedUserForNote, setSelectedUserForNote] = useState<DiscoverableUser | null>(null);
  const [personalNote, setPersonalNote] = useState("");
  const [justSentId, setJustSentId] = useState<string | null>(null);

  // Filtered users for Discover People
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

  // Reciprocal Language Matches
  const matchedUsers = useMemo(() => {
    return exploreUsers
      .map((u) => {
        // Does target speak what I want to learn?
        const speaksWhatILearn = u.languagesSpoken.some((l) =>
          l.toLowerCase().includes(myLearnLang.toLowerCase())
        );
        // Does target want to learn what I teach?
        const learnsWhatITeach = u.languagesLearning.some((l) =>
          l.toLowerCase().includes(myTeachLang.toLowerCase())
        );

        let matchScore = 70;
        let matchReason = "Available language partner";
        let isPerfectReciprocal = false;

        if (speaksWhatILearn && learnsWhatITeach) {
          matchScore = 98;
          matchReason = `Mutual Exchange: You teach ${myTeachLang} ↔ They teach ${myLearnLang}`;
          isPerfectReciprocal = true;
        } else if (speaksWhatILearn) {
          matchScore = 90;
          matchReason = `Native / Fluent in ${myLearnLang}`;
        } else if (learnsWhatITeach) {
          matchScore = 80;
          matchReason = `Wants to practice ${myTeachLang}`;
        }

        // Shared interests boost
        const userInterests = user?.interests || [];
        const sharedInterests = u.interests.filter((i) =>
          userInterests.some((ui) => ui.toLowerCase() === i.toLowerCase())
        );
        if (sharedInterests.length > 0) {
          matchScore = Math.min(99, matchScore + sharedInterests.length * 2);
        }

        return {
          ...u,
          dynamicScore: matchScore,
          dynamicReason: matchReason,
          isPerfectReciprocal,
          sharedInterests,
        };
      })
      .sort((a, b) => b.dynamicScore - a.dynamicScore);
  }, [exploreUsers, myTeachLang, myLearnLang, user?.interests]);

  // Requests filtered
  const incomingRequests = useMemo(
    () => requests.filter((r) => r.type === "incoming" && r.status === "pending"),
    [requests]
  );
  const outgoingRequests = useMemo(
    () => requests.filter((r) => r.type === "outgoing" && r.status === "pending"),
    [requests]
  );

  // Filtered connections
  const filteredConnections = useMemo(() => {
    if (!connectionSearch.trim()) return connections;
    const q = connectionSearch.toLowerCase();
    return connections.filter(
      (c) =>
        c.displayName.toLowerCase().includes(q) ||
        c.username.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q) ||
        c.languagesSpoken.some((l) => l.toLowerCase().includes(q))
    );
  }, [connections, connectionSearch]);

  const handleOpenConnectModal = (u: DiscoverableUser, customIntro?: string) => {
    setSelectedUserForNote(u);
    setPersonalNote(
      customIntro ||
        `Hi ${u.displayName}! I noticed you speak ${u.languagesSpoken[0] || "languages"}. Would love to exchange practice and connect on PlexoChat!`
    );
  };

  const handleConfirmSendRequest = () => {
    if (!selectedUserForNote) return;
    sendConnectionRequest(selectedUserForNote, personalNote);
    setJustSentId(selectedUserForNote.id);
    setSelectedUserForNote(null);
    setPersonalNote("");
  };

  const handleOpenChatWithFriend = (friend: ConnectedFriend) => {
    // Check if an existing thread exists with this friend
    const existingThread = threads.find((t) => t.participant?.id === friend.userId);
    if (existingThread) {
      selectThread(existingThread.id);
    } else {
      // Start new thread
      const threadId = startChatWithUser({
        id: friend.userId,
        username: friend.username,
        displayName: friend.displayName,
        plexoChatId: "PX-VERIFIED",
        avatarBg: friend.avatarBg,
        preferredLanguage: friend.languagesSpoken[0] || "English",
        languageCode: "AUTO",
        online: friend.online,
      });
      selectThread(threadId);
    }
    router.push("/chats");
  };

  return (
    <div className="flex-1 h-full overflow-y-auto p-4 md:p-6 lg:p-8 pb-28 md:pb-8 space-y-6 max-w-7xl mx-auto w-full select-none">
      
      {/* 1. Main Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
            Explore & Connections
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Discover international partners on the world map, match reciprocal languages, and manage verified connections.
          </p>
        </div>

        {/* Global Live Stats Pill */}
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-full bg-secondary/80 border border-border/60 text-xs font-mono font-medium text-foreground flex items-center gap-2 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{exploreUsers.length} Global Members Available</span>
          </div>
        </div>
      </div>

      {/* 2. Apple-Style Liquid Glass Segmented Control Hub Bar */}
      <div className="relative flex items-center p-1 rounded-2xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),0_4px_20px_0_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] overflow-x-auto no-scrollbar gap-1">
        
        {/* Tab 1: World Map */}
        <button
          type="button"
          onClick={() => handleTabChange("map")}
          className={`relative px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors duration-200 shrink-0 ${
            activeTab === "map"
              ? "text-primary font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {activeTab === "map" && (
            <motion.div
              layoutId="exploreActiveTabPill"
              className="absolute inset-0 rounded-xl bg-primary/10 dark:bg-primary/20 border border-primary/25 shadow-xs"
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
            />
          )}
          <Globe2 className="w-4 h-4 relative z-10" />
          <span className="relative z-10">World Map</span>
        </button>

        {/* Tab 2: Discover People */}
        <button
          type="button"
          onClick={() => handleTabChange("discover")}
          className={`relative px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors duration-200 shrink-0 ${
            activeTab === "discover"
              ? "text-primary font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {activeTab === "discover" && (
            <motion.div
              layoutId="exploreActiveTabPill"
              className="absolute inset-0 rounded-xl bg-primary/10 dark:bg-primary/20 border border-primary/25 shadow-xs"
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
            />
          )}
          <Users className="w-4 h-4 relative z-10" />
          <span className="relative z-10">Discover People</span>
          <span className="relative z-10 px-1.5 py-0.2 rounded-full bg-secondary text-muted-foreground text-[10px] font-mono">
            {filteredUsers.length}
          </span>
        </button>

        {/* Tab 3: Language Match */}
        <button
          type="button"
          onClick={() => handleTabChange("match")}
          className={`relative px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors duration-200 shrink-0 ${
            activeTab === "match"
              ? "text-primary font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {activeTab === "match" && (
            <motion.div
              layoutId="exploreActiveTabPill"
              className="absolute inset-0 rounded-xl bg-primary/10 dark:bg-primary/20 border border-primary/25 shadow-xs"
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
            />
          )}
          <Languages className="w-4 h-4 relative z-10" />
          <span className="relative z-10">Language Match</span>
        </button>

        {/* Tab 4: Connection Requests */}
        <button
          type="button"
          onClick={() => handleTabChange("requests")}
          className={`relative px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors duration-200 shrink-0 ${
            activeTab === "requests"
              ? "text-primary font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {activeTab === "requests" && (
            <motion.div
              layoutId="exploreActiveTabPill"
              className="absolute inset-0 rounded-xl bg-primary/10 dark:bg-primary/20 border border-primary/25 shadow-xs"
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
            />
          )}
          <UserPlus className="w-4 h-4 relative z-10" />
          <span className="relative z-10">Requests</span>
          {pendingIncomingCount > 0 && (
            <span className="relative z-10 px-1.5 py-0.2 rounded-full bg-primary text-primary-foreground text-[10px] font-bold font-mono">
              {pendingIncomingCount}
            </span>
          )}
        </button>

        {/* Tab 5: My Connections */}
        <button
          type="button"
          onClick={() => handleTabChange("connections")}
          className={`relative px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors duration-200 shrink-0 ${
            activeTab === "connections"
              ? "text-primary font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {activeTab === "connections" && (
            <motion.div
              layoutId="exploreActiveTabPill"
              className="absolute inset-0 rounded-xl bg-primary/10 dark:bg-primary/20 border border-primary/25 shadow-xs"
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
            />
          )}
          <UserCheck className="w-4 h-4 relative z-10" />
          <span className="relative z-10">My Connections</span>
          <span className="relative z-10 px-1.5 py-0.2 rounded-full bg-secondary text-muted-foreground text-[10px] font-mono">
            {connections.length}
          </span>
        </button>

      </div>

      {/* 3. Tab Contents */}

      {/* ══════════════════════════════════════════════════════
          TAB 1: WORLD MAP
         ══════════════════════════════════════════════════════ */}
      {activeTab === "map" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Interactive Global Discovery Map
              </h2>
              <p className="text-xs text-muted-foreground">
                Click on any city cluster pin to focus on members currently available in that region.
              </p>
            </div>

            {selectedCluster && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-foreground font-medium px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20">
                  {selectedCluster.flag} Filtered to {selectedCluster.cityName}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedCluster(null)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground text-xs"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Interactive SVG World Map */}
          <WorldVectorMap
            users={exploreUsers}
            selectedClusterId={selectedCluster?.id || null}
            onSelectCluster={(cluster) => setSelectedCluster(cluster)}
          />

          {/* Selected Cluster People Preview */}
          {selectedCluster && (
            <div className="p-5 rounded-3xl border border-primary/30 bg-primary/5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <span className="text-lg">{selectedCluster.flag}</span>
                    <span>Members in {selectedCluster.cityName}, {selectedCluster.countryName}</span>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {filteredUsers.length} discoverable member{filteredUsers.length !== 1 ? "s" : ""} in this city cluster
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleTabChange("discover")}
                  className="text-xs rounded-xl gap-1.5"
                >
                  <span>View in Discover</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredUsers.slice(0, 3).map((u) => {
                  const isSent = hasSentRequestTo(u.id) || justSentId === u.id;
                  const isConnected = isConnectedWith(u.id);

                  return (
                    <div
                      key={u.id}
                      className="p-4 rounded-2xl bg-card border border-border/80 flex items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-full bg-gradient-to-br ${u.avatarBg} text-white font-bold text-xs flex items-center justify-center shrink-0`}
                        >
                          {u.displayName.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-foreground truncate">
                            {u.displayName}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            Speaks: {u.languagesSpoken.join(", ")}
                          </div>
                        </div>
                      </div>

                      {isConnected ? (
                        <span className="text-[10px] font-semibold text-emerald-500 px-2 py-1 bg-emerald-500/10 rounded-lg">
                          Connected
                        </span>
                      ) : isSent ? (
                        <span className="text-[10px] font-semibold text-muted-foreground px-2 py-1 bg-secondary rounded-lg">
                          Sent
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleOpenConnectModal(u)}
                          className="h-7 text-[11px] px-2.5 rounded-lg"
                        >
                          Connect
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 2: DISCOVER PEOPLE
         ══════════════════════════════════════════════════════ */}
      {activeTab === "discover" && (
        <div className="space-y-6">
          
          {/* Multi-Filter Search Card */}
          <div className="p-4 sm:p-5 rounded-3xl border border-border/80 bg-card space-y-4 shadow-xs">
            
            {/* Main Search Input */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, username, city, country, or bio keywords..."
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

            {/* Language Filter Dropdowns */}
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
                  <span>Target Partner Speaks</span>
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

            {/* Interest Tags Filter */}
            <div className="space-y-2 pt-1">
              <div className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Interests & Practice Topics</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {INTEREST_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedInterest(tag)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      selectedInterest === tag
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                        : "bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Member Cards Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Showing {filteredUsers.length} discoverable member{filteredUsers.length !== 1 ? "s" : ""}</span>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="p-12 text-center rounded-3xl border border-dashed border-border/80 bg-card space-y-3">
                <Users className="w-10 h-10 mx-auto text-muted-foreground" />
                <h3 className="text-base font-bold text-foreground">No members match current filters</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Try clearing some filters or searching for another language to discover more global language partners.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedCluster(null);
                    setSearchQuery("");
                    setTargetLangFilter("Any Language");
                    setTheySpeakFilter("Any Language");
                    setOnlyOnline(false);
                    setSelectedInterest("All");
                  }}
                  className="text-xs rounded-xl"
                >
                  Reset All Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUsers.map((member) => {
                  const isSent = hasSentRequestTo(member.id) || justSentId === member.id;
                  const isConnected = isConnectedWith(member.id);

                  return (
                    <div
                      key={member.id}
                      className="p-5 rounded-3xl border border-border/80 bg-card shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between group"
                    >
                      <div className="space-y-3">
                        
                        {/* Top: Location & Online Status */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                            <span className="text-base">{member.countryFlag}</span>
                            <span>{member.city}, {member.country}</span>
                          </span>

                          <span className="inline-flex items-center gap-1 text-[11px] font-mono">
                            {member.online ? (
                              <span className="text-emerald-500 font-semibold flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                Online
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Available</span>
                            )}
                          </span>
                        </div>

                        {/* Avatar & Identity */}
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div
                              className={`w-12 h-12 rounded-full bg-gradient-to-br ${member.avatarBg} text-white font-bold text-sm flex items-center justify-center shadow-xs`}
                            >
                              {member.displayName.substring(0, 2).toUpperCase()}
                            </div>
                            {member.online && (
                              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-base text-foreground leading-tight truncate">
                              {member.displayName}
                            </h3>
                            <p className="text-xs text-muted-foreground font-mono truncate">
                              @{member.username}
                            </p>
                          </div>
                        </div>

                        {/* Languages Spoken & Learning */}
                        <div className="space-y-1 p-2.5 rounded-xl bg-secondary/30 text-xs">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-muted-foreground">Speaks:</span>
                            <span className="font-semibold text-foreground truncate max-w-[65%]">
                              {member.languagesSpoken.join(", ")}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-muted-foreground">Learning:</span>
                            <span className="font-semibold text-primary truncate max-w-[65%]">
                              {member.languagesLearning.length > 0
                                ? member.languagesLearning.join(", ")
                                : "Open to exchange"}
                            </span>
                          </div>
                        </div>

                        {/* Interests Tags */}
                        {member.interests.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {member.interests.map((interest) => (
                              <span
                                key={interest}
                                className="px-2 py-0.5 rounded-md bg-secondary/60 text-[10px] text-muted-foreground font-medium"
                              >
                                #{interest}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Bio */}
                        {member.bio && (
                          <p className="text-xs text-muted-foreground italic line-clamp-2">
                            &quot;{member.bio}&quot;
                          </p>
                        )}

                      </div>

                      {/* Connect Button */}
                      <div className="pt-4">
                        {isConnected ? (
                          <Button
                            size="sm"
                            onClick={() => {
                              const f = connections.find((c) => c.userId === member.id);
                              if (f) handleOpenChatWithFriend(f);
                            }}
                            className="w-full text-xs font-semibold rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Message Friend</span>
                          </Button>
                        ) : isSent ? (
                          <Button
                            size="sm"
                            disabled
                            variant="secondary"
                            className="w-full text-xs font-semibold rounded-xl gap-2 opacity-80 cursor-default"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Invitation Sent</span>
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleOpenConnectModal(member)}
                            className="w-full text-xs font-semibold rounded-xl gap-2 shadow-xs group-hover:shadow-md group-hover:shadow-primary/20 transition-all"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Connect</span>
                          </Button>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 3: LANGUAGE MATCH (RECIPROCAL EXCHANGE ENGINE)
         ══════════════════════════════════════════════════════ */}
      {activeTab === "match" && (
        <div className="space-y-6">
          
          {/* Reciprocal Language Matching Control Bar */}
          <div className="p-5 sm:p-6 rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-primary/5 space-y-4 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-2 border-b border-border/50">
              <div>
                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Languages className="w-4 h-4 text-muted-foreground" />
                  <span>Reciprocal Language Partner Matching</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Pair up with international speakers for tandem practice: you teach your language, they teach theirs.
                </p>
              </div>
            </div>

            {/* Language Pair Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5 p-3.5 rounded-2xl bg-secondary/40 border border-border/60">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>I Speak / Can Teach:</span>
                  <span className="text-[10px] text-muted-foreground font-mono">Your Native Language</span>
                </label>
                <select
                  value={myTeachLang}
                  onChange={(e) => setMyTeachLang(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-border/80 bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring font-medium cursor-pointer"
                >
                  {LANGUAGE_OPTIONS.filter((l) => l !== "Any Language").map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 p-3.5 rounded-2xl bg-secondary/40 border border-border/60">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>I Want to Practice / Learn:</span>
                  <span className="text-[10px] text-muted-foreground font-mono font-medium">Target Goal</span>
                </label>
                <select
                  value={myLearnLang}
                  onChange={(e) => setMyLearnLang(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-border/80 bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring font-medium cursor-pointer"
                >
                  {LANGUAGE_OPTIONS.filter((l) => l !== "Any Language").map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Matched Partners List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Showing top reciprocal matches for <strong>{myTeachLang} ↔ {myLearnLang}</strong>
              </span>
              <span className="font-mono text-primary font-semibold">
                {matchedUsers.filter((u) => u.isPerfectReciprocal).length} Perfect Matches
              </span>
            </div>

            {matchedUsers.length === 0 ? (
              <div className="p-12 text-center rounded-3xl border border-dashed border-border/80 bg-card space-y-2">
                <Languages className="w-10 h-10 mx-auto text-muted-foreground" />
                <h3 className="text-base font-semibold text-foreground">No reciprocal matches found yet</h3>
                <p className="text-xs text-muted-foreground">
                  Try adjusting the language pair or exploring new members in Discover.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matchedUsers.map((match) => {
                  const isSent = hasSentRequestTo(match.id) || justSentId === match.id;
                  const isConnected = isConnectedWith(match.id);

                  return (
                    <div
                      key={match.id}
                      className="p-5 rounded-3xl border border-border/80 bg-card hover:border-border transition-all flex flex-col justify-between gap-4 shadow-xs"
                    >
                      <div className="space-y-3">
                        
                        {/* Match Header with Score */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                            <span className="text-base">{match.countryFlag}</span>
                            <span>{match.city}, {match.country}</span>
                          </span>

                          <div className="flex items-center gap-1.5">
                            <span className="px-2.5 py-0.5 rounded-full bg-secondary text-foreground text-xs font-semibold font-mono">
                              {match.dynamicScore}% Match
                            </span>
                          </div>
                        </div>

                        {/* Profile Info */}
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div
                              className={`w-12 h-12 rounded-full bg-gradient-to-br ${match.avatarBg} text-white font-bold text-sm flex items-center justify-center shadow-xs`}
                            >
                              {match.displayName.substring(0, 2).toUpperCase()}
                            </div>
                            {match.online && (
                              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-base text-foreground leading-tight truncate">
                              {match.displayName}
                            </h3>
                            <p className="text-xs text-muted-foreground font-mono truncate">
                              @{match.username}
                            </p>
                          </div>
                        </div>

                        {/* Match Reason Banner */}
                        <div className="p-3 rounded-2xl bg-secondary/50 border border-border/60 text-xs">
                          <div className="font-semibold text-foreground flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span className="truncate">{match.dynamicReason}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-2 pt-1.5 border-t border-border/40">
                            <span>Speaks: <strong className="text-foreground">{match.languagesSpoken.join(", ")}</strong></span>
                            <span>Learning: <strong className="text-primary">{match.languagesLearning.join(", ")}</strong></span>
                          </div>
                        </div>

                        {/* Shared Interests */}
                        {match.sharedInterests && match.sharedInterests.length > 0 && (
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 flex-wrap">
                            <span>Shared interests:</span>
                            {match.sharedInterests.map((interest) => (
                              <span
                                key={interest}
                                className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-semibold"
                              >
                                #{interest}
                              </span>
                            ))}
                          </div>
                        )}

                        {match.bio && (
                          <p className="text-xs text-muted-foreground italic line-clamp-2">
                            &quot;{match.bio}&quot;
                          </p>
                        )}

                      </div>

                      {/* Action */}
                      <div>
                        {isConnected ? (
                          <Button
                            size="sm"
                            onClick={() => {
                              const f = connections.find((c) => c.userId === match.id);
                              if (f) handleOpenChatWithFriend(f);
                            }}
                            className="w-full text-xs font-semibold rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Message Partner</span>
                          </Button>
                        ) : isSent ? (
                          <Button
                            size="sm"
                            disabled
                            variant="secondary"
                            className="w-full text-xs font-semibold rounded-xl gap-2 opacity-80 cursor-default"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Request Sent</span>
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() =>
                              handleOpenConnectModal(
                                match,
                                `Hi ${match.displayName}! I noticed we'd make a great reciprocal language exchange (${myTeachLang} ↔ ${myLearnLang}). Would love to connect and practice together!`
                              )
                            }
                            className="w-full text-xs font-semibold rounded-xl gap-2 shadow-xs shadow-primary/25"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Connect for Tandem Exchange</span>
                          </Button>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 4: CONNECTION REQUESTS (INCOMING & OUTGOING)
         ══════════════════════════════════════════════════════ */}
      {activeTab === "requests" && (
        <div className="space-y-6">
          
          {/* Sub-Tabs: Incoming vs Outgoing */}
          <div className="flex rounded-2xl bg-secondary/60 p-1.5 border border-border/70 text-xs font-medium max-w-sm">
            <button
              type="button"
              onClick={() => setRequestsSubTab("incoming")}
              className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                requestsSubTab === "incoming"
                  ? "bg-card text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Incoming Invitations</span>
              {incomingRequests.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-primary text-primary-foreground text-[10px] font-bold font-mono">
                  {incomingRequests.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setRequestsSubTab("outgoing")}
              className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                requestsSubTab === "outgoing"
                  ? "bg-card text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Sent by You</span>
              <span className="px-1.5 py-0.2 rounded-full bg-secondary text-muted-foreground text-[10px] font-mono">
                {outgoingRequests.length}
              </span>
            </button>
          </div>

          {/* Incoming Sub-Tab */}
          {requestsSubTab === "incoming" && (
            <div className="space-y-4">
              <div className="text-xs text-muted-foreground">
                Review connection invitations from international members before unlocking translated 1-to-1 chats.
              </div>

              {incomingRequests.length === 0 ? (
                <div className="p-12 text-center rounded-3xl border border-dashed border-border/80 bg-card space-y-2">
                  <UserCheck className="w-10 h-10 mx-auto text-muted-foreground" />
                  <h3 className="text-base font-bold text-foreground">No pending invitations</h3>
                  <p className="text-xs text-muted-foreground">
                    You have reviewed all incoming connection requests.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {incomingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-5 rounded-3xl border border-border/80 bg-card shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        <div
                          className={`w-12 h-12 rounded-full bg-gradient-to-br ${req.avatarBg} text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs`}
                        >
                          {req.displayName.substring(0, 2).toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-foreground truncate">
                              {req.displayName}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono">
                              @{req.username}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              • {req.countryFlag} {req.city}, {req.country}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono ml-auto">
                              {req.sentAt}
                            </span>
                          </div>

                          {/* Personal Note */}
                          <div className="p-3 rounded-xl bg-secondary/40 border border-border/50 text-xs text-foreground italic">
                            &quot;{req.note}&quot;
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                            <span>Speaks: <strong className="text-foreground">{req.languagesSpoken.join(", ")}</strong></span>
                            <span>•</span>
                            <span>Learning: <strong className="text-primary">{req.languagesLearning.join(", ")}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons: Accept / Decline / Block */}
                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                        <Button
                          size="sm"
                          onClick={() => acceptConnectionRequest(req.id)}
                          className="text-xs font-semibold rounded-xl gap-1.5 shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => declineConnectionRequest(req.id)}
                          className="text-xs font-semibold rounded-xl text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Decline</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => blockConnectionUser(req.id)}
                          title="Block user"
                          className="text-xs rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 px-2.5"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Outgoing Sub-Tab */}
          {requestsSubTab === "outgoing" && (
            <div className="space-y-4">
              <div className="text-xs text-muted-foreground">
                Invitations you have sent that are currently awaiting the recipient&apos;s response.
              </div>

              {outgoingRequests.length === 0 ? (
                <div className="p-12 text-center rounded-3xl border border-dashed border-border/80 bg-card space-y-2">
                  <Send className="w-10 h-10 mx-auto text-muted-foreground" />
                  <h3 className="text-base font-bold text-foreground">No pending outgoing requests</h3>
                  <p className="text-xs text-muted-foreground">
                    Browse the map or discover section to send connection requests to international language partners.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {outgoingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-5 rounded-3xl border border-border/80 bg-card shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div
                          className={`w-12 h-12 rounded-full bg-gradient-to-br ${req.avatarBg} text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs`}
                        >
                          {req.displayName.substring(0, 2).toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground">
                              {req.displayName}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono">
                              @{req.username}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              • {req.countryFlag} {req.city}
                            </span>
                          </div>

                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            Note: &quot;{req.note}&quot;
                          </p>

                          <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground font-mono">
                            <Clock className="w-3 h-3 text-amber-500" />
                            <span>Sent {req.sentAt} • Awaiting acceptance</span>
                          </div>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => cancelConnectionRequest(req.id)}
                        className="text-xs font-semibold rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                      >
                        Cancel Request
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 5: MY CONNECTIONS (VERIFIED PARTNERS)
         ══════════════════════════════════════════════════════ */}
      {activeTab === "connections" && (
        <div className="space-y-6">
          
          {/* Top Bar: Search & Friend Count */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={connectionSearch}
                onChange={(e) => setConnectionSearch(e.target.value)}
                placeholder="Search your connections by name, language, or city..."
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-border/80 bg-card text-foreground placeholder:text-muted-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="text-xs text-muted-foreground">
              Connected friends can exchange real-time auto-translated messages.
            </div>
          </div>

          {filteredConnections.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-dashed border-border/80 bg-card space-y-3">
              <div className="w-12 h-12 rounded-full bg-secondary mx-auto flex items-center justify-center text-muted-foreground">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                {connections.length === 0 ? "No active connections yet" : "No matching connections found"}
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {connections.length === 0
                  ? "Explore the global map or Discover People to connect with verified language partners."
                  : "Try clearing your search query to see all your connections."}
              </p>
              {connections.length === 0 && (
                <Button
                  size="sm"
                  onClick={() => handleTabChange("discover")}
                  className="text-xs rounded-xl mt-2"
                >
                  Discover People
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredConnections.map((friend) => (
                <div
                  key={friend.id}
                  className="p-5 rounded-3xl border border-border/80 bg-card shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Flag & Status */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                        <span className="text-base">{friend.countryFlag}</span>
                        <span>{friend.city}, {friend.country}</span>
                      </span>

                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
                        {friend.online ? (
                          <span className="text-emerald-500 font-semibold flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Online
                          </span>
                        ) : (
                          friend.lastActive
                        )}
                      </span>
                    </div>

                    {/* Avatar & Name */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative">
                        <div
                          className={`w-12 h-12 rounded-full bg-gradient-to-br ${friend.avatarBg} text-white font-bold text-sm flex items-center justify-center shadow-xs`}
                        >
                          {friend.displayName.substring(0, 2).toUpperCase()}
                        </div>
                        {friend.online && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-base text-foreground leading-tight truncate">
                          {friend.displayName}
                        </h3>
                        <p className="text-xs text-muted-foreground font-mono truncate">
                          @{friend.username}
                        </p>
                      </div>
                    </div>

                    {/* Languages */}
                    <div className="space-y-1 p-2.5 rounded-xl bg-secondary/30 text-xs mb-4">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">Speaks:</span>
                        <span className="font-semibold text-foreground truncate max-w-[65%]">
                          {friend.languagesSpoken.join(", ")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">Learning:</span>
                        <span className="font-semibold text-primary truncate max-w-[65%]">
                          {friend.languagesLearning.length > 0
                            ? friend.languagesLearning.join(", ")
                            : "Open to exchange"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Open Conversation Button */}
                  <Button
                    size="sm"
                    onClick={() => handleOpenChatWithFriend(friend)}
                    className="w-full text-xs font-semibold rounded-xl gap-2 shadow-xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Open Conversation</span>
                  </Button>

                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* 4. Connect with Custom Note Modal */}
      <AnimatePresence>
        {selectedUserForNote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-card border border-border/80 rounded-3xl p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full bg-gradient-to-br ${selectedUserForNote.avatarBg} text-white font-bold text-xs flex items-center justify-center`}
                  >
                    {selectedUserForNote.displayName.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      Connect with {selectedUserForNote.displayName}
                    </h3>
                    <p className="text-xs text-muted-foreground font-mono">
                      @{selectedUserForNote.username} • {selectedUserForNote.countryFlag} {selectedUserForNote.city}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedUserForNote(null)}
                  className="p-1 rounded-xl text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Personal Introduction Note</span>
                  <span className="text-[10px] text-muted-foreground">
                    {personalNote.length}/180 chars
                  </span>
                </label>
                <textarea
                  rows={3}
                  maxLength={180}
                  value={personalNote}
                  onChange={(e) => setPersonalNote(e.target.value)}
                  placeholder="Introduce yourself and what languages you want to practice together..."
                  className="w-full p-3 rounded-xl border border-border bg-secondary/30 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-secondary/40 border border-border/50 text-[11px] text-muted-foreground space-y-1">
                <div className="font-semibold text-foreground">Languages Reciprocity</div>
                <div>Speaks: {selectedUserForNote.languagesSpoken.join(", ")}</div>
                <div>Learning: {selectedUserForNote.languagesLearning.join(", ") || "Any"}</div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedUserForNote(null)}
                  className="text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleConfirmSendRequest}
                  className="text-xs rounded-xl gap-1.5 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Request</span>
                </Button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
