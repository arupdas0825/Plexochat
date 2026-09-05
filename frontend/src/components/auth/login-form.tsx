"use client";

/**
 * Design Source: 21st.dev minimalist auth input form pattern
 * Features: Accessible labels, password reveal toggle, loading feedback, Google sign-in
 */
import React, { useState } from "react";
import { Eye, EyeOff, Loader2, ArrowRight, ShieldCheck, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, getFirebaseErrorMessage } from "@/lib/auth-context";

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToSignup: () => void;
}

export function LoginForm({ onSuccess, onSwitchToSignup }: LoginFormProps) {
  const { login, loginWithGoogle, isLoading } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim()) {
      setError("Please enter your email or username.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    try {
      await login(identifier, password);
      onSuccess?.();
    } catch (err) {
      setError(getFirebaseErrorMessage(err));
    }
  };

  const handleGoogleSignIn = async () => {
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

      {/* Google Sign-in Button */}
      <Button
        type="button"
        variant="outline"
        disabled={isLoading || isGoogleLoading}
        onClick={handleGoogleSignIn}
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
        <span>Continue with Google</span>
      </Button>

      {/* Divider */}
      <div className="relative my-3">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-[11px] uppercase">
          <span className="bg-card px-2 text-muted-foreground font-medium">
            or sign in with email
          </span>
        </div>
      </div>

      {/* Email / Username / PlexoChat ID input */}
      <div className="space-y-1.5 text-left">
        <label
          htmlFor="login-identifier"
          className="text-xs font-semibold text-foreground flex items-center justify-between"
        >
          <span>Email or Username</span>
          <span className="text-[11px] font-normal text-muted-foreground font-mono">
            e.g. you@email.com or @username
          </span>
        </label>
        <div className="relative">
          <input
            id="login-identifier"
            type="text"
            required
            autoComplete="username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="name@example.com or @username"
            className="w-full h-11 px-3.5 rounded-xl border border-border bg-background/70 text-foreground placeholder:text-muted-foreground text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            <Mail className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Password input */}
      <div className="space-y-1.5 text-left">
        <div className="flex items-center justify-between">
          <label
            htmlFor="login-password"
            className="text-xs font-semibold text-foreground"
          >
            Password
          </label>
          <button
            type="button"
            className="text-[11px] text-primary hover:underline"
            onClick={() => alert("Password reset requires your device recovery phrase or email link.")}
          >
            Forgot password?
          </button>
        </div>
        <div className="relative">
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
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
        className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/35 gap-2 mt-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Authenticating with Firebase...</span>
          </>
        ) : (
          <>
            <span>Log In to PlexoChat</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </Button>

      {/* Switch to Signup */}
      <div className="pt-4 border-t border-border/60 text-center text-xs text-muted-foreground">
        Don&apos;t have an account yet?{" "}
        <button
          type="button"
          onClick={onSwitchToSignup}
          className="font-semibold text-primary hover:underline focus:outline-none"
        >
          Create an account
        </button>
      </div>

      {/* Honest trust notice */}
      <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        <span>Firebase Authenticated • Private keys verified locally</span>
      </div>
    </form>
  );
}
