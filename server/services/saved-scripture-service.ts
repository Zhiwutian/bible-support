import { and, asc, desc, eq, ne } from 'drizzle-orm';
import type { ScriptureTranslationCode } from '@shared/scripture-search-contracts.js';
import { savedScriptureItems } from '@server/db/schema.js';
import { ClientError } from '@server/lib/client-error.js';
import { requireDb } from './require-db.js';

export type CreateSavedScriptureInput = {
  deviceId: string;
  label?: string;
  translation: ScriptureTranslationCode;
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  reference: string;
  sourceMode: string;
  queryText?: string;
};
type SavedScriptureItemRecord = typeof savedScriptureItems.$inferSelect;

/** List saved scriptures for one anonymous device. */
export async function readSavedScriptures(
  deviceId: string,
): Promise<SavedScriptureItemRecord[]> {
  const db = requireDb();
  return db
    .select()
    .from(savedScriptureItems)
    .where(eq(savedScriptureItems.deviceId, deviceId))
    .orderBy(
      desc(savedScriptureItems.createdAt),
      asc(savedScriptureItems.savedId),
    );
}

/** Create a saved scripture entry for one anonymous device. */
export async function createSavedScripture(
  input: CreateSavedScriptureInput,
): Promise<SavedScriptureItemRecord> {
  const db = requireDb();
  const [saved] = await db
    .insert(savedScriptureItems)
    .values({
      deviceId: input.deviceId,
      label: input.label?.trim() || null,
      translation: input.translation.trim().toUpperCase(),
      book: input.book.trim(),
      chapter: input.chapter,
      verseStart: input.verseStart,
      verseEnd: input.verseEnd,
      reference: input.reference.trim(),
      sourceMode: input.sourceMode.trim(),
      queryText: input.queryText?.trim() || null,
    })
    .onConflictDoNothing()
    .returning();

  if (!saved) {
    throw new ClientError(409, 'this verse range is already saved');
  }
  return saved;
}

/** Delete a saved scripture entry scoped to one device. */
export async function removeSavedScripture(
  savedId: number,
  deviceId: string,
): Promise<void> {
  const db = requireDb();
  const [deleted] = await db
    .delete(savedScriptureItems)
    .where(
      and(
        eq(savedScriptureItems.savedId, savedId),
        eq(savedScriptureItems.deviceId, deviceId),
      ),
    )
    .returning({ savedId: savedScriptureItems.savedId });

  if (!deleted) {
    throw new ClientError(404, 'saved scripture not found');
  }
}

/** Update translation for one saved scripture entry scoped to one device. */
export async function updateSavedScriptureTranslation(
  savedId: number,
  deviceId: string,
  translation: ScriptureTranslationCode,
): Promise<SavedScriptureItemRecord> {
  const db = requireDb();
  const normalizedTranslation = translation
    .trim()
    .toUpperCase() as ScriptureTranslationCode;

  const [current] = await db
    .select()
    .from(savedScriptureItems)
    .where(
      and(
        eq(savedScriptureItems.savedId, savedId),
        eq(savedScriptureItems.deviceId, deviceId),
      ),
    )
    .limit(1);

  if (!current) {
    throw new ClientError(404, 'saved scripture not found');
  }
  if (current.translation === normalizedTranslation) {
    return current;
  }

  const [conflicting] = await db
    .select({ savedId: savedScriptureItems.savedId })
    .from(savedScriptureItems)
    .where(
      and(
        eq(savedScriptureItems.deviceId, deviceId),
        eq(savedScriptureItems.translation, normalizedTranslation),
        eq(savedScriptureItems.book, current.book),
        eq(savedScriptureItems.chapter, current.chapter),
        eq(savedScriptureItems.verseStart, current.verseStart),
        eq(savedScriptureItems.verseEnd, current.verseEnd),
        ne(savedScriptureItems.savedId, savedId),
      ),
    )
    .limit(1);
  if (conflicting) {
    throw new ClientError(
      409,
      'this verse range is already saved in the selected translation',
    );
  }

  const [updated] = await db
    .update(savedScriptureItems)
    .set({ translation: normalizedTranslation })
    .where(
      and(
        eq(savedScriptureItems.savedId, savedId),
        eq(savedScriptureItems.deviceId, deviceId),
      ),
    )
    .returning();
  if (!updated) {
    throw new ClientError(404, 'saved scripture not found');
  }
  return updated;
}
