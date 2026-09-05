"use client";

/**
 * Design Source: 21st.dev 3-column bento/feature card grid with hover elevation
 * Layout: Full-width container with responsive max-w-7xl 3-column desktop grid
 */
import React from "react";
import {
  Sparkles,
  ShieldCheck,
  UserCheck,
  Eye,
  Camera,
  Smartphone,
} from "lucide-react";

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  badgeText?: string;
}

const FEATURES: FeatureCardProps[] = [
  {
    icon: Sparkles,
    title: "Automatic Translation",
    description:
      "No manual translation buttons or copy-pasting. Every message is seamlessly presented in the recipient's chosen receiving language by default.",
    badgeText: "Always On",
  },
  {
    icon: ShieldCheck,
    title: "End-to-End Encryption",
    description:
      "All text messages and shared photos are encrypted directly on your device before network transmission. The relay server never sees plaintext.",
    badgeText: "Zero Plaintext",
  },
  {
    icon: UserCheck,
    title: "Private Connections",
    description:
      "Unsolicited messaging is impossible. Communication requires an explicit connection request and acceptance, completely eliminating spam.",
    badgeText: "Anti-Spam Model",
  },
  {
    icon: Eye,
    title: "Original Message Reveal",
    description:
      "The original message is never destroyed. Simply double-click, double-tap, or click 'View original' to inspect the exact source text.",
    badgeText: "Non-Destructive",
  },
  {
    icon: Camera,
    title: "Encrypted Photo Sharing",
    description:
      "Share private photos with client-side encryption. Images are converted into encrypted blobs that only your conversation partner can decrypt.",
    badgeText: "Photos Only",
  },
  {
    icon: Smartphone,
    title: "Responsive on Any Device",
    description:
      "Engineered specifically for web browsers. Enjoy a rich two-column desktop workspace or a smooth touch-optimized single-screen mobile layout.",
    badgeText: "Desktop & Mobile",
  },
];

export function FeatureGridSection() {
  return (
    <section id="features" className="w-full py-24 sm:py-32 bg-background relative border-b border-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary mb-3 block">
            Core Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
            Engineered for real conversation, built around your privacy.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground">
            PlexoChat focuses strictly on 1-to-1 private messaging without feed distractions, status updates, or unsolicited contact.
          </p>
        </div>

        {/* 3-Column Feature Grid on Desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group relative p-7 sm:p-8 rounded-3xl bg-card border border-border/80 shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:border-primary/40 hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Top row: Icon + optional badge */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200">
                      <Icon className="w-6 h-6" />
                    </div>
                    {feature.badgeText && (
                      <span className="text-[11px] font-medium font-mono text-muted-foreground bg-secondary/80 px-2.5 py-1 rounded-full border border-border/50">
                        {feature.badgeText}
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-foreground mb-3 tracking-tight">
                    {feature.title}
                  </h3>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-border/40 text-xs text-primary font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <span>Learn more</span>
                  <span>→</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
