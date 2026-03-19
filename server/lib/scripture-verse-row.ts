import type { ScriptureVerseResult } from '@shared/scripture-search-contracts.js';
import { scriptureVerses } from '@server/db/schema.js';
import { normalizeScriptureTranslationCode } from './scripture-normalization.js';

/** Verse columns needed for API mapping (full row or reader/search projections). */
export type ScriptureVerseRowFields = Pick<
  typeof scriptureVerses.$inferSelect,
  'translation' | 'book' | 'chapter' | 'verse' | 'reference' | 'verseText'
>;

/**
 * Map a `scripture_verses` row (or selected columns) to the shared verse payload used by search and reader chapter APIs.
 */
export function mapScriptureVerseRow(
  row: ScriptureVerseRowFields,
): ScriptureVerseResult {
  return {
    translation: normalizeScriptureTranslationCode(row.translation),
    book: row.book,
    chapter: row.chapter,
    verse: row.verse,
    reference: row.reference,
    verseText: row.verseText,
  };
}
