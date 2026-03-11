import { and, asc, desc, eq, gte, ilike, lte, or, sql } from 'drizzle-orm';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BIBLE_BOOKS } from '@shared/bible-books.js';
import {
  SUPPORTED_SCRIPTURE_TRANSLATIONS,
  ScriptureSearchMode,
  ScriptureSearchResponse,
  type ScriptureTranslationCode,
  type ScriptureVerseResult,
} from '@shared/scripture-search-contracts.js';
import { scriptureVerses } from '@server/db/schema.js';
import { requireDb } from './require-db.js';
import { logger } from '@server/lib/logger.js';

type SearchParams = {
  mode: ScriptureSearchMode;
  queryText: string;
  translation: string;
  book?: string;
  chapter?: number;
  verseStart?: number;
  verseEnd?: number;
  limit: number;
};
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const keywordRankSql = (queryText: string): ReturnType<typeof sql<number>> =>
  sql<number>`ts_rank(to_tsvector('simple', ${scriptureVerses.verseText}), plainto_tsquery('simple', ${queryText}))`;

type ParsedReference = {
  book: string;
  chapter: number;
  verseStart?: number;
  verseEnd?: number;
};

const canonicalBookMap = new Map(
  BIBLE_BOOKS.map((book) => [book.toLowerCase(), book]),
);
canonicalBookMap.set('psalm', 'Psalms');
canonicalBookMap.set('song of songs', 'Song of Solomon');
const localVerseMapCache = new Map<string, Record<string, string>>();

type LocalVerseRow = {
  reference: string;
  book: string;
  chapter: number;
  verse: number;
  verseText: string;
};

/** Ensure translation values match supported canonical codes. */
function normalizeTranslationCode(value: string): ScriptureTranslationCode {
  const normalized = value.trim().toUpperCase();
  if (
    SUPPORTED_SCRIPTURE_TRANSLATIONS.includes(
      normalized as ScriptureTranslationCode,
    )
  ) {
    return normalized as ScriptureTranslationCode;
  }
  return 'KJV';
}

/** Convert DB verse row into API response shape. */
function mapVerseRow(
  row: typeof scriptureVerses.$inferSelect,
): ScriptureVerseResult {
  return {
    translation: normalizeTranslationCode(row.translation),
    book: row.book,
    chapter: row.chapter,
    verse: row.verse,
    reference: row.reference,
    verseText: row.verseText,
  };
}

/** Parse references like "John 3", "John 3:16", "John 3:16-18". */
function parseReferenceQuery(input: string): ParsedReference | null {
  const trimmed = input.trim().replace(/\s+/g, ' ');
  const match = trimmed.match(/^(.+?)\s+(\d+)(?::(\d+)(?:\s*-\s*(\d+))?)?$/i);
  if (!match) return null;

  const [, bookPart, chapterPart, verseStartPart, verseEndPart] = match;
  const canonicalBook = canonicalBookMap.get(bookPart.trim().toLowerCase());
  if (!canonicalBook) return null;

  const chapter = Number(chapterPart);
  if (!Number.isInteger(chapter) || chapter <= 0) return null;

  const verseStart = verseStartPart ? Number(verseStartPart) : undefined;
  const verseEnd = verseEndPart ? Number(verseEndPart) : verseStart;
  if (verseStart && (!Number.isInteger(verseStart) || verseStart <= 0)) {
    return null;
  }
  if (
    verseEnd &&
    (!Number.isInteger(verseEnd) || verseEnd <= 0 || verseStart! > verseEnd)
  ) {
    return null;
  }

  return {
    book: canonicalBook,
    chapter,
    verseStart,
    verseEnd,
  };
}

/** Parse normalized reference keys like "John 3:16". */
function parseReferenceKey(reference: string): ParsedReference | null {
  const match = reference.match(/^(.+?)\s+(\d+):(\d+)$/);
  if (!match) return null;
  const [, bookPart, chapterPart, versePart] = match;
  const chapter = Number(chapterPart);
  const verse = Number(versePart);
  if (!chapter || !verse) return null;
  const canonicalBook = canonicalBookMap.get(bookPart.trim().toLowerCase());
  if (!canonicalBook) return null;
  return {
    book: canonicalBook,
    chapter,
    verseStart: verse,
    verseEnd: verse,
  };
}

