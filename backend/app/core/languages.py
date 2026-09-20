"""Centralized Language Registry for PlexoChat Backend.

Mirrors the 25-language registry in frontend/src/lib/languages/registry.ts.
Enforces strict input validation on all language preferences and chat overrides.
"""

from typing import Optional

# Validated ISO 639-1 / BCP 47 language codes — initial 25 languages
# English, Mandarin Chinese, Hindi, Spanish, Arabic, French, Bengali,
# Portuguese, Russian, Urdu, Indonesian, German, Japanese, Punjabi,
# Marathi, Telugu, Turkish, Vietnamese, Korean, Italian, Persian,
# Tamil, Gujarati, Thai, Dutch.
SUPPORTED_LANGUAGE_CODES: frozenset[str] = frozenset({
    "en",  # English
    "zh",  # Mandarin Chinese
    "hi",  # Hindi
    "es",  # Spanish
    "ar",  # Arabic
    "fr",  # French
    "bn",  # Bengali
    "pt",  # Portuguese
    "ru",  # Russian
    "ur",  # Urdu
    "id",  # Indonesian
    "de",  # German
    "ja",  # Japanese
    "pa",  # Punjabi
    "mr",  # Marathi
    "te",  # Telugu
    "tr",  # Turkish
    "vi",  # Vietnamese
    "ko",  # Korean
    "it",  # Italian
    "fa",  # Persian
    "ta",  # Tamil
    "gu",  # Gujarati
    "th",  # Thai
    "nl",  # Dutch
    "bn-latn",  # Banglish (Bengali romanized script variant)
})


def validate_language_code(v: Optional[str]) -> Optional[str]:
    """Shared validator for preferred_receiving_language and chat language overrides.

    Normalizes to lowercase and verifies membership in SUPPORTED_LANGUAGE_CODES.
    """
    if v is None:
        return None
    v = v.strip().lower()
    if v not in SUPPORTED_LANGUAGE_CODES:
        raise ValueError(
            f"Unsupported language code '{v}'. "
            f"Must be one of: {', '.join(sorted(SUPPORTED_LANGUAGE_CODES))}"
        )
    return v
