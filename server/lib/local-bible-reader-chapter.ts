import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BIBLE_BOOKS } from '@shared/bible-books.js';
import type {
  ReaderChapterResponse,
  ScriptureTranslationCode,
} from '@shared/scripture-search-contracts.js';
import { SUPPORTED_SCRIPTURE_TRANSLATIONS } from '@shared/scripture-search-contracts.js';
import { ClientError } from '@server/lib/client-error.js';
import {
  normalizeBibleJsonVerseText,
  parseBibleJsonMapReference,
} from '@server/lib/bible-json-map-reference.js';
import { mapScriptureVerseRow } from '@server/lib/scripture-verse-row.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const bibleDataDir = path.resolve(__dirname, '../data/bible');

const verseMapCache = new Map<string, Record<string, string>>();

function isSupportedTranslation(
  code: string,
): code is ScriptureTranslationCode {
  return (SUPPORTED_SCRIPTURE_TRANSLATIONS as readonly string[]).includes(code);
}

/** Load a bundled translation map from `server/data/bible/<code>.json`. */
export async function loadLocalBibleVerseMap(
  translationLower: string,
): Promise<Record<string, string> | null> {
  const key = translationLower.toLowerCase();
  const cached = verseMapCache.get(key);
  if (cached) return cached;

  const localPath = path.join(bibleDataDir, `${key}.json`);
  try {
    const content = await readFile(localPath, 'utf8');
    const parsed = JSON.parse(content) as Record<string, string>;
    verseMapCache.set(key, parsed);
    return parsed;
  } catch {
    return null;
  }
}

function maxChapterForBook(map: Record<string, string>, book: string): number {
  let max = 0;
  for (const reference of Object.keys(map)) {
    const p = parseBibleJsonMapReference(reference);
    if (p?.book === book) max = Math.max(max, p.chapter);
  }
  return max;
}

function largestChapterInBookLessThan(
  map: Record<string, string>,
  book: string,
  chapter: number,
): number | null {
  let best: number | null = null;
  for (const reference of Object.keys(map)) {
    const p = parseBibleJsonMapReference(reference);
    if (p?.book !== book || p.chapter >= chapter) continue;
    if (best === null || p.chapter > best) best = p.chapter;
  }
  return best;
}

function smallestChapterInBookGreaterThan(
  map: Record<string, string>,
  book: string,
  chapter: number,
): number | null {
  let best: number | null = null;
  for (const reference of Object.keys(map)) {
    const p = parseBibleJsonMapReference(reference);
    if (p?.book !== book || p.chapter <= chapter) continue;
    if (best === null || p.chapter < best) best = p.chapter;
  }
  return best;
}

function lastChapterForBookInMap(
  map: Record<string, string>,
  book: string,
): number | null {
  const max = maxChapterForBook(map, book);
  return max > 0 ? max : null;
}

function firstChapterForBookInMap(
  map: Record<string, string>,
  book: string,
): number | null {
  let min: number | null = null;
  for (const reference of Object.keys(map)) {
    const p = parseBibleJsonMapReference(reference);
    if (p?.book !== book) continue;
    if (min === null || p.chapter < min) min = p.chapter;
  }
  return min;
}

/**
 * Build a reader chapter response from `server/data/bible/<translation>.json`.
 * Returns null if the file is missing or translation is not one of KJV/ASV/WEB.
 * Throws {@link ClientError} (400/404) when the map exists but the chapter request is invalid.
 */
export async function readReaderChapterFromLocalBibleJson(input: {
  translation: ScriptureTranslationCode;
  book: string;
  chapter: number;
}): Promise<ReaderChapterResponse | null> {
  if (!isSupportedTranslation(input.translation)) return null;

  const map = await loadLocalBibleVerseMap(input.translation.toLowerCase());
  if (!map) return null;

  const { book, chapter, translation } = input;
  const maxChapter = maxChapterForBook(map, book);
  if (!maxChapter) {
    throw new ClientError(404, 'no chapters found for the selected book');
  }
  if (chapter > maxChapter) {
    throw new ClientError(
      400,
      `chapter must be between 1 and ${maxChapter} for ${book}`,
    );
  }

  const rows: Array<{
    translation: string;
    book: string;
    chapter: number;
    verse: number;
    reference: string;
    verseText: string;
  }> = [];

  for (const [reference, rawText] of Object.entries(map)) {
    const p = parseBibleJsonMapReference(reference);
    if (!p || p.book !== book || p.chapter !== chapter) continue;
    rows.push({
      translation,
      book,
      chapter,
      verse: p.verse,
      reference,
      verseText: normalizeBibleJsonVerseText(rawText),
    });
  }

  if (rows.length === 0) {
    throw new ClientError(404, 'no verses found for the selected chapter');
  }

  rows.sort((a, b) => a.verse - b.verse);

  const prevInBook = largestChapterInBookLessThan(map, book, chapter);
  let previousChapter: { book: string; chapter: number } | null = prevInBook
    ? { book, chapter: prevInBook }
    : null;
  if (!previousChapter) {
    const idx = BIBLE_BOOKS.findIndex((b) => b === book);
    for (let i = idx - 1; i >= 0; i -= 1) {
      const candidateBook = BIBLE_BOOKS[i];
      const last = lastChapterForBookInMap(map, candidateBook);
      if (last != null) {
        previousChapter = { book: candidateBook, chapter: last };
        break;
      }
    }
  }

  const nextInBook = smallestChapterInBookGreaterThan(map, book, chapter);
  let nextChapter: { book: string; chapter: number } | null = nextInBook
    ? { book, chapter: nextInBook }
    : null;
  if (!nextChapter) {
    const idx = BIBLE_BOOKS.findIndex((b) => b === book);
    for (let i = idx + 1; i < BIBLE_BOOKS.length; i += 1) {
      const candidateBook = BIBLE_BOOKS[i];
      const first = firstChapterForBookInMap(map, candidateBook);
      if (first != null) {
        nextChapter = { book: candidateBook, chapter: first };
        break;
      }
    }
  }

  const verses = rows.map((row) => mapScriptureVerseRow(row));

  return {
    translation,
    book,
    chapter,
    verses,
    displayText: rows
      .map((row) => `${row.reference} ${row.verseText.trim()}`)
      .join('\n'),
    hasPrevious: Boolean(previousChapter),
    hasNext: Boolean(nextChapter),
    previousChapter,
    nextChapter,
  };
}

/** @internal exported for tests */
export function __clearLocalBibleVerseMapCacheForTests(): void {
  verseMapCache.clear();
}
