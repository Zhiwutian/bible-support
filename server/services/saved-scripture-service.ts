import { and, asc, desc, eq, gte, isNull, lte, ne } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import type { ScriptureTranslationCode } from '@shared/scripture-search-contracts.js';
import type {
  CreateSavedScriptureBatchRequest,
  CreateSavedScriptureRequest,
  SavedScriptureDisplayItem,
  SavedScriptureGroupedResponse,
} from '@shared/saved-scripture-contracts.js';
import { savedScriptureItems, scriptureVerses } from '@server/db/schema.js';
import { ClientError } from '@server/lib/client-error.js';
import { requireDb } from './require-db.js';

export type SavedScriptureOwnerScope = {
  deviceId?: string | null;
  ownerUserId?: string | null;
};

export type CreateSavedScriptureInput = CreateSavedScriptureRequest & {
  scope: SavedScriptureOwnerScope;
  saveGroupId?: string | null;
  note?: string | null;
};
type SavedScriptureItemRecord = typeof savedScriptureItems.$inferSelect;
type DrizzleLike = ReturnType<typeof requireDb>;

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

/** Normalize an editable note value and enforce max length. */
function normalizeNoteInput(note: string | null | undefined): string | null {
  if (note === null || note === undefined) return null;
  const trimmed = note.trim();
  if (!trimmed) return null;
  if (trimmed.length > 4000) {
    throw new ClientError(400, 'note must be 4000 characters or less');
  }
  return trimmed;
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

/** Resolve display text for one saved scripture item from local verse corpus. */
async function resolveSavedItemDisplayText(
  db: DrizzleLike,
  item: SavedScriptureItemRecord,
): Promise<string> {
  const rows = await db
    .select({
      verseText: scriptureVerses.verseText,
    })
    .from(scriptureVerses)
    .where(
      and(
        eq(scriptureVerses.translation, item.translation),
        eq(scriptureVerses.book, item.book),
        eq(scriptureVerses.chapter, item.chapter),
        gte(scriptureVerses.verse, item.verseStart),
        lte(scriptureVerses.verse, item.verseEnd),
      ),
    )
    .orderBy(asc(scriptureVerses.verse));
  const expected = item.verseEnd - item.verseStart + 1;
  const verseText =
    rows.length === expected
      ? rows.map((row) => row.verseText.trim()).join(' ')
      : '';
  const body =
    verseText || `Verse text for ${item.reference} is temporarily unavailable.`;
  return `${item.reference} (${item.translation})\n${body}`;
}

/** Read grouped saved scriptures with backend-formatted display text. */
export async function readSavedScriptureGroups(
  scope: SavedScriptureOwnerScope,
): Promise<SavedScriptureGroupedResponse> {
  const db = requireDb();
  const rows = await readSavedScriptures(scope);
  const groups = new Map<
    string,
    {
      saveGroupId: string | null;
      createdAt: string;
      items: SavedScriptureDisplayItem[];
      isLegacyUngrouped: boolean;
    }
  >();
  for (const row of rows) {
    const groupId = row.saveGroupId ?? `legacy:${row.savedId}`;
    const existing = groups.get(groupId);
    const displayText = await resolveSavedItemDisplayText(db, row);
    const displayItem: SavedScriptureDisplayItem = {
      ...row,
      translation: row.translation as ScriptureTranslationCode,
      createdAt: row.createdAt.toISOString(),
      displayText,
    };
    if (!existing) {
      groups.set(groupId, {
        saveGroupId: row.saveGroupId ?? null,
        createdAt: row.createdAt.toISOString(),
        items: [displayItem],
        isLegacyUngrouped: row.saveGroupId === null,
      });
      continue;
    }
    existing.items.push(displayItem);
  }
  const payloadGroups = Array.from(groups.entries())
    .map(([groupId, group]) => ({
      groupId,
      saveGroupId: group.saveGroupId,
      createdAt: group.createdAt,
      items: group.items.slice().sort((a, b) => {
        if (a.chapter !== b.chapter) return a.chapter - b.chapter;
        if (a.verseStart !== b.verseStart) return a.verseStart - b.verseStart;
        if (a.verseEnd !== b.verseEnd) return a.verseEnd - b.verseEnd;
        return a.savedId - b.savedId;
      }),
      displayText: group.items.map((item) => item.displayText).join('\n\n'),
      isLegacyUngrouped: group.isLegacyUngrouped,
    }))
    .sort((a, b) => {
      if (a.createdAt > b.createdAt) return -1;
      if (a.createdAt < b.createdAt) return 1;
      return a.groupId.localeCompare(b.groupId);
    });
  return { groups: payloadGroups };
}

/** Create a saved scripture entry for one owner scope. */
export async function createSavedScripture(
  input: CreateSavedScriptureInput,
  dbInput?: DrizzleLike,
): Promise<SavedScriptureItemRecord> {
  const db = dbInput ?? requireDb();
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
      saveGroupId: input.saveGroupId ?? null,
      note: normalizeNoteInput(input.note),
    })
    .onConflictDoNothing()
    .returning();

  if (!saved) {
    throw new ClientError(409, 'this verse range is already saved');
  }
  return saved;
}

/** Save multiple scriptures concurrently as one deterministic save group. */
export async function createSavedScriptureBatch(
  scope: SavedScriptureOwnerScope,
  request: CreateSavedScriptureBatchRequest,
): Promise<{
  saveGroupId: string;
  items: SavedScriptureItemRecord[];
  displayText: string;
}> {
  if (request.items.length === 0) {
    throw new ClientError(400, 'batch save requires at least one item');
  }
  if (request.items.length > 100) {
    throw new ClientError(400, 'batch save supports at most 100 verses');
  }
  const db = requireDb();
  const saveGroupId = randomUUID();
  const savedItems = await db.transaction(async (tx) => {
    const created: SavedScriptureItemRecord[] = [];
    for (const item of request.items) {
      const saved = await createSavedScripture(
        {
          ...item,
          scope,
          saveGroupId,
        },
        tx,
      );
      created.push(saved);
    }
    return created;
  });
  const displayParts: string[] = [];
  for (const item of savedItems) {
    displayParts.push(await resolveSavedItemDisplayText(db, item));
  }
  return {
    saveGroupId,
    items: savedItems,
    displayText: displayParts.join('\n\n'),
  };
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

/** Update note text for one saved scripture entry scoped to one owner scope. */
export async function updateSavedScriptureNote(
  savedId: number,
  scope: SavedScriptureOwnerScope,
  note: string | null,
): Promise<SavedScriptureItemRecord> {
  const db = requireDb();
  const normalizedNote = normalizeNoteInput(note);
  const [updated] = await db
    .update(savedScriptureItems)
    .set({ note: normalizedNote })
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
