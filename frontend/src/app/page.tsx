"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { LandingPage } from "@/components/landing/landing-page";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [hasCachedSession, setHasCachedSession] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        return !!localStorage.getItem("plexochat_current_user");
      } catch {
        return false;
      }
    }
    return false;
  });

  useEffect(() => {
    try {
      const cached = localStorage.getItem("plexochat_current_user");
      if (cached) {
        setHasCachedSession(true);
      }
    } catch {
      // ignore
    }
  }, []);

  // Redirect authenticated users to /home dashboard
  useEffect(() => {
    if (isAuthenticated || hasCachedSession) {
      router.replace("/home");
    }
  }, [isAuthenticated, hasCachedSession, router]);

  // If already authenticated or session is active, avoid flashing landing page
  if (isAuthenticated || hasCachedSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  return <LandingPage />;
}
