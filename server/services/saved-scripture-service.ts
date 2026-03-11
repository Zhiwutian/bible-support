import { and, asc, desc, eq, isNull, ne } from 'drizzle-orm';
import type { ScriptureTranslationCode } from '@shared/scripture-search-contracts.js';
import type { CreateSavedScriptureRequest } from '@shared/saved-scripture-contracts.js';
import { savedScriptureItems } from '@server/db/schema.js';
import { ClientError } from '@server/lib/client-error.js';
import { requireDb } from './require-db.js';

export type SavedScriptureOwnerScope = {
  deviceId?: string | null;
  ownerUserId?: string | null;
};

export type CreateSavedScriptureInput = CreateSavedScriptureRequest & {
  scope: SavedScriptureOwnerScope;
};
type SavedScriptureItemRecord = typeof savedScriptureItems.$inferSelect;

/** Build query scope for user-owned or anonymous device-owned saves. */
function ownerScopeWhere(
  scope: SavedScriptureOwnerScope,
): ReturnType<typeof eq> | ReturnType<typeof and> {
  if (scope.ownerUserId) {
    return eq(savedScriptureItems.ownerUserId, scope.ownerUserId);
  }
  if (!scope.deviceId) {
    throw new ClientError(400, 'device id is required for anonymous saves');
  }
  return and(
    eq(savedScriptureItems.deviceId, scope.deviceId),
    isNull(savedScriptureItems.ownerUserId),
  );
}

/** Resolve required device id for anonymous save scope. */
function requiredAnonymousDeviceId(scope: SavedScriptureOwnerScope): string {
  if (scope.deviceId) return scope.deviceId;
  throw new ClientError(400, 'device id is required for anonymous saves');
}

/** List saved scriptures for one scope (authenticated user or device). */
export async function readSavedScriptures(
  scope: SavedScriptureOwnerScope,
): Promise<SavedScriptureItemRecord[]> {
  const db = requireDb();
  return db
    .select()
    .from(savedScriptureItems)
    .where(ownerScopeWhere(scope))
    .orderBy(
      desc(savedScriptureItems.createdAt),
      asc(savedScriptureItems.savedId),
    );
}

/** Create a saved scripture entry for one owner scope. */
export async function createSavedScripture(
  input: CreateSavedScriptureInput,
): Promise<SavedScriptureItemRecord> {
  const db = requireDb();
  const normalizedTranslation = input.translation
    .trim()
    .toUpperCase() as ScriptureTranslationCode;
  const [conflicting] = await db
    .select({ savedId: savedScriptureItems.savedId })
    .from(savedScriptureItems)
    .where(
      and(
        ownerScopeWhere(input.scope),
        eq(savedScriptureItems.translation, normalizedTranslation),
        eq(savedScriptureItems.book, input.book.trim()),
        eq(savedScriptureItems.chapter, input.chapter),
        eq(savedScriptureItems.verseStart, input.verseStart),
        eq(savedScriptureItems.verseEnd, input.verseEnd),
      ),
    )
    .limit(1);
  if (conflicting) {
    throw new ClientError(409, 'this verse range is already saved');
  }

  const [saved] = await db
    .insert(savedScriptureItems)
    .values({
      deviceId: input.scope.ownerUserId
        ? (input.scope.deviceId ?? null)
        : requiredAnonymousDeviceId(input.scope),
      ownerUserId: input.scope.ownerUserId ?? null,
      label: input.label?.trim() || null,
      translation: normalizedTranslation,
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

/** Delete a saved scripture entry scoped to one owner scope. */
export async function removeSavedScripture(
  savedId: number,
  scope: SavedScriptureOwnerScope,
): Promise<void> {
  const db = requireDb();
  const [deleted] = await db
    .delete(savedScriptureItems)
    .where(
      and(eq(savedScriptureItems.savedId, savedId), ownerScopeWhere(scope)),
    )
    .returning({ savedId: savedScriptureItems.savedId });

  if (!deleted) {
    throw new ClientError(404, 'saved scripture not found');
  }
}

/** Update translation for one saved scripture entry scoped to one owner scope. */
export async function updateSavedScriptureTranslation(
  savedId: number,
  scope: SavedScriptureOwnerScope,
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
      and(eq(savedScriptureItems.savedId, savedId), ownerScopeWhere(scope)),
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
        ownerScopeWhere(scope),
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
      and(eq(savedScriptureItems.savedId, savedId), ownerScopeWhere(scope)),
    )
    .returning();
  if (!updated) {
    throw new ClientError(404, 'saved scripture not found');
  }
  return updated;
}

/** Move anonymous device saves into a signed-in user scope once. */
export async function migrateDeviceSavedScripturesToUser(
  deviceId: string,
  ownerUserId: string,
): Promise<void> {
  const db = requireDb();
  const deviceRows = await db
    .select()
    .from(savedScriptureItems)
    .where(
      and(
        eq(savedScriptureItems.deviceId, deviceId),
        isNull(savedScriptureItems.ownerUserId),
      ),
    );
  if (deviceRows.length === 0) return;

  await db.transaction(async (tx) => {
    for (const row of deviceRows) {
      await tx
        .insert(savedScriptureItems)
        .values({
          deviceId,
          ownerUserId,
          label: row.label,
          translation: row.translation,
          book: row.book,
          chapter: row.chapter,
          verseStart: row.verseStart,
          verseEnd: row.verseEnd,
          reference: row.reference,
          sourceMode: row.sourceMode,
          queryText: row.queryText,
        })
        .onConflictDoNothing();
    }
    await tx
      .delete(savedScriptureItems)
      .where(
        and(
          eq(savedScriptureItems.deviceId, deviceId),
          isNull(savedScriptureItems.ownerUserId),
        ),
      );
  });
}
