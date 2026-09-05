import { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { HomeDashboard } from "@/components/dashboard/home-dashboard";

export const metadata: Metadata = {
  title: "Dashboard — PlexoChat",
  description: "Your global multilingual communication overview and language exchange dashboard.",
};

export default function HomePage() {
  return (
    <AppShell>
      <HomeDashboard />
    </AppShell>
  );
}
