import { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { SettingsPageView } from "@/components/settings/settings-page-view";

export const metadata: Metadata = {
  title: "Settings — PlexoChat",
  description: "Manage your profile, receiving language, and privacy settings.",
};

export default function SettingsPage() {
  return (
    <AppShell>
      <SettingsPageView />
    </AppShell>
  );
}
