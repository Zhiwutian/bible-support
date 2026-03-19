import { and, asc, desc, eq, gt, lt, sql } from 'drizzle-orm';
import { BIBLE_BOOKS } from '@shared/bible-books.js';
import type { ReaderChapterResponse } from '@shared/scripture-search-contracts.js';
import { scriptureVerses } from '@server/db/schema.js';
import { ClientError } from '@server/lib/client-error.js';
import {
  canonicalizeBibleBookName,
  normalizeScriptureTranslationCode,
} from '@server/lib/scripture-normalization.js';
import { mapScriptureVerseRow } from '@server/lib/scripture-verse-row.js';
import { requireDb } from './require-db.js';

/** Read one canonical chapter for reader route with navigation metadata. */
export async function readReaderChapter(input: {
  book: string;
  chapter: number;
  translation: string;
}): Promise<ReaderChapterResponse> {
  const db = requireDb();
  const translation = normalizeScriptureTranslationCode(input.translation);
  const canonicalBook = canonicalizeBibleBookName(input.book);
  if (!canonicalBook) {
    throw new ClientError(400, 'book must be a valid Bible book');
  }

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
  if (input.chapter > maxChapter) {
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
        eq(scriptureVerses.chapter, input.chapter),
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
        lt(scriptureVerses.chapter, input.chapter),
      ),
    )
    .orderBy(desc(scriptureVerses.chapter))
    .limit(1);

  let crossBookPreviousChapter: { book: string; chapter: number } | null = null;
  if (!previousRow) {
    const currentBookIndex = BIBLE_BOOKS.findIndex(
      (bookName) => bookName === canonicalBook,
    );
    for (let index = currentBookIndex - 1; index >= 0; index -= 1) {
      const candidateBook = BIBLE_BOOKS[index];
      const [candidateStats] = await db
        .select({
          lastChapter: sql<number>`max(${scriptureVerses.chapter})`,
        })
        .from(scriptureVerses)
        .where(
          and(
            eq(scriptureVerses.translation, translation),
            eq(scriptureVerses.book, candidateBook),
          ),
        );
      const lastChapter = Number(candidateStats?.lastChapter ?? 0);
      if (!lastChapter) continue;
      crossBookPreviousChapter = {
        book: candidateBook,
        chapter: lastChapter,
      };
      break;
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
        gt(scriptureVerses.chapter, input.chapter),
      ),
    )
    .orderBy(asc(scriptureVerses.chapter))
    .limit(1);

  let crossBookNextChapter: { book: string; chapter: number } | null = null;
  if (!nextRow) {
    const currentBookIndex = BIBLE_BOOKS.findIndex(
      (bookName) => bookName === canonicalBook,
    );
    for (
      let index = currentBookIndex + 1;
      index < BIBLE_BOOKS.length;
      index += 1
    ) {
      const candidateBook = BIBLE_BOOKS[index];
      const [candidateStats] = await db
        .select({
          firstChapter: sql<number>`min(${scriptureVerses.chapter})`,
        })
        .from(scriptureVerses)
        .where(
          and(
            eq(scriptureVerses.translation, translation),
            eq(scriptureVerses.book, candidateBook),
          ),
        );
      const firstChapter = Number(candidateStats?.firstChapter ?? 0);
      if (!firstChapter) continue;
      crossBookNextChapter = {
        book: candidateBook,
        chapter: firstChapter,
      };
      break;
    }
  }

  const nextChapter = nextRow
    ? { book: canonicalBook, chapter: nextRow.chapter }
    : crossBookNextChapter;

  return {
    translation,
    book: canonicalBook,
    chapter: input.chapter,
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
