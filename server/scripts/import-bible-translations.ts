import 'dotenv/config';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SUPPORTED_SCRIPTURE_TRANSLATIONS } from '@shared/scripture-search-contracts.js';
import { getDrizzleDb } from '@server/db/drizzle.js';
import { replaceScriptureVersesForTranslation } from '@server/lib/bible-corpus-db-import.js';
import { logger } from '@server/lib/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const bibleDataDir = path.resolve(__dirname, '../data/bible');

async function canReadFile(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Import KJV, ASV, and WEB from `server/data/bible/{kjv,asv,web}.json`.
 * Run `pnpm -C server db:sync:bible-sources` first to download/update those files.
 */
async function importAllBundledTranslations(): Promise<void> {
  const db = getDrizzleDb();
  if (!db) {
    throw new Error(
      'DATABASE_URL is required for db:import:bible-translations',
    );
  }

  for (const translation of SUPPORTED_SCRIPTURE_TRANSLATIONS) {
    const filePath = path.join(
      bibleDataDir,
      `${translation.toLowerCase()}.json`,
    );
    if (!(await canReadFile(filePath))) {
      throw new Error(
        `Missing ${filePath}. Run: pnpm -C server db:sync:bible-sources`,
      );
    }
    const raw = await readFile(filePath, 'utf8');
    const map = JSON.parse(raw) as Record<string, string>;
    const importedRows = await replaceScriptureVersesForTranslation(
      db,
      translation,
      map,
    );
    logger.info(
      { translation, importedRows, filePath },
      'Imported bundled translation into scripture_verses',
    );
  }

  logger.info(
    { translations: [...SUPPORTED_SCRIPTURE_TRANSLATIONS] },
    'db:import:bible-translations completed',
  );
}

importAllBundledTranslations().catch((err) => {
  logger.error({ err }, 'db:import:bible-translations failed');
  process.exitCode = 1;
});
