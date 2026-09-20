/**
 * Centralized Language Registry for PlexoChat
 *
 * Built to scale from the initial 25 core languages to 200+ languages
 * via configuration without rewriting UI or translation logic.
 */

export type LanguageStatus = "supported" | "tested" | "validated" | "experimental";
export type TranslationAvailability = "standard" | "requires_special_routing";
export type TextDirection = "ltr" | "rtl";

export interface LanguageEntry {
  id: string;
  code: string; // ISO 639-1 / BCP 47 compound code (e.g., 'en', 'bn-Latn')
  name: string; // English name
  nativeName: string; // Native script name
  script: string; // Script name (Latin, Devanagari, Bengali, etc.)
  direction: TextDirection;
  status: LanguageStatus;
  flag: string; // Emoji flag representation
  translationAvailability?: TranslationAvailability;
  providerRoute?: string; // Target translation route/provider
}

/**
 * The canonical 25-language registry for PlexoChat Phase 1.
 */
export const LANGUAGE_REGISTRY: readonly LanguageEntry[] = [
  {
    id: "en",
    code: "en",
    name: "English",
    nativeName: "English",
    script: "Latin",
    direction: "ltr",
    status: "validated",
    flag: "🇬🇧",
    providerRoute: "google",
  },
  {
    id: "zh",
    code: "zh",
    name: "Mandarin Chinese",
    nativeName: "中文 (简体)",
    script: "Simplified Han",
    direction: "ltr",
    status: "validated",
    flag: "🇨🇳",
    providerRoute: "google",
  },
  {
    id: "hi",
    code: "hi",
    name: "Hindi",
    nativeName: "हिन्दी",
    script: "Devanagari",
    direction: "ltr",
    status: "validated",
    flag: "🇮🇳",
    providerRoute: "google",
  },
  {
    id: "es",
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    script: "Latin",
    direction: "ltr",
    status: "validated",
    flag: "🇪🇸",
    providerRoute: "google",
  },
  {
    id: "ar",
    code: "ar",
    name: "Arabic",
    nativeName: "العربية",
    script: "Arabic",
    direction: "rtl",
    status: "validated",
    flag: "🇸🇦",
    providerRoute: "google",
  },
  {
    id: "fr",
    code: "fr",
    name: "French",
    nativeName: "Français",
    script: "Latin",
    direction: "ltr",
    status: "validated",
    flag: "🇫🇷",
    providerRoute: "google",
  },
  {
    id: "bn",
    code: "bn",
    name: "Bengali",
    nativeName: "বাংলা",
    script: "Bengali",
    direction: "ltr",
    status: "validated",
    flag: "🇧🇩",
    providerRoute: "google",
  },
  {
    id: "pt",
    code: "pt",
    name: "Portuguese",
    nativeName: "Português",
    script: "Latin",
    direction: "ltr",
    status: "validated",
    flag: "🇧🇷",
    providerRoute: "google",
  },
  {
    id: "ru",
    code: "ru",
    name: "Russian",
    nativeName: "Русский",
    script: "Cyrillic",
    direction: "ltr",
    status: "validated",
    flag: "🇷🇺",
    providerRoute: "google",
  },
  {
    id: "ur",
    code: "ur",
    name: "Urdu",
    nativeName: "اردو",
    script: "Perso-Arabic",
    direction: "rtl",
    status: "validated",
    flag: "🇵🇰",
    providerRoute: "google",
  },
  {
    id: "id",
    code: "id",
    name: "Indonesian",
    nativeName: "Bahasa Indonesia",
    script: "Latin",
    direction: "ltr",
    status: "validated",
    flag: "🇮🇩",
    providerRoute: "google",
  },
  {
    id: "de",
    code: "de",
    name: "German",
    nativeName: "Deutsch",
    script: "Latin",
    direction: "ltr",
    status: "validated",
    flag: "🇩🇪",
    providerRoute: "google",
  },
  {
    id: "ja",
    code: "ja",
    name: "Japanese",
    nativeName: "日本語",
    script: "Japanese (Kanji/Kana)",
    direction: "ltr",
    status: "validated",
    flag: "🇯🇵",
    providerRoute: "google",
  },
  {
    id: "pa",
    code: "pa",
    name: "Punjabi",
    nativeName: "ਪੰਜਾਬੀ",
    script: "Gurmukhi",
    direction: "ltr",
    status: "validated",
    flag: "🇮🇳",
    providerRoute: "google",
  },
  {
    id: "mr",
    code: "mr",
    name: "Marathi",
    nativeName: "मराठी",
    script: "Devanagari",
    direction: "ltr",
    status: "validated",
    flag: "🇮🇳",
    providerRoute: "google",
  },
  {
    id: "te",
    code: "te",
    name: "Telugu",
    nativeName: "తెలుగు",
    script: "Telugu",
    direction: "ltr",
    status: "validated",
    flag: "🇮🇳",
    providerRoute: "google",
  },
  {
    id: "tr",
    code: "tr",
    name: "Turkish",
    nativeName: "Türkçe",
    script: "Latin",
    direction: "ltr",
    status: "validated",
    flag: "🇹🇷",
    providerRoute: "google",
  },
  {
    id: "vi",
    code: "vi",
    name: "Vietnamese",
    nativeName: "Tiếng Việt",
    script: "Latin",
    direction: "ltr",
    status: "validated",
    flag: "🇻🇳",
    providerRoute: "google",
  },
  {
    id: "ko",
    code: "ko",
    name: "Korean",
    nativeName: "한국어",
    script: "Hangul",
    direction: "ltr",
    status: "validated",
    flag: "🇰🇷",
    providerRoute: "google",
  },
  {
    id: "it",
    code: "it",
    name: "Italian",
    nativeName: "Italiano",
    script: "Latin",
    direction: "ltr",
    status: "validated",
    flag: "🇮🇹",
    providerRoute: "google",
  },
  {
    id: "fa",
    code: "fa",
    name: "Persian",
    nativeName: "فارسی",
    script: "Perso-Arabic",
    direction: "rtl",
    status: "validated",
    flag: "🇮🇷",
    providerRoute: "google",
  },
  {
    id: "ta",
    code: "ta",
    name: "Tamil",
    nativeName: "தமிழ்",
    script: "Tamil",
    direction: "ltr",
    status: "validated",
    flag: "🇮🇳",
    providerRoute: "google",
  },
  {
    id: "gu",
    code: "gu",
    name: "Gujarati",
    nativeName: "ગુજરાતી",
    script: "Gujarati",
    direction: "ltr",
    status: "validated",
    flag: "🇮🇳",
    providerRoute: "google",
  },
  {
    id: "th",
    code: "th",
    name: "Thai",
    nativeName: "ไทย",
    script: "Thai",
    direction: "ltr",
    status: "validated",
    flag: "🇹🇭",
    providerRoute: "google",
  },
  {
    id: "nl",
    code: "nl",
    name: "Dutch",
    nativeName: "Nederlands",
    script: "Latin",
    direction: "ltr",
    status: "validated",
    flag: "🇳🇱",
    providerRoute: "google",
  },
  {
    id: "bn-Latn",
    code: "bn-Latn",
    name: "Banglish",
    nativeName: "Banglish (বাংলা)",
    script: "Latin",
    direction: "ltr",
    status: "experimental",
    flag: "🇧🇩",
    translationAvailability: "requires_special_routing",
    providerRoute: "special_routing_llm",
  },
] as const;

