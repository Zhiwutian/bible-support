import { and, asc, desc, eq, gt, inArray, lt, sql } from 'drizzle-orm';
import { BIBLE_BOOKS } from '@shared/bible-books.js';
import type { ReaderChapterResponse } from '@shared/scripture-search-contracts.js';
import type { DbClient } from '@server/db/drizzle.js';
import { getDrizzleDb } from '@server/db/drizzle.js';
import { scriptureVerses } from '@server/db/schema.js';
import { ClientError } from '@server/lib/client-error.js';
import { readReaderChapterFromLocalBibleJson } from '@server/lib/local-bible-reader-chapter.js';
import {
  canonicalizeBibleBookName,
  normalizeScriptureTranslationCode,
} from '@server/lib/scripture-normalization.js';
import { mapScriptureVerseRow } from '@server/lib/scripture-verse-row.js';

type ReaderChapterParams = {
  translation: ReturnType<typeof normalizeScriptureTranslationCode>;
  book: string;
  chapter: number;
};

async function readReaderChapterFromDb(
  db: DbClient,
  input: ReaderChapterParams,
): Promise<ReaderChapterResponse> {
  const { translation, book: canonicalBook, chapter } = input;

  const [bookStats] = await db
    .select({
      maxChapter: sql<number>`max(${scriptureVerses.chapter})`,
    })
    .from(scriptureVerses)
    .where(
      and(
        eq(scriptureVerses.translation, translation),
        eq(scriptureVerses.book, canonicalBook),
      ),
    );
  const maxChapter = Number(bookStats?.maxChapter ?? 0);
  if (!maxChapter) {
    throw new ClientError(404, 'no chapters found for the selected book');
  }
  if (chapter > maxChapter) {
    throw new ClientError(
      400,
      `chapter must be between 1 and ${maxChapter} for ${canonicalBook}`,
    );
  }

  const verses = await db
    .select({
      translation: scriptureVerses.translation,
      book: scriptureVerses.book,
      chapter: scriptureVerses.chapter,
      verse: scriptureVerses.verse,
      reference: scriptureVerses.reference,
      verseText: scriptureVerses.verseText,
    })
    .from(scriptureVerses)
    .where(
      and(
        eq(scriptureVerses.translation, translation),
        eq(scriptureVerses.book, canonicalBook),
        eq(scriptureVerses.chapter, chapter),
      ),
    )
    .orderBy(asc(scriptureVerses.verse));
  if (verses.length === 0) {
    throw new ClientError(404, 'no verses found for the selected chapter');
  }

  const [previousRow] = await db
    .select({
      chapter: scriptureVerses.chapter,
    })
    .from(scriptureVerses)
    .where(
      and(
        eq(scriptureVerses.translation, translation),
        eq(scriptureVerses.book, canonicalBook),
        lt(scriptureVerses.chapter, chapter),
      ),
    )
    .orderBy(desc(scriptureVerses.chapter))
    .limit(1);

  let crossBookPreviousChapter: { book: string; chapter: number } | null = null;
  if (!previousRow) {
    const currentBookIndex = BIBLE_BOOKS.findIndex(
      (bookName) => bookName === canonicalBook,
    );
    const priorBooks = BIBLE_BOOKS.slice(0, Math.max(0, currentBookIndex));
    if (priorBooks.length > 0) {
      const priorStats = await db
        .select({
          book: scriptureVerses.book,
          lastChapter: sql<number>`max(${scriptureVerses.chapter})`,
        })
        .from(scriptureVerses)
        .where(
          and(
            eq(scriptureVerses.translation, translation),
            inArray(scriptureVerses.book, priorBooks),
          ),
        )
        .groupBy(scriptureVerses.book);
      const lastByBook = new Map(
        priorStats.map((row) => [row.book, Number(row.lastChapter ?? 0)]),
      );
      for (let index = currentBookIndex - 1; index >= 0; index -= 1) {
        const candidateBook = BIBLE_BOOKS[index];
        const lastChapter = lastByBook.get(candidateBook) ?? 0;
        if (!lastChapter) continue;
        crossBookPreviousChapter = {
          book: candidateBook,
          chapter: lastChapter,
        };
        break;
      }
    }
  }

  const previousChapter = previousRow
    ? { book: canonicalBook, chapter: previousRow.chapter }
    : crossBookPreviousChapter;

  const [nextRow] = await db
    .select({
      chapter: scriptureVerses.chapter,
    })
    .from(scriptureVerses)
    .where(
      and(
        eq(scriptureVerses.translation, translation),
        eq(scriptureVerses.book, canonicalBook),
        gt(scriptureVerses.chapter, chapter),
      ),
    )
    .orderBy(asc(scriptureVerses.chapter))
    .limit(1);

  let crossBookNextChapter: { book: string; chapter: number } | null = null;
  if (!nextRow) {
    const currentBookIndex = BIBLE_BOOKS.findIndex(
      (bookName) => bookName === canonicalBook,
    );
    const laterBooks = BIBLE_BOOKS.slice(currentBookIndex + 1);
    if (laterBooks.length > 0) {
      const nextStats = await db
        .select({
          book: scriptureVerses.book,
          firstChapter: sql<number>`min(${scriptureVerses.chapter})`,
        })
        .from(scriptureVerses)
        .where(
          and(
            eq(scriptureVerses.translation, translation),
            inArray(scriptureVerses.book, laterBooks),
          ),
        )
        .groupBy(scriptureVerses.book);
      const firstByBook = new Map(
        nextStats.map((row) => [row.book, Number(row.firstChapter ?? 0)]),
      );
      for (
        let index = currentBookIndex + 1;
        index < BIBLE_BOOKS.length;
        index += 1
      ) {
        const candidateBook = BIBLE_BOOKS[index];
        const firstChapter = firstByBook.get(candidateBook) ?? 0;
        if (!firstChapter) continue;
        crossBookNextChapter = {
          book: candidateBook,
          chapter: firstChapter,
        };
        break;
      }
    }
  }

  const nextChapter = nextRow
    ? { book: canonicalBook, chapter: nextRow.chapter }
    : crossBookNextChapter;

  return {
    translation,
    book: canonicalBook,
    chapter,
    verses: verses.map((row) => mapScriptureVerseRow(row)),
    displayText: verses
      .map((row) => `${row.reference} ${row.verseText.trim()}`)
      .join('\n'),
    hasPrevious: Boolean(previousChapter),
    hasNext: Boolean(nextChapter),
    previousChapter,
    nextChapter,
  };
}

