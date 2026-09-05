"use client";

/**
 * Screen 1: Welcome Page
 * Lineage & Design Source: 21st.dev minimal SaaS auth-entry and messenger welcome patterns
 * Features:
 * - PlexoChat logo & wordmark
 * - One-line value proposition: "Chat naturally. We handle the translation."
 * - Dual primary action buttons: "Create Account" & "Log In"
 * - Multilingual script-morphing interactive demo motif
 * - Honest trust signal: "End-to-end encrypted • Private by design"
 * - Interface chrome language selector
 * - Complete states: default, checking_session (loading skeleton), and session_found (redirect)
 */
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, 
  ArrowRight, 
  LogIn, 
  UserPlus, 
  Loader2, 
  CheckCircle2, 
  MessageSquareShare,
  SlidersHorizontal 
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageSelector } from "@/components/welcome/language-selector";
import { MultilingualHeroMotif } from "@/components/welcome/multilingual-hero-motif";
import { useAuth } from "@/lib/auth-context";

type WelcomeState = "default" | "checking_session" | "session_found";

export function WelcomeScreen() {
  const { user, isAuthenticated } = useAuth();
  const [chromeLang, setChromeLang] = useState<string>("en");
  const [screenState, setScreenState] = useState<WelcomeState>(
    isAuthenticated ? "session_found" : "default"
  );
  const [showStateDevBar, setShowStateDevBar] = useState<boolean>(false);

  // Sync state if user logs in
  React.useEffect(() => {
    if (isAuthenticated) {
      setScreenState("session_found");
    }
  }, [isAuthenticated]);

  // Internationalized copy for welcome screen
  const copy: Record<string, {
    valProp: string;
    subtext: string;
    createAccount: string;
    login: string;
    trustSignal: string;
    trustDetail: string;
    sessionGreeting: string;
    continueToChat: string;
    checking: string;
  }> = {
    en: {
      valProp: "Chat naturally. We handle the translation.",
      subtext: "1-to-1 private messaging with automatic real-time translation. Write in your native language, mix scripts, use slang — your conversation partner reads everything in theirs.",
      createAccount: "Create Account",
      login: "Log In",
      trustSignal: "End-to-end encrypted • Private by design",
      trustDetail: "Client-side translation. The server never reads your messages or photos.",
      sessionGreeting: "Welcome back",
      continueToChat: "Continue to Chats",
      checking: "Checking existing session...",
    },
    bn: {
      valProp: "স্বাভাবিকভাবে কথা বলুন। অনুবাদ আমরা করব।",
      subtext: "স্বয়ংক্রিয় রিয়েল-টাইম অনুবাদসহ ১-অন-১ ব্যক্তিগত মেসেজিং। নিজের ভাষায় বা বাংলিশে লিখুন — অপর প্রান্তের বন্ধু তার নিজের ভাষায় পড়বেন।",
      createAccount: "অ্যাকাউন্ট তৈরি করুন",
      login: "লগ ইন",
      trustSignal: "এন্ড-টু-এন্ড এনক্রিপ্টেড • সুরক্ষায় বিশ্বস্ত",
      trustDetail: "ক্লায়েন্ট-সাইড অনুবাদ। সার্ভার কখনোই আপনার বার্তা বা ছবি পড়তে পারে না।",
      sessionGreeting: "স্বাগতম",
      continueToChat: "চ্যাটে যান",
      checking: "সেশন যাচাই করা হচ্ছে...",
    },
    de: {
      valProp: "Ganz natürlich chatten. Wir übernehmen die Übersetzung.",
      subtext: "Private 1-zu-1-Nachrichten mit automatischer Echtzeit-Übersetzung. Schreiben Sie ganz normal — Ihr Gesprächspartner liest alles in seiner Wunschsprache.",
      createAccount: "Konto erstellen",
      login: "Anmelden",
      trustSignal: "Ende-zu-Ende verschlüsselt • Datenschutz by Design",
      trustDetail: "Lokale Übersetzung. Der Server hat keinen Zugriff auf Klartextnachrichten oder Fotos.",
      sessionGreeting: "Willkommen zurück",
      continueToChat: "Weiter zu den Chats",
      checking: "Bestehende Sitzung wird geprüft...",
    },
    es: {
      valProp: "Habla con naturalidad. Nosotros nos encargamos de traducir.",
      subtext: "Mensajería privada 1 a 1 con traducción automática en tiempo real. Escribe en tu idioma, tu contacto lo leerá en el suyo.",
      createAccount: "Crear cuenta",
      login: "Iniciar sesión",
      trustSignal: "Cifrado de extremo a extremo • Privado por diseño",
      trustDetail: "Traducción en el cliente. El servidor nunca ve el texto ni las fotos.",
      sessionGreeting: "Bienvenido de nuevo",
      continueToChat: "Continuar a los chats",
      checking: "Comprobando sesión existente...",
    },
    fr: {
      valProp: "Discutez naturellement. Nous gérons la traduction.",
      subtext: "Messagerie privée 1-à-1 avec traduction automatique en temps réel. Écrivez dans votre langue, votre destinataire lit dans la sienne.",
      createAccount: "Créer un compte",
      login: "Se connecter",
      trustSignal: "Chiffré de bout en bout • Privé dès la conception",
      trustDetail: "Traduction côté client. Le serveur ne lit jamais vos messages ni vos photos.",
      sessionGreeting: "Bon retour",
      continueToChat: "Accéder aux conversations",
      checking: "Vérification de la session en cours...",
    },
  };

  const currentCopy = copy[chromeLang] || copy.en;

  return (
    <div className="min-h-screen flex flex-col justify-between bg-background bg-mesh-gradient text-foreground relative selection:bg-primary/20 selection:text-primary">
      {/* Top utility navigation bar */}
      <header className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between z-20">
        {/* Brand identity */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 relative flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="PlexoChat Logo"
              width={40}
              height={40}
              className="w-10 h-10 object-contain drop-shadow-md"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-foreground flex items-center gap-1.5">
              PlexoChat
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
            </span>
          </div>
        </div>

        {/* Right side controls: Language selector & Theme toggle */}
        <div className="flex items-center gap-2">
          <LanguageSelector
            currentLanguage={chromeLang}
            onLanguageChange={setChromeLang}
          />
          <ThemeToggle />
          <button
            onClick={() => setShowStateDevBar(!showStateDevBar)}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Toggle state preview bar (Demo/Dev)"
            aria-label="Toggle state preview bar"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Optional state switcher for testing & review */}
      {showStateDevBar && (
        <div className="w-full bg-secondary/80 border-y border-border py-2 px-4 z-30 flex items-center justify-center gap-2 text-xs">
          <span className="font-semibold text-muted-foreground">Screen State:</span>
          {(["default", "checking_session", "session_found"] as WelcomeState[]).map((st) => (
            <button
              key={st}
              onClick={() => setScreenState(st)}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                screenState === st
                  ? "bg-primary text-primary-foreground font-medium"
                  : "bg-background text-foreground hover:bg-secondary"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      )}

      {/* Main welcome content container */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12 z-10">
        <div className="w-full max-w-lg mx-auto flex flex-col items-center text-center">
          
          <AnimatePresence mode="wait">
            {/* STATE: CHECKING SESSION */}
            {screenState === "checking_session" && (
              <motion.div
                key="checking"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full rounded-3xl border border-border bg-card/60 backdrop-blur-lg p-8 sm:p-12 shadow-xl flex flex-col items-center space-y-4"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">
                  {currentCopy.checking}
                </h2>
                <div className="w-48 h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Verifying cryptographic device keys securely in your browser...
                </p>
              </motion.div>
            )}

            {/* STATE: SESSION FOUND (REDIRECT) */}
            {screenState === "session_found" && (
              <motion.div
                key="session_found"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full rounded-3xl border border-emerald-500/20 bg-card/70 backdrop-blur-xl p-8 sm:p-10 shadow-xl flex flex-col items-center space-y-5"
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 ring-4 ring-emerald-500/5">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <Badge variant="success" className="mb-2">
                    Active Session Detected
                  </Badge>
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    {user?.displayName
                      ? `Welcome back, ${user.displayName}`
                      : currentCopy.sessionGreeting}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Your local encryption keys are loaded and ready.
                  </p>
                </div>

                <div className="w-full pt-2">
                  <Link href="/chats" className="w-full block">
                    <Button size="lg" className="w-full gap-2 text-base">
                      <span>{currentCopy.continueToChat}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>

                <button
                  type="button"
                  onClick={() => setScreenState("default")}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Use a different account or sign out
                </button>
              </motion.div>
            )}

            {/* STATE: DEFAULT WELCOME HERO */}
            {screenState === "default" && (
              <motion.div
                key="default"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="w-full flex flex-col items-center"
              >
                {/* Product Badge */}
                <motion.div 
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mb-4"
                >
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    Private Multilingual Messenger
                  </span>
                </motion.div>

                {/* Primary Value Proposition Headline */}
                <h1 className="text-3xl sm:text-4xl md:text-[2.65rem] font-extrabold tracking-tight leading-[1.18] text-foreground max-w-md">
                  {currentCopy.valProp}
                </h1>

                {/* Subheading */}
                <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-sm sm:max-w-md font-normal">
                  {currentCopy.subtext}
                </p>

                {/* Interactive Script-Morphing Motif */}
                <MultilingualHeroMotif />

                {/* Dual Primary Call-to-Actions (21st.dev dual CTA pattern) */}
                <div className="w-full max-w-sm flex flex-col gap-3 mt-2">
                  <Link href="/signup" className="w-full">
                    <Button 
                      size="lg" 
                      className="w-full gap-2.5 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all"
                    >
                      <UserPlus className="w-5 h-5" />
                      <span>{currentCopy.createAccount}</span>
                      <ArrowRight className="w-4 h-4 ml-auto" />
                    </Button>
                  </Link>

                  <Link href="/login" className="w-full">
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="w-full gap-2 text-base font-medium border-border/80 hover:bg-secondary hover:text-foreground"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>{currentCopy.login}</span>
                    </Button>
                  </Link>
                </div>

                {/* Honest Trust Signals (Non-negotiable PRD Rule: No "100% secure" overclaims) */}
                <div className="mt-8 pt-6 border-t border-border/60 w-full max-w-sm flex flex-col items-center text-center space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-foreground/90">
                    <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                    <span>{currentCopy.trustSignal}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-normal">
                    {currentCopy.trustDetail}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>

      {/* Minimal clean footer */}
      <footer className="w-full max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-muted-foreground border-t border-border/30 gap-2 z-10">
        <div>
          © {new Date().getFullYear()} PlexoChat. All rights reserved.
        </div>
        <div className="flex items-center gap-4">
          <Link href="/security" className="hover:text-foreground transition-colors">
            Security & Trust
          </Link>
          <Link href="/license" className="hover:text-foreground transition-colors">
            License
          </Link>
          <Link href="/trademark" className="hover:text-foreground transition-colors">
            Trademark
          </Link>
        </div>
      </footer>
    </div>
  );
}
