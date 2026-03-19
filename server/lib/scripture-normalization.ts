import { BIBLE_BOOKS } from '@shared/bible-books.js';
import {
  SUPPORTED_SCRIPTURE_TRANSLATIONS,
  type ReaderBookmark,
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

/**
 * Interpret a translation string stored in the database (or legacy rows).
 * Returns `null` if missing or not a supported code (no fallback).
 */
export function parsePersistedScriptureTranslation(
  value: string | null | undefined,
): ScriptureTranslationCode | null {
  if (value == null || value === '') return null;
  const normalized = value.trim().toUpperCase();
  if (
    SUPPORTED_SCRIPTURE_TRANSLATIONS.includes(
      normalized as ScriptureTranslationCode,
    )
  ) {
    return normalized as ScriptureTranslationCode;
  }
  return null;
}

/**
 * Canonicalize bookmark book + translation for API responses and persistence.
 * Returns `null` if the book name cannot be resolved to a canonical Bible book.
 */
export function normalizeReaderBookmarkFields(
  bookmark: ReaderBookmark,
): ReaderBookmark | null {
  const book = canonicalizeBibleBookName(bookmark.book);
  if (!book) return null;
  const translation = normalizeScriptureTranslationCode(bookmark.translation);
  return {
    ...bookmark,
    book,
    translation,
  };
}
