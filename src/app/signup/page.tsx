import { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";

export const metadata: Metadata = {
  title: "Create Account — PlexoChat",
  description: "Create your free, private, end-to-end encrypted PlexoChat account.",
};

export default function SignupPage() {
  return <AuthCard initialMode="signup" />;
}
