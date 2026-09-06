import { redirect } from "next/navigation";

export default function ConnectionsPage() {
  redirect("/explore?tab=connections");
}
