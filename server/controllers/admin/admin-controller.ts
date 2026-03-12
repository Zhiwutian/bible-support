import type { Request, Response } from 'express';
import { z } from 'zod';
import type {
  AdminAuthEventsResponse,
  AdminUsersResponse,
  UpdateUserRoleRequest,
} from '@shared/admin-contracts.js';
import { requireSessionUserId, sendSuccess } from '@server/lib/index.js';
import {
  listAuthEvents,
  listUsers,
  updateUserRoleWithSafeguards,
} from '@server/services/admin-service.js';
import { writeAuthAuditEvent } from '@server/services/auth-audit-service.js';
import { env } from '@server/config/env.js';

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().default(20),
});

const roleUpdateSchema = z.object({
  role: z.enum(['user', 'admin']),
  reason: z.string().trim().min(1).max(500),
});

/** Handle GET /api/admin/users with deterministic pagination. */
export async function getAdminUsers(
  req: Request,
  res: Response,
): Promise<void> {
  const pagination = paginationSchema.parse(req.query);
  const normalizedPagination = {
    ...pagination,
    pageSize: Math.min(100, pagination.pageSize),
  };
  const result = await listUsers(normalizedPagination);
  const payload: AdminUsersResponse = {
    items: result.items,
    pagination: {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
    },
  };
  sendSuccess(res, payload);
}

/** Handle GET /api/admin/auth-events with deterministic pagination. */
export async function getAdminAuthEvents(
  req: Request,
  res: Response,
): Promise<void> {
  const pagination = paginationSchema.parse(req.query);
  const normalizedPagination = {
    ...pagination,
    pageSize: Math.min(100, pagination.pageSize),
  };
  const result = await listAuthEvents(normalizedPagination);
  const payload: AdminAuthEventsResponse = {
    items: result.items,
    pagination: {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
    },
  };
  sendSuccess(res, payload);
}

/** Handle PATCH /api/admin/users/:userId/role with safety checks. */
export async function patchAdminUserRole(
  req: Request,
  res: Response,
): Promise<void> {
  const actorUserId = requireSessionUserId(req);
  const targetUserId = z.string().uuid().parse(req.params.userId);
  const payload = roleUpdateSchema.parse(req.body) as UpdateUserRoleRequest;
  const updated = await updateUserRoleWithSafeguards({
    actorUserId,
    targetUserId,
    payload,
  });

  await writeAuthAuditEvent({
    userId: actorUserId,
    provider: env.AUTH_PROVIDER,
    eventType: 'admin_role_change',
    outcome: 'success',
    reason: 'admin_role_change',
    message: `updated role for ${targetUserId} to ${updated.role}: ${payload.reason}`,
    ip: req.ip ?? null,
    userAgent: req.get('user-agent') ?? null,
  });

  sendSuccess(res, updated);
}
