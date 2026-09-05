"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile as updateFirebaseProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";

export interface UserProfile {
  id: string;
  email?: string;
  username: string;
  displayName: string;
  plexoChatId: string;
  preferredReceivingLanguage: string;
  preferredLanguageName: string;
  avatarUrl?: string;
  avatarBg?: string;
  city?: string;
  country?: string;
  countryFlag?: string;
  languagesSpoken: string[];
  languagesLearning: string[];
  interests: string[];
  bio?: string;
  isDiscoverable?: boolean;
  showApproximateLocation?: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password?: string) => Promise<boolean>;
  signup: (data: {
    displayName: string;
    username: string;
    email?: string;
    preferredReceivingLanguage: string;
    preferredLanguageName: string;
    password?: string;
  }) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  updateProfile: (partial: Partial<UserProfile>) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "bn", name: "Bengali (বাংলা)", flag: "🇧🇩" },
  { code: "de", name: "German (Deutsch)", flag: "🇩🇪" },
  { code: "es", name: "Spanish (Español)", flag: "🇪🇸" },
  { code: "fr", name: "French (Français)", flag: "🇫🇷" },
  { code: "ja", name: "Japanese (日本語)", flag: "🇯🇵" },
  { code: "ar", name: "Arabic (العربية)", flag: "🇸🇦" },
];

/**
 * Format Firebase Auth error codes into helpful user-facing error messages
 */
