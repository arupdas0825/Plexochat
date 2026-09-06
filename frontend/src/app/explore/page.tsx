import { Metadata } from "next";
import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { ExploreWorldView } from "@/components/explore/explore-world-view";

export const metadata: Metadata = {
  title: "Explore & Connections — PlexoChat",
  description: "Discover language partners, explore the global world map, match language exchanges, and manage connection requests.",
};

export default function ExplorePage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="flex-1 flex items-center justify-center p-8 text-xs text-muted-foreground font-mono">Loading Explore Hub...</div>}>
        <ExploreWorldView />
      </Suspense>
    </AppShell>
  );
}
