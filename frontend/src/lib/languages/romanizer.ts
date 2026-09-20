/**
 * Phonetic Romanizer for PlexoChat (Bengali -> Banglish / bn-Latn)
 *
 * Implements Option (a) of Section 1 & Docs/memory.md §7a:
 * Two-stage translation pipeline (Standard translation to Bengali + phonetic transliteration).
 * Can be replaced/augmented by an LLM-based translation provider (Option b).
 */

const VOWEL_MAP: Record<string, string> = {
  "অ": "o",
  "আ": "a",
  "ই": "i",
  "ঈ": "i",
  "উ": "u",
  "ঊ": "u",
  "ঋ": "ri",
  "এ": "e",
  "ঐ": "oi",
  "ও": "o",
  "ঔ": "ou",
};

const VOWEL_SIGN_MAP: Record<string, string> = {
  "া": "a",
  "ি": "i",
  "ী": "i",
  "ু": "u",
  "ূ": "u",
  "ৃ": "ri",
  "ে": "e",
  "ৈ": "oi",
  "ো": "o",
  "ৌ": "ou",
};

const CONSONANT_MAP: Record<string, string> = {
  "ক": "k",
  "খ": "kh",
  "গ": "g",
  "ঘ": "gh",
  "ঙ": "ng",
  "চ": "ch",
  "ছ": "chh",
  "জ": "j",
  "ঝ": "jh",
  "ঞ": "n",
  "ট": "t",
  "ঠ": "th",
  "ড": "d",
  "ঢ": "dh",
  "ণ": "n",
  "ত": "t",
  "থ": "th",
  "দ": "d",
  "ধ": "dh",
  "ন": "n",
  "প": "p",
  "ফ": "f",
  "ব": "b",
  "ভ": "bh",
  "ম": "m",
  "য": "j",
  "র": "r",
  "ল": "l",
  "শ": "sh",
  "ষ": "sh",
  "স": "s",
  "হ": "h",
  "ড়": "r",
  "ঢ়": "rh",
  "য়": "y",
  "ৎ": "t",
  "ং": "ng",
  "ঃ": "h",
  "ঁ": "n",
};

const BENGALI_DIGITS: Record<string, string> = {
  "০": "0",
  "১": "1",
  "২": "2",
  "৩": "3",
  "৪": "4",
  "৫": "5",
  "৬": "6",
  "৭": "7",
  "৮": "8",
  "৯": "9",
};

const VIRAMA = "\u09CD"; // ্ hasanta / virama

/**
 * Transliterates Bengali unicode text into readable, natural romanized Banglish.
 */
export function transliterateBengaliToBanglish(text: string): string {
  if (!text) return "";
  const chars = Array.from(text);
  const out: string[] = [];

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const next = chars[i + 1];

    if (BENGALI_DIGITS[ch]) {
      out.push(BENGALI_DIGITS[ch]);
      continue;
    }

    if (VOWEL_MAP[ch]) {
      out.push(VOWEL_MAP[ch]);
      continue;
    }

    if (CONSONANT_MAP[ch]) {
      const latinConsonant = CONSONANT_MAP[ch];
      out.push(latinConsonant);

      if (next === VIRAMA) {
        // Virama suppresses vowel
        i++; // skip virama
        continue;
      }

      if (next && VOWEL_SIGN_MAP[next]) {
        // Followed by explicit vowel sign
        out.push(VOWEL_SIGN_MAP[next]);
        i++; // skip vowel sign
        continue;
      }

      // Check if next is a space, punctuation, or end of word/string
      if (!next || /[\s\p{P}]/u.test(next)) {
        // Word-final consonants often don't have inherent 'o' in informal Banglish
        // e.g. "করব" -> "korbo", "ভাল" -> "bhalo", but "নাম" -> "nam"
        continue;
      }

      // Inherent vowel 'o' between consonants
      out.push("o");
      continue;
    }

    if (VOWEL_SIGN_MAP[ch]) {
      out.push(VOWEL_SIGN_MAP[ch]);
      continue;
    }

    // Pass punctuation, Latin letters, spaces, emojis as-is
    out.push(ch);
  }

  return out.join("");
}
