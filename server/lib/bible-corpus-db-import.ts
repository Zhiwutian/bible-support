import { eq } from 'drizzle-orm';
import type { DbClient } from '@server/db/drizzle.js';
import { scriptureVerses } from '@server/db/schema.js';
import {
  normalizeBibleJsonVerseText,
  parseBibleJsonMapReference,
} from '@server/lib/bible-json-map-reference.js';

type ParsedVerse = {
  translation: string;
  book: string;
  chapter: number;
  verse: number;
  reference: string;
  verseText: string;
};

/** Split an array into deterministic insert chunks. */
function chunkArray<T>(rows: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let idx = 0; idx < rows.length; idx += size) {
    chunks.push(rows.slice(idx, idx + size));
  }
  return chunks;
}

/** Build normalized rows for `scripture_verses` from a reference map. */
export function buildParsedVersesFromMap(
  verseMap: Record<string, string>,
  translation: string,
): ParsedVerse[] {
  const parsedRows: ParsedVerse[] = [];
  for (const [reference, rawText] of Object.entries(verseMap)) {
    const parsedReference = parseBibleJsonMapReference(reference);
    if (!parsedReference) continue;
    parsedRows.push({
      translation,
      book: parsedReference.book,
      chapter: parsedReference.chapter,
      verse: parsedReference.verse,
      reference,
      verseText: normalizeBibleJsonVerseText(rawText),
    });
  }
  return parsedRows;
}

/**
 * Replace all `scripture_verses` rows for one translation from a JSON map.
 * @returns number of verse rows inserted
 */
export async function replaceScriptureVersesForTranslation(
  db: DbClient,
  translation: string,
  verseMap: Record<string, string>,
): Promise<number> {
  const verseRows = buildParsedVersesFromMap(verseMap, translation);
  if (verseRows.length === 0) {
    throw new Error('no parseable verses found in bible JSON map');
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

  return verseRows.length;
}