/**
 * Fast lookup map by language code.
 */
const LANGUAGE_CODE_MAP = new Map<string, LanguageEntry>(
  LANGUAGE_REGISTRY.map((l) => [l.code.toLowerCase(), l])
);

/**
 * Returns a language entry by ISO code, or undefined if unsupported.
 */
export function getLanguageByCode(code?: string): LanguageEntry | undefined {
  if (!code) return undefined;
  return LANGUAGE_CODE_MAP.get(code.trim().toLowerCase());
}

/**
 * Validates if a code belongs to the supported registry.
 */
export function isValidLanguageCode(code?: string): boolean {
  if (!code) return false;
  return LANGUAGE_CODE_MAP.has(code.trim().toLowerCase());
}

/**
 * Returns a human-friendly language name (English or native), falling back to code.
 */
export function getLanguageLabel(code?: string, options?: { native?: boolean }): string {
  if (!code) return "English";
  const entry = getLanguageByCode(code);
  if (!entry) return code.toUpperCase();
  return options?.native ? entry.nativeName : entry.name;
}

/**
 * Returns the short 2-letter uppercase language code.
 */
export function getLanguageShortCode(code?: string): string {
  if (!code) return "EN";
  return code.trim().substring(0, 2).toUpperCase();
}

/**
 * Returns text direction (ltr | rtl) for layout/text rendering.
 */
export function getLanguageDirection(code?: string): TextDirection {
  const entry = getLanguageByCode(code);
  return entry?.direction || "ltr";
}

/**
 * Compatibility shape for existing components expecting { code, name, flag }.
 */
export const SUPPORTED_LANGUAGES_COMPAT = LANGUAGE_REGISTRY.map((l) => ({
  code: l.code,
  name: `${l.name} (${l.nativeName})`,
  flag: l.flag,
}));
