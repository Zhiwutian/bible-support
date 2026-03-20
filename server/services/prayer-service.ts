import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import {
  prayerListMembers,
  prayerLists,
  prayerPartnerNotes,
  prayerPartners,
  prayerSessions,
} from '@server/db/schema.js';
import { ClientError } from '@server/lib/client-error.js';
import { requireDb } from './require-db.js';

type PrayerPartnerRow = typeof prayerPartners.$inferSelect;
type PrayerListRow = typeof prayerLists.$inferSelect;
type PrayerListMemberRow = typeof prayerListMembers.$inferSelect;
type PrayerSessionRow = typeof prayerSessions.$inferSelect;
type PrayerPartnerNoteRow = typeof prayerPartnerNotes.$inferSelect;
type PrayerDb = ReturnType<typeof requireDb>;
type PrayerTx = Parameters<Parameters<PrayerDb['transaction']>[0]>[0];

function normalizeOptionalText(
  value: string | null | undefined,
): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function requireOwnedPartner(
  db: PrayerDb | PrayerTx,
  ownerUserId: string,
  partnerId: number,
): Promise<PrayerPartnerRow> {
  const [partner] = await db
    .select()
    .from(prayerPartners)
    .where(
      and(
        eq(prayerPartners.partnerId, partnerId),
        eq(prayerPartners.ownerUserId, ownerUserId),
      ),
    )
    .limit(1);
  if (!partner) {
    throw new ClientError(404, 'prayer partner not found');
  }
  return partner;
}

async function requireOwnedList(
  db: PrayerDb | PrayerTx,
  ownerUserId: string,
  listId: number,
): Promise<PrayerListRow> {
  const [list] = await db
    .select()
    .from(prayerLists)
    .where(
      and(
        eq(prayerLists.listId, listId),
        eq(prayerLists.ownerUserId, ownerUserId),
      ),
    )
    .limit(1);
  if (!list) {
    throw new ClientError(404, 'prayer list not found');
  }
  return list;
}

async function listMembersForList(
  db: PrayerDb | PrayerTx,
  listId: number,
): Promise<PrayerListMemberRow[]> {
  return db
    .select()
    .from(prayerListMembers)
    .where(eq(prayerListMembers.listId, listId))
    .orderBy(asc(prayerListMembers.position), asc(prayerListMembers.partnerId));
}

async function applyMemberOrder(
  tx: PrayerTx,
  listId: number,
  partnerIdsInOrder: number[],
): Promise<void> {
  const current = await listMembersForList(tx, listId);
  const currentIds = current.map((row) => row.partnerId);
  if (currentIds.length !== partnerIdsInOrder.length) {
    throw new ClientError(
      400,
      'partnerIdsInOrder must include all list members',
    );
  }
  const currentIdSet = new Set(currentIds);
  if (
    partnerIdsInOrder.some((partnerId) => !currentIdSet.has(partnerId)) ||
    new Set(partnerIdsInOrder).size !== partnerIdsInOrder.length
  ) {
    throw new ClientError(
      400,
      'partnerIdsInOrder contains invalid partner ids',
    );
  }

  await tx
    .update(prayerListMembers)
    .set({ position: sql`${prayerListMembers.position} + 100000` })
    .where(eq(prayerListMembers.listId, listId));

  for (let idx = 0; idx < partnerIdsInOrder.length; idx += 1) {
    await tx
      .update(prayerListMembers)
      .set({ position: idx + 1 })
      .where(
        and(
          eq(prayerListMembers.listId, listId),
          eq(prayerListMembers.partnerId, partnerIdsInOrder[idx]),
        ),
      );
  }
}

export async function readPrayerPartners(
  ownerUserId: string,
  includeArchived: boolean,
): Promise<PrayerPartnerRow[]> {
  const db = requireDb();
  const conditions = [eq(prayerPartners.ownerUserId, ownerUserId)];
  if (!includeArchived) {
    conditions.push(eq(prayerPartners.isArchived, false));
  }
  return db
    .select()
    .from(prayerPartners)
    .where(and(...conditions))
    .orderBy(asc(prayerPartners.isArchived), asc(prayerPartners.name));
}

export async function readPrayerPartner(
  ownerUserId: string,
  partnerId: number,
): Promise<PrayerPartnerRow> {
  const db = requireDb();
  return requireOwnedPartner(db, ownerUserId, partnerId);
}

