import { eq, sql } from 'drizzle-orm';
import type {
  ReaderBookmark,
  ReaderStateResponse,
  UpdateReaderStateRequest,
} from '@shared/scripture-search-contracts.js';
import { normalizeReaderPreferences } from '@server/lib/reader-state-preferences.js';
import { readerState } from '@server/db/schema.js';
import { ClientError } from '@server/lib/client-error.js';
import {
  canonicalizeBibleBookName,
  normalizeReaderBookmarkFields,
  parsePersistedScriptureTranslation,
} from '@server/lib/scripture-normalization.js';
import { requireDb } from './require-db.js';

function normalizeBookmarkFromColumns(row: {
  bookmarkBook: string | null;
  bookmarkChapter: number | null;
  bookmarkVerse: number | null;
  bookmarkTranslation: string | null;
  bookmarkScrollOffset: number | null;
}): ReaderBookmark | null {
  if (
    !row.bookmarkBook ||
    !row.bookmarkChapter ||
    !row.bookmarkVerse ||
    row.bookmarkScrollOffset === null
  ) {
    return null;
  }
  const translation = parsePersistedScriptureTranslation(
    row.bookmarkTranslation,
  );
  if (!translation) return null;
  const book = canonicalizeBibleBookName(row.bookmarkBook);
  if (!book) return null;
  const normalized = normalizeReaderBookmarkFields({
    book,
    chapter: row.bookmarkChapter,
    verse: row.bookmarkVerse,
    translation,
    scrollOffset: row.bookmarkScrollOffset,
  });
  return normalized;
}

export async function readReaderStateByUserId(
  userId: string,
): Promise<ReaderStateResponse> {
  const db = requireDb();
  const [row] = await db
    .select()
    .from(readerState)
    .where(eq(readerState.userId, userId))
    .limit(1);
  if (!row) {
    return {
      preferences: null,
      bookmark: null,
      updatedAt: null,
    };
  }
  return {
    preferences: normalizeReaderPreferences(row.preferences),
    bookmark: normalizeBookmarkFromColumns(row),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function patchReaderStateByUserId(
  userId: string,
  input: UpdateReaderStateRequest,
): Promise<ReaderStateResponse> {
  const db = requireDb();
  const [existing] = await db
    .select()
    .from(readerState)
    .where(eq(readerState.userId, userId))
    .limit(1);

  const nextPreferences =
    input.preferences !== undefined
      ? input.preferences
      : (normalizeReaderPreferences(existing?.preferences) ?? null);
  const existingBookmark = existing
    ? normalizeBookmarkFromColumns(existing)
    : null;
  let nextBookmark: ReaderBookmark | null =
    input.bookmark !== undefined ? input.bookmark : existingBookmark;

  if (nextBookmark !== null) {
    const normalized = normalizeReaderBookmarkFields(nextBookmark);
    if (!normalized) {
      throw new ClientError(400, 'bookmark book must be a valid Bible book');
    }
    nextBookmark = normalized;
  }

  await db
    .insert(readerState)
    .values({
      userId,
      preferences: nextPreferences,
      bookmarkBook: nextBookmark?.book ?? null,
      bookmarkChapter: nextBookmark?.chapter ?? null,
      bookmarkVerse: nextBookmark?.verse ?? null,
      bookmarkTranslation: nextBookmark?.translation ?? null,
      bookmarkScrollOffset: nextBookmark?.scrollOffset ?? null,
    })
    .onConflictDoUpdate({
      target: readerState.userId,
      set: {
        preferences: nextPreferences,
        bookmarkBook: nextBookmark?.book ?? null,
        bookmarkChapter: nextBookmark?.chapter ?? null,
        bookmarkVerse: nextBookmark?.verse ?? null,
        bookmarkTranslation: nextBookmark?.translation ?? null,
        bookmarkScrollOffset: nextBookmark?.scrollOffset ?? null,
        updatedAt: sql`now()`,
      },
    });

  return readReaderStateByUserId(userId);
}

export async function clearReaderStateByUserId(userId: string): Promise<void> {
  const db = requireDb();
  await db.delete(readerState).where(eq(readerState.userId, userId));
}
