import type { Request } from 'express';
import { ClientError } from './client-error.js';

export type AdminTokenClaims = {
  userId: string | number;
  [key: string]: unknown;
};

/** Read admin bearer-token claims attached by auth middleware. */
export function getAdminClaims(req: Request): AdminTokenClaims | null {
  const claims = req.user as AdminTokenClaims | undefined;
  if (!claims?.userId) return null;
  return claims;
}

/** Read authenticated session user id attached by session middleware. */
export function getSessionUserId(req: Request): string | null {
  return req.authUserId ?? null;
}

/** Require authenticated session user id for user-scoped routes. */
export function requireSessionUserId(req: Request): string {
  const userId = getSessionUserId(req);
  if (!userId) {
    throw new ClientError(401, 'authentication required');
  }
  return userId;
}