export function getFirebaseErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code || "";
  switch (code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/user-not-found":
      return "No user account was found with these credentials.";
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect credentials. Please verify your email/username and password.";
    case "auth/email-already-in-use":
      return "This email address is already registered. Please sign in instead.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/popup-closed-by-user":
      return "Google sign-in was cancelled before completing.";
    case "auth/popup-blocked":
      return "The popup was blocked by your browser. Please allow popups for this site.";
    case "auth/operation-not-allowed":
      return "This authentication method is currently disabled in your Firebase console. Please enable Email/Password and Google in Firebase Console > Authentication > Sign-in method.";
    case "auth/network-request-failed":
      return "Network error. Please check your internet connection and try again.";
    default:
      return (error as Error)?.message || "Authentication failed. Please try again.";
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const getRegisteredUsers = (): UserProfile[] => {
    try {
      const stored = typeof window !== "undefined" ? localStorage.getItem("plexochat_registered_users") : null;
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const saveRegisteredUser = (profile: UserProfile) => {
    if (typeof window === "undefined") return;
    const existing = getRegisteredUsers();
    const updated = [
      profile,
      ...existing.filter((u) => u.id !== profile.id && u.username !== profile.username),
    ];
    localStorage.setItem("plexochat_registered_users", JSON.stringify(updated));
  };

  // Sync with Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        const registered = getRegisteredUsers();
        let found = registered.find(
          (u) =>
            u.id === fbUser.uid ||
            (fbUser.email && u.email?.toLowerCase() === fbUser.email.toLowerCase())
        );

        if (!found) {
          const emailPrefix = fbUser.email
            ? fbUser.email.split("@")[0].replace(/[^a-z0-9_]/gi, "").toLowerCase()
            : "";
          const fallbackUsername = emailPrefix || "user_" + fbUser.uid.slice(0, 6);

          found = {
            id: fbUser.uid,
            email: fbUser.email || undefined,
            username: fallbackUsername,
            displayName: fbUser.displayName || fallbackUsername,
            plexoChatId: "PX-" + Math.floor(1000 + Math.random() * 9000) + "-G",
            preferredReceivingLanguage: "en",
            preferredLanguageName: "English",
            avatarUrl: fbUser.photoURL || undefined,
            avatarBg: "from-blue-600 to-indigo-600",
            languagesSpoken: ["English"],
            languagesLearning: [],
            interests: [],
            bio: "",
            city: "",
            country: "",
            isDiscoverable: true,
            showApproximateLocation: false,
          };
          saveRegisteredUser(found);
        } else {
          // Keep profile updated with latest Firebase provider metadata if available
          let changed = false;
          if (fbUser.photoURL && !found.avatarUrl) {
            found.avatarUrl = fbUser.photoURL;
            changed = true;
          }
          if (fbUser.displayName && (!found.displayName || found.displayName === found.username)) {
            found.displayName = fbUser.displayName;
            changed = true;
          }
          if (changed) {
            saveRegisteredUser(found);
          }
        }

        localStorage.setItem("plexochat_current_user", JSON.stringify(found));
        setUser(found);
      } else {
        localStorage.removeItem("plexochat_current_user");
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (identifierInput: string, password?: string): Promise<boolean> => {
    setIsLoading(true);
    const cleanInput = identifierInput.trim();

    try {
      let emailToUse = cleanInput;

      // If user typed a username instead of an email, look up their registered email or synthesize
      if (!cleanInput.includes("@")) {
        const cleanUsername = cleanInput.replace(/^@/, "").toLowerCase();
        const users = getRegisteredUsers();
        const matched = users.find(
          (u) =>
            u.username.toLowerCase() === cleanUsername ||
            u.plexoChatId.toLowerCase() === cleanUsername
        );

        if (matched?.email) {
          emailToUse = matched.email;
        } else {
          emailToUse = `${cleanUsername}@plexochat.app`;
        }
      }

      await signInWithEmailAndPassword(auth, emailToUse, password || "");
      setIsLoading(false);
      router.push("/home");
      return true;
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
  };

  const signup = async (data: {
    displayName: string;
    username: string;
    email?: string;
    preferredReceivingLanguage: string;
    preferredLanguageName: string;
    password?: string;
  }): Promise<boolean> => {
    setIsLoading(true);

    const cleanUsername = data.username.trim().replace(/^@/, "").toLowerCase();
    const emailToUse = data.email?.trim().toLowerCase() || `${cleanUsername}@plexochat.app`;
    const pwdToUse = data.password || "";

    try {
      const cred = await createUserWithEmailAndPassword(auth, emailToUse, pwdToUse);

      if (data.displayName.trim()) {
        await updateFirebaseProfile(cred.user, {
          displayName: data.displayName.trim(),
        });
      }

      const newUser: UserProfile = {
        id: cred.user.uid,
        email: emailToUse,
        username: cleanUsername,
        displayName: data.displayName.trim(),
        plexoChatId: "PX-" + Math.floor(1000 + Math.random() * 9000) + "-X",
        preferredReceivingLanguage: data.preferredReceivingLanguage,
        preferredLanguageName: data.preferredLanguageName,
        avatarBg: "from-blue-600 to-indigo-600",
        languagesSpoken: [data.preferredLanguageName],
        languagesLearning: [],
        interests: [],
        bio: "",
        city: "",
        country: "",
        isDiscoverable: true,
        showApproximateLocation: false,
      };

      saveRegisteredUser(newUser);
      localStorage.setItem("plexochat_current_user", JSON.stringify(newUser));
      setUser(newUser);
      setIsLoading(false);
      router.push("/home");
      return true;
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const fbUser = cred.user;

      const registered = getRegisteredUsers();
      let found = registered.find(
        (u) =>
          u.id === fbUser.uid ||
          (fbUser.email && u.email?.toLowerCase() === fbUser.email.toLowerCase())
      );

      if (!found) {
        const emailPrefix = fbUser.email
          ? fbUser.email.split("@")[0].replace(/[^a-z0-9_]/gi, "").toLowerCase()
          : "";
        const fallbackUsername = emailPrefix || "user_" + fbUser.uid.slice(0, 6);

        found = {
          id: fbUser.uid,
          email: fbUser.email || undefined,
          username: fallbackUsername,
          displayName: fbUser.displayName || fallbackUsername,
          plexoChatId: "PX-" + Math.floor(1000 + Math.random() * 9000) + "-G",
          preferredReceivingLanguage: "en",
          preferredLanguageName: "English",
          avatarUrl: fbUser.photoURL || undefined,
          avatarBg: "from-indigo-600 to-purple-600",
          languagesSpoken: ["English"],
          languagesLearning: [],
          interests: [],
          bio: "",
          city: "",
          country: "",
          isDiscoverable: true,
          showApproximateLocation: false,
        };
        saveRegisteredUser(found);
      }

      localStorage.setItem("plexochat_current_user", JSON.stringify(found));
      setUser(found);
      setIsLoading(false);
      router.push("/home");
      return true;
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
  };

  const updateProfile = async (partial: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...partial };
      localStorage.setItem("plexochat_current_user", JSON.stringify(updated));
      saveRegisteredUser(updated);
      return updated;
    });

    if (auth.currentUser && partial.displayName) {
      try {
        await updateFirebaseProfile(auth.currentUser, {
          displayName: partial.displayName,
        });
      } catch (err) {
        console.warn("Failed to update Firebase profile display name:", err);
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn("Firebase signout error:", err);
    } finally {
      localStorage.removeItem("plexochat_current_user");
      setUser(null);
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        loginWithGoogle,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
