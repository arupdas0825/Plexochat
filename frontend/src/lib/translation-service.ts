/**
 * Client-Side Multilingual Translation Service (PlexoChat Option B)
 *
 * PRIVACY & ARCHITECTURE:
 * - Runs entirely in the client browser BEFORE messages are encrypted.
 * - Server never sees plaintext: only client-side translated + original text is packed
 *   into the E2EE envelope and encrypted via Olm before transmission.
 * - Primary provider: Google Translate client endpoint (with automatic language detection,
 *   supporting transliterated/Banglish input, mixed scripts, and all supported languages).
 * - Secondary provider: MyMemory translation API fallback.
 * - Graceful degradation: If offline or rate limited, falls back to original text with
 *   `isFallback: true` and `translationUnavailable: true`.
 */

export interface TranslationResult {
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  isFallback: boolean;
  translationUnavailable?: boolean;
}

const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  bn: "Bengali",
  de: "German",
  es: "Spanish",
  fr: "French",
  ja: "Japanese",
  ar: "Arabic",
};

/**
 * Returns a human-friendly language name or short code.
 */
export function getLanguageLabel(code?: string): string {
  if (!code) return "EN";
  const clean = code.trim().toLowerCase();
  return LANGUAGE_LABELS[clean] || clean.toUpperCase();
}

/**
 * Returns the short 2-letter uppercase language code.
 */
export function getLanguageCode(code?: string): string {
  if (!code) return "EN";
  return code.trim().substring(0, 2).toUpperCase();
}

/**
 * Heuristic source language detector for Banglish / mixed scripts.
 */
function detectScriptLanguage(text: string): string {
  // Bengali Unicode block: 0980-09FF
  if (/[\u0980-\u09FF]/.test(text)) {
    return "bn";
  }
  return "en";
}

/**
 * Primary translator: Google Translate client API.
 * Supports auto language detection (vital for Banglish and mixed Latin/Bengali scripts).
 */
async function translateWithGoogle(
  text: string,
  targetLang: string
): Promise<{ text: string; detectedLang: string }> {
  const cleanTarget = targetLang.trim().toLowerCase();
  const clients = ["dict-chrome-ex", "gtx"];
  let lastError: Error | null = null;

  for (const client of clients) {
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=${client}&sl=auto&tl=${encodeURIComponent(
        cleanTarget
      )}&dt=t&q=${encodeURIComponent(text)}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Google Translate [${client}] returned HTTP ${response.status}`);
      }

      const data = await response.json();
      if (!Array.isArray(data) || !Array.isArray(data[0])) {
        throw new Error("Invalid response format from Google Translate");
      }

      const segments: string[] = [];
      for (const part of data[0]) {
        if (Array.isArray(part) && typeof part[0] === "string") {
          segments.push(part[0]);
        }
      }

      const translatedText = segments.join("");
      const detectedLang = typeof data[2] === "string" ? data[2] : detectScriptLanguage(text);

      return {
        text: translatedText || text,
        detectedLang,
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError || new Error("Google Translate failed across all client endpoints");
}

/**
 * Fallback translator: MyMemory Translation API.
 */
async function translateWithMyMemory(
  text: string,
  targetLang: string,
  sourceLang?: string
): Promise<{ text: string }> {
  const src = sourceLang && sourceLang !== "auto" ? sourceLang : detectScriptLanguage(text);

  if (src.toLowerCase() === targetLang.toLowerCase()) {
    return { text };
  }

  const pair = `${src}|${targetLang}`;
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
    text
  )}&langpair=${encodeURIComponent(pair)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`MyMemory returned HTTP ${response.status}`);
  }

  const data = await response.json();
  const translated = data?.responseData?.translatedText;
  if (!translated || typeof translated !== "string" || translated.includes("PLEASE SELECT TWO DISTINCT LANGUAGES")) {
    throw new Error("Invalid or rejected response from MyMemory API");
  }

  return { text: translated };
}

/**
 * Translates input text into the target language.
 *
 * @param text Raw original message text.
 * @param targetLang Target ISO-639-1 language code (e.g. 'de', 'en', 'bn').
 * @param preferredSourceLang Optional hint for source language if known.
 */
export async function translateText(
  text: string,
  targetLang: string,
  preferredSourceLang?: string
): Promise<TranslationResult> {
  const trimmed = text.trim();
  const normalizedTarget = (targetLang || "en").toLowerCase();

  if (!trimmed) {
    return {
      translatedText: text,
      sourceLang: normalizedTarget,
      targetLang: normalizedTarget,
      isFallback: false,
    };
  }

  // 1. Try Google Translate (with auto-detection)
  try {
    const googleRes = await translateWithGoogle(trimmed, normalizedTarget);
    return {
      translatedText: googleRes.text,
      sourceLang: googleRes.detectedLang,
      targetLang: normalizedTarget,
      isFallback: false,
    };
  } catch (errGoogle) {
    console.warn("[TranslationService] Primary Google translate failed, trying fallback:", errGoogle);
  }

  // 2. Try MyMemory Fallback
  try {
    const src = preferredSourceLang && preferredSourceLang !== "auto" ? preferredSourceLang : "en";
    const myMemoryRes = await translateWithMyMemory(trimmed, normalizedTarget, src);
    return {
      translatedText: myMemoryRes.text,
      sourceLang: src,
      targetLang: normalizedTarget,
      isFallback: true,
    };
  } catch (errMyMemory) {
    console.warn("[TranslationService] Secondary MyMemory translate failed:", errMyMemory);
  }

  // 3. Graceful degradation: return original text with warning indicator
  return {
    translatedText: text,
    sourceLang: preferredSourceLang || "unknown",
    targetLang: normalizedTarget,
    isFallback: true,
    translationUnavailable: true,
  };
}
