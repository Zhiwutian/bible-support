import { count, desc, eq, sql } from 'drizzle-orm';
import { authAuditEvents, users } from '@server/db/schema.js';
import type { DbClient } from '@server/db/drizzle.js';
import { ClientError } from '@server/lib/client-error.js';
import type {
  AdminAuthEventListItem,
  AdminUserListItem,
  UpdateUserRoleRequest,
} from '@shared/admin-contracts.js';
import { requireDb } from './require-db.js';

type PaginationInput = {
  page: number;
  pageSize: number;
};

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export async function readUserRoleById(
  userId: string,
): Promise<'user' | 'admin'> {
  const db = requireDb();
  const [row] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.userId, userId))
    .limit(1);
  if (!row) {
    throw new ClientError(401, 'invalid authenticated user');
  }
  return row.role === 'admin' ? 'admin' : 'user';
}

export async function listUsers(
  pagination: PaginationInput,
): Promise<PaginatedResult<AdminUserListItem>> {
  const db = requireDb();
  const offset = (pagination.page - 1) * pagination.pageSize;
  const [totalRow] = await db.select({ total: count() }).from(users);
  const rows = await db
    .select({
      userId: users.userId,
      role: users.role,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt), desc(users.userId))
    .limit(pagination.pageSize)
    .offset(offset);
  return {
    items: rows.map((row) => ({
      userId: row.userId,
      role: row.role === 'admin' ? 'admin' : 'user',
      displayName: row.displayName,
      avatarUrl: row.avatarUrl,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
    total: Number(totalRow?.total ?? 0),
    page: pagination.page,
    pageSize: pagination.pageSize,
  };
}

export async function listAuthEvents(
  pagination: PaginationInput,
): Promise<PaginatedResult<AdminAuthEventListItem>> {
  const db = requireDb();
  const offset = (pagination.page - 1) * pagination.pageSize;
  const [totalRow] = await db.select({ total: count() }).from(authAuditEvents);
  const rows = await db
    .select({
      authAuditEventId: authAuditEvents.authAuditEventId,
      userId: authAuditEvents.userId,
      provider: authAuditEvents.provider,
      eventType: authAuditEvents.eventType,
      outcome: authAuditEvents.outcome,
      reason: authAuditEvents.reason,
      message: authAuditEvents.message,
      ip: authAuditEvents.ip,
      userAgent: authAuditEvents.userAgent,
      createdAt: authAuditEvents.createdAt,
    })
    .from(authAuditEvents)
    .orderBy(
      desc(authAuditEvents.createdAt),
      desc(authAuditEvents.authAuditEventId),
    )
    .limit(pagination.pageSize)
    .offset(offset);
  return {
    items: rows.map((row) => ({
      authAuditEventId: row.authAuditEventId,
      userId: row.userId,
      provider: row.provider,
      eventType: row.eventType as AdminAuthEventListItem['eventType'],
      outcome: row.outcome as AdminAuthEventListItem['outcome'],
      reason: row.reason,
      message: row.message,
      ip: row.ip,
      userAgent: row.userAgent,
      createdAt: row.createdAt.toISOString(),
    })),
    total: Number(totalRow?.total ?? 0),
    page: pagination.page,
    pageSize: pagination.pageSize,
  };
}

async function countAdminsForUpdate(
  tx: { execute: DbClient['execute'] },
  targetUserId: string,
): Promise<{ targetRole: 'user' | 'admin'; adminCount: number }> {
  const lockRows = await tx.execute(
    sql`select "userId", "role" from "users" where "role" = 'admin' or "userId" = ${targetUserId} for update`,
  );
  let targetRole: 'user' | 'admin' | null = null;
  let adminCount = 0;
  for (const row of lockRows.rows as Array<{ userId: string; role: string }>) {
    if (row.role === 'admin') adminCount += 1;
    if (row.userId === targetUserId) {
      targetRole = row.role === 'admin' ? 'admin' : 'user';
    }
  }
  if (!targetRole) {
    throw new ClientError(404, 'user not found');
  }
  return { targetRole, adminCount };
}

export async function updateUserRoleWithSafeguards(input: {
  actorUserId: string;
  targetUserId: string;
  payload: UpdateUserRoleRequest;
}): Promise<{ userId: string; role: 'user' | 'admin' }> {
  const db = requireDb();
  const normalizedReason = input.payload.reason.trim();
  if (!normalizedReason) {
    throw new ClientError(400, 'role update reason is required');
  }
  if (normalizedReason.length > 500) {
    throw new ClientError(400, 'role update reason is too long');
  }

  return db.transaction(async (tx) => {
    const { targetRole, adminCount } = await countAdminsForUpdate(
      tx,
      input.targetUserId,
    );

    if (input.payload.role === 'user') {
      if (input.targetUserId === input.actorUserId && targetRole === 'admin') {
        throw new ClientError(409, 'self-demotion is not allowed');
      }
      if (targetRole === 'admin' && adminCount <= 1) {
        throw new ClientError(409, 'at least one admin must remain');
      }
    }

    await tx
      .update(users)
      .set({
        role: input.payload.role,
        updatedAt: sql`now()`,
      })
      .where(eq(users.userId, input.targetUserId));

    return {
      userId: input.targetUserId,
      role: input.payload.role,
    };
  });
}
