import { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: "PlexoChat — Speak your language. They'll hear theirs.",
  description:
    "A private, end-to-end encrypted 1-to-1 multilingual messenger that translates conversations in real time into each person's preferred language. Free, web-based, and private by design.",
};

export default function Home() {
  return <LandingPage />;
}
