import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '@server/config/env.js';
import { ClientError } from './client-error.js';
import type { AdminTokenClaims } from './auth-context.js';

const secret = env.TOKEN_SECRET;

/** Validate bearer token and attach decoded user to request context. */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  // The token must be in the Authorization header: `Bearer <token>`.
  const authorization = req.get('authorization') ?? '';
  const bearerMatch = authorization.match(/^Bearer\s+(.+)$/i);
  const token = bearerMatch?.[1]?.trim();
  if (!token) {
    throw new ClientError(401, 'authentication required');
  }
  req.user = jwt.verify(token, secret) as AdminTokenClaims;
  next();
}
