import { BIBLE_BOOKS } from '@shared/bible-books.js';
import {
  SUPPORTED_SCRIPTURE_TRANSLATIONS,
  type ScriptureTranslationCode,
} from '@shared/scripture-search-contracts.js';

const canonicalBookMap = new Map(
  BIBLE_BOOKS.map((book) => [book.toLowerCase(), book]),
);
canonicalBookMap.set('psalm', 'Psalms');
canonicalBookMap.set('song of songs', 'Song of Solomon');

/**
 * Normalize book names to canonical Bible book entries.
 */
export function canonicalizeBibleBookName(value: string): string | null {
  return canonicalBookMap.get(value.trim().toLowerCase()) ?? null;
}

/**
 * Normalize translation input to supported canonical translation codes.
 */
export function normalizeScriptureTranslationCode(
  value: string | undefined,
  fallback: ScriptureTranslationCode = 'KJV',
): ScriptureTranslationCode {
  const normalized = value?.trim().toUpperCase();
  if (
    normalized &&
    SUPPORTED_SCRIPTURE_TRANSLATIONS.includes(
      normalized as ScriptureTranslationCode,
    )
  ) {
    return normalized as ScriptureTranslationCode;
  }
  return fallback;
}
