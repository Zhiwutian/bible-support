import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from '@server/config/env.js';
import { getDrizzleDb } from '@server/db/drizzle.js';
import { scriptureVerses } from '@server/db/schema.js';
import { logger } from '@server/lib/logger.js';

const DEFAULT_KJV_JSON_URL =
  'https://raw.githubusercontent.com/farskipper/kjv/master/json/verses-1769.json';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Return true when source string is an HTTP(S) URL. */
function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

/** Return true if a file exists and is readable. */
async function canReadFile(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

type ParsedVerse = {
  translation: string;
  book: string;
  chapter: number;
  verse: number;
  reference: string;
  verseText: string;
};

/** Parse references like `John 3:16` into structured coordinates. */
function parseReference(reference: string): {
  book: string;
  chapter: number;
  verse: number;
} | null {
  const match = reference.match(/^(.+?)\s+(\d+):(\d+)$/);
  if (!match) return null;
  const [, book, chapterPart, versePart] = match;
  const chapter = Number(chapterPart);
  const verse = Number(versePart);
  if (!Number.isInteger(chapter) || chapter <= 0) return null;
  if (!Number.isInteger(verse) || verse <= 0) return null;

  const canonicalBook = book.trim() === 'Psalm' ? 'Psalms' : book.trim();
  return { book: canonicalBook, chapter, verse };
}

/** Normalize verse text markup from source dataset into plain-readable text. */
function normalizeVerseText(text: string): string {
  return text.replace(/^#\s*/, '').replace(/\s+/g, ' ').trim();
}

/** Read bible JSON from a URL or local file path. */
async function readBibleJsonContent(
  source: string,
  sourceType: 'url' | 'file',
): Promise<string> {
  if (sourceType === 'file') {
    return readFile(source, 'utf8');
  }
  const response = await fetch(source, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) {
    throw new Error(`failed to download bible json: ${response.status}`);
  }
  return response.text();
}

/** Split an array into deterministic chunks. */
function chunkArray<T>(rows: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let idx = 0; idx < rows.length; idx += size) {
    chunks.push(rows.slice(idx, idx + size));
  }
  return chunks;
}

/** Build normalized scripture rows from key-value map JSON payload. */
function buildParsedVerses(
  verseMap: Record<string, string>,
  translation: string,
): ParsedVerse[] {
  const parsedRows: ParsedVerse[] = [];
  for (const [reference, rawText] of Object.entries(verseMap)) {
    const parsedReference = parseReference(reference);
    if (!parsedReference) continue;
    parsedRows.push({
      translation,
      book: parsedReference.book,
      chapter: parsedReference.chapter,
      verse: parsedReference.verse,
      reference,
      verseText: normalizeVerseText(rawText),
    });
  }
  return parsedRows;
}

/**
 * Import a full-bible JSON map (`reference -> verseText`) into `scripture_verses`.
 * Defaults to a public-domain KJV source.
 */
async function importBibleJson(): Promise<void> {
  const db = getDrizzleDb();
  if (!db) {
    throw new Error('DATABASE_URL is required for db:import:bible-json');
  }

  const translation = (process.env.BIBLE_TRANSLATION ?? 'KJV')
    .trim()
    .toUpperCase();
  const localTranslationPath = path.resolve(
    __dirname,
    `../data/bible/${translation.toLowerCase()}.json`,
  );
  const hasLocalTranslationFile = await canReadFile(localTranslationPath);
  const source =
    process.env.BIBLE_JSON_PATH ??
    (hasLocalTranslationFile ? localTranslationPath : undefined) ??
    process.env.BIBLE_JSON_URL ??
    DEFAULT_KJV_JSON_URL;
  const sourceType: 'url' | 'file' = isHttpUrl(source) ? 'url' : 'file';

  logger.info(
    { sourceType, source, translation, nodeEnv: env.NODE_ENV },
    'Importing bible JSON dataset',
  );

  const content = await readBibleJsonContent(source, sourceType);
  const parsedJson = JSON.parse(content) as Record<string, string>;
  const verseRows = buildParsedVerses(parsedJson, translation);
  if (verseRows.length === 0) {
    throw new Error('no parseable verses found in provided bible JSON source');
  }

  const chunks = chunkArray(verseRows, 1000);
  await db.transaction(async (tx) => {
    await tx
      .delete(scriptureVerses)
      .where(eq(scriptureVerses.translation, translation));
    for (const chunk of chunks) {
      await tx.insert(scriptureVerses).values(chunk);
    }
  });

  logger.info(
    { importedRows: verseRows.length, translation, source },
    'Bible JSON import completed',
  );
}

importBibleJson().catch((err) => {
  logger.error({ err }, 'db:import:bible-json failed');
  process.exitCode = 1;
});