/** Load local translation map from server file storage. */
async function readLocalVerseMap(
  translation: string,
): Promise<Record<string, string>> {
  const key = translation.toLowerCase();
  const cached = localVerseMapCache.get(key);
  if (cached) return cached;

  const localPath = path.resolve(__dirname, `../data/bible/${key}.json`);
  const content = await readFile(localPath, 'utf8');
  const parsed = JSON.parse(content) as Record<string, string>;
  localVerseMapCache.set(key, parsed);
  return parsed;
}

/** Query normalized local verse map by mode and params. */
async function searchFromLocalJson(
  params: SearchParams,
  translation: string,
): Promise<ScriptureVerseResult[]> {
  const verseMap = await readLocalVerseMap(translation);
  const rows: LocalVerseRow[] = [];

  for (const [reference, verseText] of Object.entries(verseMap)) {
    const parsed = parseReferenceKey(reference);
    if (!parsed) continue;

    const row: LocalVerseRow = {
      reference,
      book: parsed.book,
      chapter: parsed.chapter,
      verse: parsed.verseStart ?? 0,
      verseText,
    };

    if (params.mode === 'guided') {
      if (params.book && row.book !== params.book) continue;
      if (params.chapter && row.chapter !== params.chapter) continue;
      if (params.verseStart && row.verse < params.verseStart) continue;
      if (params.verseEnd && row.verse > params.verseEnd) continue;
      rows.push(row);
      continue;
    }

    if (params.mode === 'reference') {
      const ref = parseReferenceQuery(params.queryText);
      if (!ref) continue;
      if (row.book !== ref.book || row.chapter !== ref.chapter) continue;
      if (ref.verseStart && row.verse < ref.verseStart) continue;
      if (ref.verseEnd && row.verse > ref.verseEnd) continue;
      rows.push(row);
      continue;
    }

    const query = params.queryText.trim().toLowerCase();
    if (!query) continue;
    if (
      row.reference.toLowerCase().includes(query) ||
      row.verseText.toLowerCase().includes(query)
    ) {
      rows.push(row);
    }
  }

  rows.sort((a, b) => {
    if (a.book !== b.book) return a.book.localeCompare(b.book);
    if (a.chapter !== b.chapter) return a.chapter - b.chapter;
    return a.verse - b.verse;
  });

  return rows.slice(0, params.limit).map((row) => ({
    translation: normalizeTranslationCode(translation),
    book: row.book,
    chapter: row.chapter,
    verse: row.verse,
    reference: row.reference,
    verseText: row.verseText,
  }));
}

