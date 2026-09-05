import { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { ConnectionsViewFull } from "@/components/connections/connections-view-full";

export const metadata: Metadata = {
  title: "Connections — PlexoChat",
  description: "Manage your accepted international language partners and connection requests.",
};

export default function ConnectionsPage() {
  return (
    <AppShell>
      <ConnectionsViewFull />
    </AppShell>
  );
}