export async function createPrayerPartner(input: {
  ownerUserId: string;
  name: string;
  prayerFocus: string;
  imageUrl?: string | null;
}): Promise<PrayerPartnerRow> {
  const db = requireDb();
  const [created] = await db
    .insert(prayerPartners)
    .values({
      ownerUserId: input.ownerUserId,
      name: input.name.trim(),
      prayerFocus: input.prayerFocus.trim(),
      imageUrl: normalizeOptionalText(input.imageUrl),
    })
    .returning();
  if (!created) {
    throw new ClientError(500, 'failed to create prayer partner');
  }
  return created;
}

export async function updatePrayerPartner(
  ownerUserId: string,
  partnerId: number,
  patch: {
    name?: string;
    prayerFocus?: string;
    imageUrl?: string | null;
    isArchived?: boolean;
  },
): Promise<PrayerPartnerRow> {
  const db = requireDb();
  await requireOwnedPartner(db, ownerUserId, partnerId);
  const updates: Partial<typeof prayerPartners.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (patch.name !== undefined) updates.name = patch.name.trim();
  if (patch.prayerFocus !== undefined)
    updates.prayerFocus = patch.prayerFocus.trim();
  if (patch.imageUrl !== undefined)
    updates.imageUrl = normalizeOptionalText(patch.imageUrl);
  if (patch.isArchived !== undefined) updates.isArchived = patch.isArchived;

  const [updated] = await db
    .update(prayerPartners)
    .set(updates)
    .where(
      and(
        eq(prayerPartners.partnerId, partnerId),
        eq(prayerPartners.ownerUserId, ownerUserId),
      ),
    )
    .returning();
  if (!updated) {
    throw new ClientError(404, 'prayer partner not found');
  }
  return updated;
}

export async function removePrayerPartner(
  ownerUserId: string,
  partnerId: number,
): Promise<void> {
  const db = requireDb();
  const [deleted] = await db
    .delete(prayerPartners)
    .where(
      and(
        eq(prayerPartners.partnerId, partnerId),
        eq(prayerPartners.ownerUserId, ownerUserId),
      ),
    )
    .returning({ partnerId: prayerPartners.partnerId });
  if (!deleted) {
    throw new ClientError(404, 'prayer partner not found');
  }
}

export async function readPrayerPartnerNotes(
  ownerUserId: string,
  partnerId: number,
): Promise<PrayerPartnerNoteRow[]> {
  const db = requireDb();
  await requireOwnedPartner(db, ownerUserId, partnerId);
  return db
    .select()
    .from(prayerPartnerNotes)
    .where(
      and(
        eq(prayerPartnerNotes.ownerUserId, ownerUserId),
        eq(prayerPartnerNotes.partnerId, partnerId),
      ),
    )
    .orderBy(
      desc(prayerPartnerNotes.createdAt),
      desc(prayerPartnerNotes.prayerPartnerNoteId),
    );
}

export async function createPrayerPartnerNote(input: {
  ownerUserId: string;
  partnerId: number;
  note: string;
}): Promise<PrayerPartnerNoteRow> {
  const db = requireDb();
  const partner = await requireOwnedPartner(
    db,
    input.ownerUserId,
    input.partnerId,
  );
  const [created] = await db
    .insert(prayerPartnerNotes)
    .values({
      ownerUserId: input.ownerUserId,
      partnerId: input.partnerId,
      partnerNameSnapshot: partner.name,
      note: input.note.trim(),
    })
    .returning();
  if (!created) {
    throw new ClientError(500, 'failed to create prayer partner note');
  }
  return created;
}

export async function updatePrayerPartnerNote(
  ownerUserId: string,
  partnerId: number,
  noteId: number,
  note: string,
): Promise<PrayerPartnerNoteRow> {
  const db = requireDb();
  await requireOwnedPartner(db, ownerUserId, partnerId);
  const [updated] = await db
    .update(prayerPartnerNotes)
    .set({ note: note.trim(), updatedAt: new Date() })
    .where(
      and(
        eq(prayerPartnerNotes.prayerPartnerNoteId, noteId),
        eq(prayerPartnerNotes.ownerUserId, ownerUserId),
        eq(prayerPartnerNotes.partnerId, partnerId),
      ),
    )
    .returning();
  if (!updated) {
    throw new ClientError(404, 'prayer partner note not found');
  }
  return updated;
}

