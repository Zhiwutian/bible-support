import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { type SessionCookieSameSite, env } from '@server/config/env.js';
import type { OidcLoginState, UserSessionPayload } from './auth-types.js';

const sessionCookieName = 'app_session';
const loginStateCookieName = 'oidc_login_state';

/** Parse Cookie header into a key-value map. */
function readCookies(req: Request): Record<string, string> {
  const rawCookie = req.get('cookie');
  if (!rawCookie) return {};
  return rawCookie.split(';').reduce<Record<string, string>>((acc, pair) => {
    const [keyPart, ...valueParts] = pair.trim().split('=');
    if (!keyPart) return acc;
    acc[keyPart] = decodeURIComponent(valueParts.join('='));
    return acc;
  }, {});
}

/** Return shared secure-cookie settings for auth/session cookies. */
function getCookieSettings(): {
  httpOnly: true;
  secure: boolean;
  sameSite: SessionCookieSameSite;
  path: '/';
} {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.SESSION_COOKIE_SAME_SITE,
    path: '/',
  } as const;
}

/** Persist short-lived OIDC state values before redirecting to provider. */
export function setLoginStateCookie(
  res: Response,
  payload: OidcLoginState,
): void {
  const token = jwt.sign(payload, env.SESSION_SECRET, { expiresIn: '10m' });
  res.cookie(loginStateCookieName, token, {
    ...getCookieSettings(),
    maxAge: 10 * 60 * 1000,
  });
}

/** Read and verify OIDC state values from signed cookie. */
export function readLoginStateCookie(req: Request): OidcLoginState | null {
  const token = readCookies(req)[loginStateCookieName];
  if (!token) return null;
  try {
    return jwt.verify(token, env.SESSION_SECRET) as OidcLoginState;
  } catch {
    return null;
  }
}

/** Remove short-lived OIDC login state cookie. */
export function clearLoginStateCookie(res: Response): void {
  res.clearCookie(loginStateCookieName, {
    ...getCookieSettings(),
  });
}

/** Persist signed app session cookie bound to internal user id. */
export function setUserSessionCookie(res: Response, userId: string): void {
  const payload: UserSessionPayload = {
    sid: randomUUID(),
    userId,
  };
  const token = jwt.sign(payload, env.SESSION_SECRET, {
    expiresIn: env.SESSION_TTL_SECONDS,
  });
  res.cookie(sessionCookieName, token, {
    ...getCookieSettings(),
    maxAge: env.SESSION_TTL_SECONDS * 1000,
  });
}

/** Read and verify signed app session cookie. */
export function readUserSessionCookie(req: Request): UserSessionPayload | null {
  const token = readCookies(req)[sessionCookieName];
  if (!token) return null;
  try {
    return jwt.verify(token, env.SESSION_SECRET) as UserSessionPayload;
  } catch {
    return null;
  }
}

/** Clear signed app session cookie. */
export function clearUserSessionCookie(res: Response): void {
  res.clearCookie(sessionCookieName, {
    ...getCookieSettings(),
  });
}