/**
 * Read one canonical chapter for reader route with navigation metadata.
 * Uses `scripture_verses` when the DB is available; falls back to bundled JSON
 * under `server/data/bible/{kjv,asv,web}.json` when the DB has no corpus or is
 * not configured.
 */
export async function readReaderChapter(input: {
  book: string;
  chapter: number;
  translation: string;
}): Promise<ReaderChapterResponse> {
  const translation = normalizeScriptureTranslationCode(input.translation);
  const canonicalBook = canonicalizeBibleBookName(input.book);
  if (!canonicalBook) {
    throw new ClientError(400, 'book must be a valid Bible book');
  }

  const params: ReaderChapterParams = {
    translation,
    book: canonicalBook,
    chapter: input.chapter,
  };

  const db = getDrizzleDb();
  let dbChapterNotFound: ClientError | null = null;

  if (db) {
    try {
      return await readReaderChapterFromDb(db, params);
    } catch (err) {
      if (err instanceof ClientError && err.status === 404) {
        dbChapterNotFound = err;
      } else {
        throw err;
      }
    }
  }

  const fromLocal = await readReaderChapterFromLocalBibleJson(params);
  if (fromLocal) {
    return fromLocal;
  }

  if (!db) {
    throw new ClientError(
      503,
      'database is not configured and no local bible JSON was found for this translation. set DATABASE_URL or place files under server/data/bible/ (run pnpm -C server db:sync:bible-sources).',
    );
  }

  throw (
    dbChapterNotFound ??
    new ClientError(404, 'no chapters found for the selected book')
  );
}
