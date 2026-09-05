import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth-context";
import { ConnectionsProvider } from "@/lib/connections-context";
import { ChatProvider } from "@/lib/chat-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PlexoChat — Private Multilingual Messenger",
  description: "Chat naturally. We handle the translation. Private, 1-to-1 end-to-end encrypted messaging.",
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png" },
      { url: "/icon.png", type: "image/png" },
    ],
    shortcut: "/logo.png",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-200">
        <ThemeProvider defaultTheme="dark" storageKey="plexochat-theme">
          <AuthProvider>
            <ConnectionsProvider>
              <ChatProvider>{children}</ChatProvider>
            </ConnectionsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
