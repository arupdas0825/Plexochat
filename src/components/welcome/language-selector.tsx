"use client";

/**
 * Design Source: 21st.dev minimal dropdown & language switch pattern
 * Provides quick chrome UI language selection for the entry flow
 */
import React, { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown, Check } from "lucide-react";

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}

export const CHROME_LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "fr", name: "French", nativeName: "Français" },
];

interface LanguageSelectorProps {
  currentLanguage: string;
  onLanguageChange: (code: string) => void;
  className?: string;
}

export function LanguageSelector({
  currentLanguage,
  onLanguageChange,
  className = "",
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selected =
    CHROME_LANGUAGES.find((lang) => lang.code === currentLanguage) ||
    CHROME_LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-secondary/80 text-secondary-foreground hover:bg-secondary border border-border/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select interface language"
      >
        <Globe className="w-3.5 h-3.5 text-muted-foreground" />
        <span>{selected.nativeName}</span>
        <ChevronDown
          className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-1.5 w-44 rounded-2xl bg-card border border-border shadow-lg shadow-black/5 dark:shadow-black/20 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
          role="listbox"
        >
          <div className="px-2 py-1 text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">
            Interface Language
          </div>
          {CHROME_LANGUAGES.map((lang) => {
            const isCurrent = lang.code === selected.code;
            return (
              <button
                key={lang.code}
                type="button"
                role="option"
                aria-selected={isCurrent}
                onClick={() => {
                  onLanguageChange(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors ${
                  isCurrent
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-foreground hover:bg-secondary"
                }`}
              >
                <div className="flex flex-col text-left">
                  <span>{lang.nativeName}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {lang.name}
                  </span>
                </div>
                {isCurrent && <Check className="w-3.5 h-3.5 text-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
