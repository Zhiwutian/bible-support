import 'dotenv/config';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from '@server/config/env.js';
import { replaceScriptureVersesForTranslation } from '@server/lib/bible-corpus-db-import.js';
import { getDrizzleDb } from '@server/db/drizzle.js';
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

  const importedRows = await replaceScriptureVersesForTranslation(
    db,
    translation,
    parsedJson,
  );

  logger.info(
    { importedRows, translation, source },
    'Bible JSON import completed',
  );
}

importBibleJson().catch((err) => {
  logger.error({ err }, 'db:import:bible-json failed');
  process.exitCode = 1;
});
