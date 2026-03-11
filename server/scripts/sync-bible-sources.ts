import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BIBLE_BOOKS } from '@shared/bible-books.js';
import { logger } from '@server/lib/logger.js';

const KJV_SOURCE_URL =
  'https://raw.githubusercontent.com/farskipper/kjv/master/json/verses-1769.json';
const ASV_SOURCE_URL =
  'https://raw.githubusercontent.com/bibleapi/bibleapi-bibles-json/master/asv.json';
const WEB_BOOK_LIST_URL =
  'https://api.github.com/repos/TehShrike/world-english-bible/contents/json?ref=master&per_page=100';
const WEB_BOOK_RAW_BASE_URL =
  'https://raw.githubusercontent.com/TehShrike/world-english-bible/master/json';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const bibleDataDir = path.resolve(__dirname, '../data/bible');

type ReferenceMap = Record<string, string>;

type AsvPayload = {
  resultset?: {
    row?: Array<{ field?: [number, number, number, number, string] }>;
  };
};

type WebBookEntry = {
  type?: string;
  chapterNumber?: number;
  verseNumber?: number;
  value?: string;
};

type GitHubListItem = {
  name: string;
  download_url: string | null;
};

/** Keep text compact and remove paragraph markers. */
function normalizeText(value: string): string {
  return value.replace(/^#\s*/, '').replace(/\s+/g, ' ').trim();
}

/** Resolve ASV numeric book index into canonical book label. */
function asvBookName(bookNumber: number): string {
  const label = BIBLE_BOOKS[bookNumber - 1];
  if (!label) {
    throw new Error(`unknown ASV book number: ${bookNumber}`);
  }
  return label;
}

/** Download and parse JSON payload from URL. */
async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
  if (!response.ok) {
    throw new Error(`failed to fetch ${url}: ${response.status}`);
  }
  return (await response.json()) as T;
}

/** Build KJV reference map (already in desired shape). */
async function loadKjvMap(): Promise<ReferenceMap> {
  const payload = await fetchJson<Record<string, string>>(KJV_SOURCE_URL);
  return payload;
}

/** Build ASV reference map from bibleapi row/field payload shape. */
async function loadAsvMap(): Promise<ReferenceMap> {
  const payload = await fetchJson<AsvPayload>(ASV_SOURCE_URL);
  const rows = payload.resultset?.row ?? [];
  const map: ReferenceMap = {};
  for (const row of rows) {
    const field = row.field;
    if (!field) continue;
    const [, bookNumber, chapterNumber, verseNumber, verseText] = field;
    if (!bookNumber || !chapterNumber || !verseNumber || !verseText) continue;
    const book = asvBookName(bookNumber);
    const reference = `${book} ${chapterNumber}:${verseNumber}`;
    map[reference] = normalizeText(verseText);
  }
  return map;
}

/** Build WEB reference map by flattening per-book JSON arrays. */
async function loadWebMap(): Promise<ReferenceMap> {
  const list = await fetchJson<GitHubListItem[]>(WEB_BOOK_LIST_URL);
  const map: ReferenceMap = {};

  for (const item of list) {
    const fileName = item.name;
    const bookLabel = fileName.replace(/\.json$/i, '');
    const canonicalBook = BIBLE_BOOKS.find(
      (book) =>
        book.toLowerCase().replace(/\s+/g, '') === bookLabel.toLowerCase(),
    );
    if (!canonicalBook) continue;

    const bookUrl = `${WEB_BOOK_RAW_BASE_URL}/${fileName}`;
    const entries = await fetchJson<WebBookEntry[]>(bookUrl);
    for (const entry of entries) {
      if (!entry.chapterNumber || !entry.verseNumber || !entry.value) continue;
      const reference = `${canonicalBook} ${entry.chapterNumber}:${entry.verseNumber}`;
      const nextChunk = normalizeText(entry.value);
      map[reference] = map[reference]
        ? normalizeText(`${map[reference]} ${nextChunk}`)
        : nextChunk;
    }
  }
  return map;
}

/** Write translation map to local server storage as JSON. */
async function writeTranslationMap(
  translation: 'kjv' | 'asv' | 'web',
  map: ReferenceMap,
): Promise<void> {
  await mkdir(bibleDataDir, { recursive: true });
  const outputPath = path.join(bibleDataDir, `${translation}.json`);
  await writeFile(outputPath, JSON.stringify(map), 'utf8');
  logger.info(
    {
      translation: translation.toUpperCase(),
      verses: Object.keys(map).length,
      outputPath,
    },
    'Wrote local bible JSON',
  );
}

/** Sync local server bible JSON copies for KJV, ASV, and WEB. */
async function syncBibleSources(): Promise<void> {
  logger.info('Syncing local bible JSON sources (KJV, ASV, WEB)');
  const [kjv, asv, web] = await Promise.all([
    loadKjvMap(),
    loadAsvMap(),
    loadWebMap(),
  ]);
  await writeTranslationMap('kjv', kjv);
  await writeTranslationMap('asv', asv);
  await writeTranslationMap('web', web);
  logger.info('Bible JSON source sync completed');
}

syncBibleSources().catch((err) => {
  logger.error({ err }, 'db:sync:bible-sources failed');
  process.exitCode = 1;
});
