import { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { ExploreWorldView } from "@/components/explore/explore-world-view";

export const metadata: Metadata = {
  title: "Explore World — PlexoChat",
  description: "Discover language partners and international connections on an interactive privacy-safe world map.",
};

export default function ExplorePage() {
  return (
    <AppShell>
      <ExploreWorldView />
    </AppShell>
  );
}
