import { access, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sql } from 'drizzle-orm';
import { SUPPORTED_SCRIPTURE_TRANSLATIONS } from '@shared/scripture-search-contracts.js';
import type {
  LocalTranslationStatus,
  ScriptureSourcesDiagnostics,
  ScriptureTranslationCount,
} from '@shared/scripture-diagnostics-contracts.js';
import { getDrizzleDb } from '@server/db/drizzle.js';
import { logger } from '@server/lib/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const bibleDataDir = path.resolve(__dirname, '../data/bible');
const trackedTranslations = SUPPORTED_SCRIPTURE_TRANSLATIONS;

/** Read DB counts grouped by translation. */
async function readDatabaseTranslationCounts(): Promise<{
  status: 'ok' | 'unavailable' | 'not_configured';
  translationCounts: ScriptureTranslationCount[];
}> {
  const db = getDrizzleDb();
  if (!db) {
    return {
      status: 'not_configured',
      translationCounts: [],
    };
  }

  try {
    const result = await db.execute<{
      translation: string;
      verse_count: number | string;
    }>(sql`
      select "translation", count(*) as verse_count
      from "scripture_verses"
      group by "translation"
      order by "translation" asc
    `);

    return {
      status: 'ok',
      translationCounts: result.rows.map((row) => ({
        translation: row.translation,
        verseCount: Number(row.verse_count),
      })),
    };
  } catch (err) {
    logger.warn({ err }, 'Failed reading scripture translation DB diagnostics');
    return {
      status: 'unavailable',
      translationCounts: [],
    };
  }
}

/** Return local file diagnostics for tracked public-domain translations. */
async function readLocalFileStatuses(): Promise<LocalTranslationStatus[]> {
  const statuses: LocalTranslationStatus[] = [];

  for (const translation of trackedTranslations) {
    const filePath = path.join(
      bibleDataDir,
      `${translation.toLowerCase()}.json`,
    );
    const relativeFilePath = path.join(
      'server/data/bible',
      `${translation.toLowerCase()}.json`,
    );
    let present = false;
    let verseCount: number | null = null;
    let fileSizeBytes: number | null = null;

    try {
      await access(filePath);
      present = true;
      const [fileStats, content] = await Promise.all([
        stat(filePath),
        readFile(filePath, 'utf8'),
      ]);
      fileSizeBytes = fileStats.size;
      verseCount = Object.keys(
        JSON.parse(content) as Record<string, string>,
      ).length;
    } catch (err) {
      logger.warn(
        { err, filePath, translation },
        'Local bible file missing or unreadable',
      );
    }

    statuses.push({
      translation,
      filePath: relativeFilePath,
      present,
      verseCount,
      fileSizeBytes,
    });
  }

  return statuses;
}

/** Build a diagnostics report for DB + local scripture sources. */
export async function readScriptureSourcesDiagnostics(): Promise<ScriptureSourcesDiagnostics> {
  const [database, localStatuses] = await Promise.all([
    readDatabaseTranslationCounts(),
    readLocalFileStatuses(),
  ]);

  const fallbackReadiness = localStatuses.every((status) => status.present)
    ? 'ready'
    : 'missing_local_files';

  return {
    checkedAt: new Date().toISOString(),
    database,
    localFiles: {
      directory: 'server/data/bible',
      translations: localStatuses,
    },
    fallbackReadiness,
  };
}
