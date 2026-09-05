"use client";

/**
 * Screen 2: PlexoChat Public Marketing Landing Page
 * 
 * Layout Architecture:
 * - 100vw edge-to-edge full-bleed section backgrounds with responsive max-w-7xl content wrappers
 * - Asymmetrical 2-column split hero on desktop (lg:) with prominent interactive chat translation mockup
 * - High-contrast visual section rhythm:
 *   1. Hero with subtle ambient mesh gradient
 *   2. "How It Works" with distinct secondary tinted background
 *   3. 3-column Feature Grid on desktop with hover elevation
 *   4. "Security & Privacy" with contrasting deep dark aesthetic
 *   5. Social Proof / Real Stories 3-column showcase
 *   6. Final CTA band with ambient glow
 *   7. Full-bleed multi-column footer
 * 
 * Lineage: 21st.dev top SaaS marketing templates + shadcn/ui + Tailwind CSS
 */
import React from "react";
import { LandingNavbar } from "@/components/landing/navbar";
import { HeroSection } from "@/components/landing/hero-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { FeatureGridSection } from "@/components/landing/feature-grid-section";
import { SecuritySection } from "@/components/landing/security-section";
import { SocialProofSection } from "@/components/landing/social-proof-section";
import { FinalCtaSection } from "@/components/landing/final-cta-section";
import { LandingFooter } from "@/components/landing/footer";

export function LandingPage() {
  return (
    <div className="min-h-screen w-full flex flex-col bg-background text-foreground overflow-x-hidden selection:bg-primary/20 selection:text-primary">
      {/* Sticky Full-Width Navbar */}
      <LandingNavbar />

      {/* Main Sections */}
      <main className="flex-1 w-full flex flex-col">
        <HeroSection />
        <HowItWorksSection />
        <FeatureGridSection />
        <SecuritySection />
        <SocialProofSection />
        <FinalCtaSection />
      </main>

      {/* Multi-Column Full-Width Footer */}
      <LandingFooter />
    </div>
  );
}