export async function removePrayerPartnerNote(
  ownerUserId: string,
  partnerId: number,
  noteId: number,
): Promise<void> {
  const db = requireDb();
  await requireOwnedPartner(db, ownerUserId, partnerId);
  const [deleted] = await db
    .delete(prayerPartnerNotes)
    .where(
      and(
        eq(prayerPartnerNotes.prayerPartnerNoteId, noteId),
        eq(prayerPartnerNotes.ownerUserId, ownerUserId),
        eq(prayerPartnerNotes.partnerId, partnerId),
      ),
    )
    .returning({ prayerPartnerNoteId: prayerPartnerNotes.prayerPartnerNoteId });
  if (!deleted) {
    throw new ClientError(404, 'prayer partner note not found');
  }
}

export async function readPrayerLists(
  ownerUserId: string,
  includeArchived: boolean,
): Promise<PrayerListRow[]> {
  const db = requireDb();
  const conditions = [eq(prayerLists.ownerUserId, ownerUserId)];
  if (!includeArchived) {
    conditions.push(eq(prayerLists.isArchived, false));
  }
  return db
    .select()
    .from(prayerLists)
    .where(and(...conditions))
    .orderBy(asc(prayerLists.isArchived), asc(prayerLists.name));
}

export async function readPrayerList(
  ownerUserId: string,
  listId: number,
): Promise<PrayerListRow> {
  const db = requireDb();
  return requireOwnedList(db, ownerUserId, listId);
}

export async function createPrayerList(input: {
  ownerUserId: string;
  name: string;
  description?: string | null;
}): Promise<PrayerListRow> {
  const db = requireDb();
  const [created] = await db
    .insert(prayerLists)
    .values({
      ownerUserId: input.ownerUserId,
      name: input.name.trim(),
      description: normalizeOptionalText(input.description),
    })
    .returning();
  if (!created) {
    throw new ClientError(500, 'failed to create prayer list');
  }
  return created;
}

export async function updatePrayerList(
  ownerUserId: string,
  listId: number,
  patch: {
    name?: string;
    description?: string | null;
    isArchived?: boolean;
  },
): Promise<PrayerListRow> {
  const db = requireDb();
  await requireOwnedList(db, ownerUserId, listId);
  const updates: Partial<typeof prayerLists.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (patch.name !== undefined) updates.name = patch.name.trim();
  if (patch.description !== undefined)
    updates.description = normalizeOptionalText(patch.description);
  if (patch.isArchived !== undefined) updates.isArchived = patch.isArchived;
  const [updated] = await db
    .update(prayerLists)
    .set(updates)
    .where(
      and(
        eq(prayerLists.listId, listId),
        eq(prayerLists.ownerUserId, ownerUserId),
      ),
    )
    .returning();
  if (!updated) {
    throw new ClientError(404, 'prayer list not found');
  }
  return updated;
}

export async function removePrayerList(
  ownerUserId: string,
  listId: number,
): Promise<void> {
  const db = requireDb();
  const [deleted] = await db
    .delete(prayerLists)
    .where(
      and(
        eq(prayerLists.listId, listId),
        eq(prayerLists.ownerUserId, ownerUserId),
      ),
    )
    .returning({ listId: prayerLists.listId });
  if (!deleted) {
    throw new ClientError(404, 'prayer list not found');
  }
}

export async function readPrayerListMembers(
  ownerUserId: string,
  listId: number,
): Promise<Array<PrayerListMemberRow & { partner: PrayerPartnerRow }>> {
  const db = requireDb();
  await requireOwnedList(db, ownerUserId, listId);
  const rows = await db
    .select({
      prayerListMember: prayerListMembers,
      partner: prayerPartners,
    })
    .from(prayerListMembers)
    .innerJoin(
      prayerPartners,
      eq(prayerListMembers.partnerId, prayerPartners.partnerId),
    )
    .where(
      and(
        eq(prayerListMembers.listId, listId),
        eq(prayerPartners.ownerUserId, ownerUserId),
      ),
    )
    .orderBy(asc(prayerListMembers.position), asc(prayerListMembers.partnerId));
  return rows.map((row) => ({ ...row.prayerListMember, partner: row.partner }));
}

