/**
 * Client-Side Multilingual Translation Service (PlexoChat Phase 1 & 2)
 *
 * PRIVACY & ARCHITECTURE:
 * - Runs entirely in the client browser BEFORE messages are encrypted.
 * - Server never sees plaintext: only client-side translated + original text is packed
 *   into the E2EE envelope and encrypted via Olm before transmission.
 * - Translation Router abstraction allows hot-swapping providers (Google, MyMemory, NLLB, Local).
 * - Priority resolution: per-chat preference -> global user preference -> application default.
 * - In-memory LRU-style cache to prevent duplicate external requests.
 */

import {
  getLanguageLabel as getRegistryLabel,
  getLanguageShortCode,
  isValidLanguageCode,
  getLanguageByCode,
  LANGUAGE_REGISTRY,
} from "./languages/registry";
import { transliterateBengaliToBanglish } from "./languages/romanizer";

export interface TranslationResult {
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  isFallback: boolean;
  translationUnavailable?: boolean;
}

export interface ITranslationProvider {
  name: string;
  translate(
    text: string,
    targetLang: string,
    sourceLang?: string
  ): Promise<{ text: string; detectedLang: string }>;
}

/**
 * Returns a human-friendly language name.
 */
export function getLanguageLabel(code?: string): string {
  return getRegistryLabel(code);
}

/**
 * Returns the short 2-letter uppercase language code.
 */
export function getLanguageCode(code?: string): string {
  return getLanguageShortCode(code);
}

/**
 * Priority resolution order:
 * per-chat preference -> global user preference -> application default ("en").
 */
export function resolveTargetLanguage(params: {
  perChatOverride?: string | null;
  userPreferred?: string | null;
  defaultLang?: string;
}): string {
  const { perChatOverride, userPreferred, defaultLang = "en" } = params;

  if (perChatOverride && isValidLanguageCode(perChatOverride)) {
    return perChatOverride.trim().toLowerCase();
  }
  if (userPreferred && isValidLanguageCode(userPreferred)) {
    return userPreferred.trim().toLowerCase();
  }
  return defaultLang.trim().toLowerCase();
}

/**
 * Heuristic source language detector for scripts and mixed input.
 */
export function detectScriptLanguage(text: string): string {
  // Bengali Unicode block: 0980-09FF
  if (/[\u0980-\u09FF]/.test(text)) return "bn";
  // Devanagari (Hindi, Marathi): 0900-097F
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  // Arabic / Urdu / Persian: 0600-06FF
  if (/[\u0600-\u06FF]/.test(text)) return "ar";
  // Cyrillic (Russian): 0400-04FF
  if (/[\u0400-\u04FF]/.test(text)) return "ru";
  // Japanese Hiragana & Katakana: 3040-30FF
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return "ja";
  // Korean Hangul: AC00-D7AF, 1100-11FF
  if (/[\uAC00-\uD7AF\u1100-\u11FF]/.test(text)) return "ko";
  // Chinese Hanzi (without Japanese kana): 4E00-9FFF
  if (/[\u4E00-\u9FFF]/.test(text)) return "zh";
  // Tamil: 0B80-0BFF
  if (/[\u0B80-\u0BFF]/.test(text)) return "ta";
  // Telugu: 0C00-0C7F
  if (/[\u0C00-\u0C7F]/.test(text)) return "te";
  // Gujarati: 0A80-0AFF
  if (/[\u0A80-\u0AFF]/.test(text)) return "gu";
  // Gurmukhi (Punjabi): 0A00-0A7F
  if (/[\u0A00-\u0A7F]/.test(text)) return "pa";
  // Thai: 0E00-0E7F
  if (/[\u0E00-\u0E7F]/.test(text)) return "th";

  return "en";
}

/**
 * In-memory LRU cache: key = `${sourceLang}|${targetLang}|${text}` -> TranslationResult
 */
const CACHE_MAX_ENTRIES = 250;
const translationMemoryCache = new Map<string, TranslationResult>();

function getCacheKey(text: string, targetLang: string, sourceLang?: string): string {
  return `${(sourceLang || "auto").toLowerCase()}|${targetLang.toLowerCase()}|${text.trim()}`;
}

function getFromCache(text: string, targetLang: string, sourceLang?: string): TranslationResult | undefined {
  const key = getCacheKey(text, targetLang, sourceLang);
  return translationMemoryCache.get(key);
}

