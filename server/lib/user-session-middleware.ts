import type { NextFunction, Request, Response } from 'express';
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
