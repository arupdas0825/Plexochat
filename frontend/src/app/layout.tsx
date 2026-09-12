import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth-context";
import { ConnectionsProvider } from "@/lib/connections-context";
import { ChatProvider } from "@/lib/chat-context";
import { CallProvider } from "@/lib/call-context";
import { CallModal } from "@/components/chat/call-modal";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { PwaInstallPrompt } from "@/components/pwa/pwa-install-prompt";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#090a0f" },
    { media: "(prefers-color-scheme: light)", color: "#fbfbfd" },
  ],
};

export const metadata: Metadata = {
  title: "PlexoChat — Private Multilingual Messenger",
  description: "Chat naturally. We handle the translation. Private, 1-to-1 end-to-end encrypted messaging.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PlexoChat",
  },
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
              <ChatProvider>
                <CallProvider>
                  {children}
                  <CallModal />
                  <ServiceWorkerRegister />
                  <PwaInstallPrompt />
                </CallProvider>
              </ChatProvider>
            </ConnectionsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