function setToCache(text: string, targetLang: string, sourceLang: string, result: TranslationResult) {
  const key = getCacheKey(text, targetLang, sourceLang);
  if (translationMemoryCache.size >= CACHE_MAX_ENTRIES) {
    const oldestKey = translationMemoryCache.keys().next().value;
    if (oldestKey) translationMemoryCache.delete(oldestKey);
  }
  translationMemoryCache.set(key, result);
}

/**
 * Primary Provider: Google Translate client endpoint
 */
class GoogleTranslateProvider implements ITranslationProvider {
  name = "GoogleTranslate";

  async translate(
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
        const detectedLang =
          typeof data[2] === "string" ? data[2] : detectScriptLanguage(text);

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
}

/**
 * Fallback Provider: MyMemory Translation API
 */
class MyMemoryProvider implements ITranslationProvider {
  name = "MyMemory";

  async translate(
    text: string,
    targetLang: string,
    sourceLang?: string
  ): Promise<{ text: string; detectedLang: string }> {
    const src = sourceLang && sourceLang !== "auto" ? sourceLang : detectScriptLanguage(text);

    if (src.toLowerCase() === targetLang.toLowerCase()) {
      return { text, detectedLang: src };
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
    if (
      !translated ||
      typeof translated !== "string" ||
      translated.includes("PLEASE SELECT TWO DISTINCT LANGUAGES")
    ) {
      throw new Error("Invalid or rejected response from MyMemory API");
    }

    return { text: translated, detectedLang: src };
  }
}

/**
 * Translation Router: Dispatches across configured providers with graceful degradation.
 */
export class TranslationServiceRouter {
  private primary: ITranslationProvider = new GoogleTranslateProvider();
  private fallback: ITranslationProvider = new MyMemoryProvider();

  async translate(
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

    // Check cache
    const cached = getFromCache(trimmed, normalizedTarget, preferredSourceLang);
    if (cached) {
      return cached;
    }

    // Special routing for Banglish (bn-Latn): 2-stage MT + Romanization pipeline
    if (normalizedTarget === "bn-latn") {
      const bnResult = await this.translate(trimmed, "bn", preferredSourceLang);
      const romanized = transliterateBengaliToBanglish(bnResult.translatedText);
      const finalResult: TranslationResult = {
        translatedText: romanized || bnResult.translatedText,
        sourceLang: bnResult.sourceLang,
        targetLang: "bn-Latn",
        isFallback: bnResult.isFallback,
        translationUnavailable: bnResult.translationUnavailable,
      };
      setToCache(trimmed, normalizedTarget, bnResult.sourceLang, finalResult);
      return finalResult;
    }

    // 1. Try Primary Provider (Google Translate with auto-detection)
    try {
      const primaryRes = await this.primary.translate(trimmed, normalizedTarget);
      const result: TranslationResult = {
        translatedText: primaryRes.text,
        sourceLang: primaryRes.detectedLang,
        targetLang: normalizedTarget,
        isFallback: false,
      };
      setToCache(trimmed, normalizedTarget, primaryRes.detectedLang, result);
      return result;
    } catch (errPrimary) {
      console.warn("[TranslationService] Primary provider failed, attempting fallback:", errPrimary);
    }

    // 2. Try Fallback Provider (MyMemory)
    try {
      const src = preferredSourceLang && preferredSourceLang !== "auto"
        ? preferredSourceLang
        : detectScriptLanguage(trimmed);
      const fallbackRes = await this.fallback.translate(trimmed, normalizedTarget, src);
      const result: TranslationResult = {
        translatedText: fallbackRes.text,
        sourceLang: fallbackRes.detectedLang || src,
        targetLang: normalizedTarget,
        isFallback: true,
      };
      setToCache(trimmed, normalizedTarget, result.sourceLang, result);
      return result;
    } catch (errFallback) {
      console.warn("[TranslationService] Fallback provider failed:", errFallback);
    }

    // 3. Graceful degradation: Return original text with warning flag
    return {
      translatedText: text,
      sourceLang: preferredSourceLang || detectScriptLanguage(trimmed),
      targetLang: normalizedTarget,
      isFallback: true,
      translationUnavailable: true,
    };
  }
}

export const TranslationService = new TranslationServiceRouter();

/**
 * Main translation function consumed across the application.
 */
export async function translateText(
  text: string,
  targetLang: string,
  preferredSourceLang?: string
): Promise<TranslationResult> {
  return TranslationService.translate(text, targetLang, preferredSourceLang);
}
