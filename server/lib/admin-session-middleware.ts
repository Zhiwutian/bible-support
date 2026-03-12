import type { NextFunction, Request, Response } from 'express';
import { requireSessionUserId } from './auth-context.js';
import { ClientError } from './client-error.js';
import { readUserRoleById } from '@server/services/admin-service.js';

/** Require an authenticated session and current admin role. */
export async function requireAdminSession(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const userId = requireSessionUserId(req);
  const role = await readUserRoleById(userId);
  if (role !== 'admin') {
    throw new ClientError(403, 'admin access required');
  }
  next();
}