export async function addPrayerListMember(input: {
  ownerUserId: string;
  listId: number;
  partnerId: number;
  position?: number;
}): Promise<PrayerListMemberRow> {
  const db = requireDb();
  return db.transaction(async (tx) => {
    await requireOwnedList(tx, input.ownerUserId, input.listId);
    await requireOwnedPartner(tx, input.ownerUserId, input.partnerId);
    const [existing] = await tx
      .select()
      .from(prayerListMembers)
      .where(
        and(
          eq(prayerListMembers.listId, input.listId),
          eq(prayerListMembers.partnerId, input.partnerId),
        ),
      )
      .limit(1);
    if (existing) {
      throw new ClientError(409, 'partner already exists in this prayer list');
    }

    const members = await listMembersForList(tx, input.listId);
    const clampedPosition =
      input.position === undefined
        ? members.length + 1
        : Math.max(1, Math.min(input.position, members.length + 1));
    const nextOrder = members.map((row) => row.partnerId);
    nextOrder.splice(clampedPosition - 1, 0, input.partnerId);

    const [created] = await tx
      .insert(prayerListMembers)
      .values({
        listId: input.listId,
        partnerId: input.partnerId,
        position: 1000000,
      })
      .returning();
    if (!created) {
      throw new ClientError(500, 'failed to add prayer list member');
    }
    await applyMemberOrder(tx, input.listId, nextOrder);
    const [ordered] = await tx
      .select()
      .from(prayerListMembers)
      .where(
        and(
          eq(prayerListMembers.listId, input.listId),
          eq(prayerListMembers.partnerId, input.partnerId),
        ),
      )
      .limit(1);
    if (!ordered) {
      throw new ClientError(500, 'failed to order prayer list member');
    }
    return ordered;
  });
}

export async function removePrayerListMember(
  ownerUserId: string,
  listId: number,
  partnerId: number,
): Promise<void> {
  const db = requireDb();
  await requireOwnedList(db, ownerUserId, listId);
  const [deleted] = await db
    .delete(prayerListMembers)
    .where(
      and(
        eq(prayerListMembers.listId, listId),
        eq(prayerListMembers.partnerId, partnerId),
      ),
    )
    .returning({ prayerListMemberId: prayerListMembers.prayerListMemberId });
  if (!deleted) {
    throw new ClientError(404, 'prayer list member not found');
  }

  const remaining = await listMembersForList(db, listId);
  if (remaining.length === 0) return;
  await db.transaction(async (tx) => {
    await applyMemberOrder(
      tx,
      listId,
      remaining.map((row) => row.partnerId),
    );
  });
}

export async function reorderPrayerListMembers(input: {
  ownerUserId: string;
  listId: number;
  partnerIdsInOrder: number[];
}): Promise<PrayerListMemberRow[]> {
  const db = requireDb();
  if (input.partnerIdsInOrder.length === 0) {
    throw new ClientError(
      400,
      'partnerIdsInOrder must include at least one member',
    );
  }
  return db.transaction(async (tx) => {
    await requireOwnedList(tx, input.ownerUserId, input.listId);
    const ownedPartners = await tx
      .select({ partnerId: prayerPartners.partnerId })
      .from(prayerPartners)
      .where(
        and(
          eq(prayerPartners.ownerUserId, input.ownerUserId),
          inArray(prayerPartners.partnerId, input.partnerIdsInOrder),
        ),
      );
    if (ownedPartners.length !== input.partnerIdsInOrder.length) {
      throw new ClientError(
        400,
        'partnerIdsInOrder contains non-owned partner ids',
      );
    }
    await applyMemberOrder(tx, input.listId, input.partnerIdsInOrder);
    return listMembersForList(tx, input.listId);
  });
}

export async function readPrayerSessions(
  ownerUserId: string,
  listId: number,
): Promise<PrayerSessionRow[]> {
  const db = requireDb();
  await requireOwnedList(db, ownerUserId, listId);
  return db
    .select()
    .from(prayerSessions)
    .where(
      and(
        eq(prayerSessions.ownerUserId, ownerUserId),
        eq(prayerSessions.listId, listId),
      ),
    )
    .orderBy(
      desc(prayerSessions.createdAt),
      desc(prayerSessions.prayerSessionId),
    );
}

export async function createPrayerSession(input: {
  ownerUserId: string;
  listId: number;
  note?: string | null;
}): Promise<PrayerSessionRow> {
  const db = requireDb();
  const list = await requireOwnedList(db, input.ownerUserId, input.listId);
  const [created] = await db
    .insert(prayerSessions)
    .values({
      ownerUserId: input.ownerUserId,
      listId: input.listId,
      listNameSnapshot: list.name,
      note: normalizeOptionalText(input.note),
    })
    .returning();
  if (!created) {
    throw new ClientError(500, 'failed to create prayer session');
  }
  return created;
}
