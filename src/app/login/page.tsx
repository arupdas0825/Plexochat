import { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";

export const metadata: Metadata = {
  title: "Log In — PlexoChat",
  description: "Sign in to your private, end-to-end encrypted PlexoChat account.",
};

export default function LoginPage() {
  return <AuthCard initialMode="login" />;
}
