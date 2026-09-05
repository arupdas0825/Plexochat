"use client";

/**
 * Design Source: 21st.dev registration flow with language personalization and Firebase Auth
 * Features:
 * - Google 1-click registration
 * - Display Name, Email & Username fields
 * - Preferred Receiving Language selector (core product rule)
 * - Auto-generated PlexoChat ID preview
 * - Client-side cryptographic key generation indicator
 */
import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Loader2, ArrowRight, ShieldCheck, Languages, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth, SUPPORTED_LANGUAGES, getFirebaseErrorMessage } from "@/lib/auth-context";

interface SignupFormProps {
  onSuccess?: () => void;
  onSwitchToLogin: () => void;
}

export function SignupForm({ onSuccess, onSwitchToLogin }: SignupFormProps) {
  const { signup, loginWithGoogle, isLoading } = useAuth();
  
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState(SUPPORTED_LANGUAGES[0]);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generated ID preview for user delight (initialized deterministically to prevent SSR hydration mismatch)
  const [generatedId, setGeneratedId] = useState("PX-8921-X");

  useEffect(() => {
    queueMicrotask(() => {
      setGeneratedId("PX-" + Math.floor(1000 + Math.random() * 9000) + "-X");
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!displayName.trim()) {
      setError("Please provide your display name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please provide a valid email address.");
      return;
    }
    if (!username.trim()) {
      setError("Please choose a unique username.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      await signup({
        displayName: displayName.trim(),
        username: username.trim(),
        email: email.trim().toLowerCase(),
        preferredReceivingLanguage: selectedLanguage.code,
        preferredLanguageName: selectedLanguage.name,
        password,
      });
      onSuccess?.();
    } catch (err) {
      setError(getFirebaseErrorMessage(err));
    }
  };

  const handleGoogleSignUp = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
      onSuccess?.();
    } catch (err) {
      setError(getFirebaseErrorMessage(err));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs leading-relaxed animate-in fade-in duration-150">
          {error}
        </div>
      )}

      {/* Google Quick Sign-Up */}
      <Button
        type="button"
        variant="outline"
        disabled={isLoading || isGoogleLoading}
        onClick={handleGoogleSignUp}
        className="w-full h-11 bg-background hover:bg-secondary/60 border-border text-foreground text-sm font-medium gap-2.5 transition-all shadow-sm"
      >
        {isGoogleLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
        ) : (
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
        )}
        <span>Sign up with Google</span>
      </Button>

      {/* Divider */}
      <div className="relative my-3">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-[11px] uppercase">
          <span className="bg-card px-2 text-muted-foreground font-medium">
            or register with email
          </span>
        </div>
      </div>

      {/* Display Name */}
      <div className="space-y-1.5 text-left">
        <label
          htmlFor="signup-name"
          className="text-xs font-semibold text-foreground"
        >
          Display Name
        </label>
        <input
          id="signup-name"
          type="text"
          required
          autoComplete="name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="e.g. Elena Rostova"
          className="w-full h-11 px-3.5 rounded-xl border border-border bg-background/70 text-foreground placeholder:text-muted-foreground text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
        />
      </div>

      {/* Email Address */}
      <div className="space-y-1.5 text-left">
        <label
          htmlFor="signup-email"
          className="text-xs font-semibold text-foreground"
        >
          Email Address
        </label>
        <div className="relative">
          <input
            id="signup-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="elena@example.com"
            className="w-full h-11 px-3.5 pr-10 rounded-xl border border-border bg-background/70 text-foreground placeholder:text-muted-foreground text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            <Mail className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Username & Auto-assigned PlexoChat ID preview */}
      <div className="space-y-1.5 text-left">
        <div className="flex items-center justify-between">
          <label
            htmlFor="signup-username"
            className="text-xs font-semibold text-foreground"
          >
            Unique Username
          </label>
          <span className="text-[10px] text-muted-foreground font-mono">
            Assigned ID: <strong className="text-primary" suppressHydrationWarning>{generatedId}</strong>
          </span>
        </div>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-semibold">
            @
          </span>
          <input
            id="signup-username"
            type="text"
            required
            autoComplete="username"
            value={username}
            onChange={(e) =>
              setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
            }
            placeholder="username"
            className="w-full h-11 pl-8 pr-3.5 rounded-xl border border-border bg-background/70 text-foreground placeholder:text-muted-foreground text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent font-mono"
          />
        </div>
      </div>

      {/* Preferred Receiving Language (Core Personalization Rule) */}
      <div className="space-y-1.5 text-left">
        <label
          htmlFor="signup-language"
          className="text-xs font-semibold text-foreground flex items-center justify-between"
        >
          <span className="flex items-center gap-1.5">
            <Languages className="w-3.5 h-3.5 text-primary" />
            <span>Preferred Receiving Language</span>
          </span>
          <Badge variant="accent" className="text-[10px] py-0 px-1.5 font-normal">
            Core Setting
          </Badge>
        </label>

        <select
          id="signup-language"
          value={selectedLanguage.code}
          onChange={(e) => {
            const found = SUPPORTED_LANGUAGES.find(
              (l) => l.code === e.target.value
            );
            if (found) setSelectedLanguage(found);
          }}
          className="w-full h-11 px-3 rounded-xl border border-border bg-background/70 text-foreground text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent cursor-pointer"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.flag} {lang.name}
            </option>
          ))}
        </select>
        <p className="text-[11px] text-muted-foreground leading-tight">
          All incoming messages from your contacts will be translated into this language.
        </p>
      </div>

      {/* Password */}
      <div className="space-y-1.5 text-left">
        <label
          htmlFor="signup-password"
          className="text-xs font-semibold text-foreground"
        >
          Password
        </label>
        <div className="relative">
          <input
            id="signup-password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 6 characters"
            className="w-full h-11 px-3.5 pr-10 rounded-xl border border-border bg-background/70 text-foreground placeholder:text-muted-foreground text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isLoading || isGoogleLoading}
        size="lg"
        className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/35 gap-2 mt-3"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Creating Firebase account...</span>
          </>
        ) : (
          <>
            <span>Create Free Account</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </Button>

      {/* Switch to Login */}
      <div className="pt-4 border-t border-border/60 text-center text-xs text-muted-foreground">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-semibold text-primary hover:underline focus:outline-none"
        >
          Sign in
        </button>
      </div>

      {/* Honest security notice */}
      <div className="pt-1 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        <span>Firebase Authenticated • Private keys generated locally</span>
      </div>
    </form>
  );
}