/** Try fetching range text from a public bible API as fallback. */
async function readRemoteBibleVerses(
  input: string,
  translation: string,
): Promise<ScriptureVerseResult[]> {
  const reference = encodeURIComponent(input.trim());
  const url = `https://bible-api.com/${reference}?translation=${encodeURIComponent(translation)}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
  if (!response.ok) return [];

  const payload = (await response.json()) as {
    verses?: Array<{
      book_name?: string;
      chapter?: number;
      verse?: number;
      text?: string;
    }>;
    reference?: string;
    translation_name?: string;
  };
  if (!payload.verses?.length) return [];

  return payload.verses
    .filter(
      (verse) => verse.book_name && verse.chapter && verse.verse && verse.text,
    )
    .map((verse) => ({
      // Keep a stable canonical translation code for save payload compatibility.
      translation: normalizeTranslationCode(translation),
      book: verse.book_name ?? '',
      chapter: verse.chapter ?? 0,
      verse: verse.verse ?? 0,
      reference: `${verse.book_name} ${verse.chapter}:${verse.verse}`,
      verseText: verse.text?.trim() ?? '',
    }));
}

/** Search scripture verses with local-primary and remote fallback behavior. */
export async function searchScriptureVerses(
  params: SearchParams,
): Promise<ScriptureSearchResponse> {
  const limit = Math.min(Math.max(params.limit, 1), 100);
  const translation = params.translation.trim().toUpperCase();
  const baseFilters = [eq(scriptureVerses.translation, translation)];

  let localRows: (typeof scriptureVerses.$inferSelect)[] = [];
  try {
    const db = requireDb();
    if (params.mode === 'guided') {
      if (params.book) baseFilters.push(eq(scriptureVerses.book, params.book));
      if (params.chapter)
        baseFilters.push(eq(scriptureVerses.chapter, params.chapter));
      if (params.verseStart) {
        baseFilters.push(gte(scriptureVerses.verse, params.verseStart));
      }
      if (params.verseEnd) {
        baseFilters.push(lte(scriptureVerses.verse, params.verseEnd));
      }
      localRows = await db
        .select()
        .from(scriptureVerses)
        .where(and(...baseFilters))
        .orderBy(
          asc(scriptureVerses.book),
          asc(scriptureVerses.chapter),
          asc(scriptureVerses.verse),
        )
        .limit(limit);
    } else if (params.mode === 'reference') {
      const parsed = parseReferenceQuery(params.queryText);
      if (parsed) {
        baseFilters.push(eq(scriptureVerses.book, parsed.book));
        baseFilters.push(eq(scriptureVerses.chapter, parsed.chapter));
        if (parsed.verseStart) {
          baseFilters.push(gte(scriptureVerses.verse, parsed.verseStart));
        }
        if (parsed.verseEnd) {
          baseFilters.push(lte(scriptureVerses.verse, parsed.verseEnd));
        }
        localRows = await db
          .select()
          .from(scriptureVerses)
          .where(and(...baseFilters))
          .orderBy(asc(scriptureVerses.verse))
          .limit(limit);
      }
    } else {
      localRows = await db
        .select({
          verseId: scriptureVerses.verseId,
          translation: scriptureVerses.translation,
          book: scriptureVerses.book,
          chapter: scriptureVerses.chapter,
          verse: scriptureVerses.verse,
          reference: scriptureVerses.reference,
          verseText: scriptureVerses.verseText,
          createdAt: scriptureVerses.createdAt,
          updatedAt: scriptureVerses.updatedAt,
          rank: keywordRankSql(params.queryText),
        })
        .from(scriptureVerses)
        .where(
          and(
            ...baseFilters,
            or(
              ilike(scriptureVerses.verseText, `%${params.queryText}%`),
              ilike(scriptureVerses.reference, `%${params.queryText}%`),
            ),
          ),
        )
        .orderBy(
          desc(keywordRankSql(params.queryText)),
          asc(scriptureVerses.book),
          asc(scriptureVerses.chapter),
          asc(scriptureVerses.verse),
        )
        .limit(limit);
    }
  } catch (err) {
    logger.warn(
      { err, translation, mode: params.mode },
      'DB scripture search failed; using local JSON fallback',
    );
  }

  if (localRows.length > 0) {
    return {
      mode: params.mode,
      source: 'local',
      queryText: params.queryText,
      total: localRows.length,
      verses: localRows.map(mapVerseRow),
    };
  }

  const fileRows = await searchFromLocalJson(
    { ...params, limit },
    translation,
  ).catch(() => []);
  if (fileRows.length > 0) {
    return {
      mode: params.mode,
      source: 'local',
      queryText: params.queryText,
      total: fileRows.length,
      verses: fileRows,
    };
  }

  if (params.mode !== 'guided' && params.queryText.trim()) {
    const remoteRows = await readRemoteBibleVerses(
      params.queryText,
      translation,
    );
    if (remoteRows.length > 0) {
      return {
        mode: params.mode,
        source: 'remote',
        queryText: params.queryText,
        total: remoteRows.length,
        verses: remoteRows.slice(0, limit),
      };
    }
  }

  return {
    mode: params.mode,
    source: 'local',
    queryText: params.queryText,
    total: 0,
    verses: [],
  };
}
