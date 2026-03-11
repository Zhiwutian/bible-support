import type { NextFunction, Request, Response } from 'express';
import { ClientError } from './client-error.js';
import { readUserSessionCookie } from './session-auth.js';

/** Attach authenticated user id from session cookie if present. */
export function attachUserSession(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const session = readUserSessionCookie(req);
  req.authUserId = session?.userId;
  next();
}

/** Require authenticated user session for protected routes. */
export function requireUserSession(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const session = readUserSessionCookie(req);
  if (!session?.userId) {
    throw new ClientError(401, 'authentication required');
  }
  req.authUserId = session.userId;
  next();
}
