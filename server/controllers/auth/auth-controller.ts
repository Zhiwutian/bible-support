import type { Request, Response } from 'express';
import { ZodError, z } from 'zod';
import type {
  AuthFailureReason,
  AuthMeResponse,
  AuthRedirectOutcome,
  AuthSocialProvider,
} from '@shared/auth-contracts.js';
import { env } from '@server/config/env.js';
import { ClientError } from '@server/lib/client-error.js';
import {
  clearUserSessionCookie,
  clearLoginStateCookie,
  readLoginStateCookie,
  readUserSessionCookie,
  sendError,
  sendSuccess,
  setLoginStateCookie,
  setUserSessionCookie,
} from '@server/lib/index.js';
import {
  buildLoginRedirectUrl,
  exchangeCodeForProviderIdentity,
  isAuthEnabled,
  readUserProfileById,
  upsertUserFromProviderIdentity,
} from '@server/services/auth-service.js';
import { writeAuthAuditEvent } from '@server/services/auth-audit-service.js';
import {
  randomNonce,
  randomPKCECodeVerifier,
  randomState,
} from 'openid-client';

const callbackQuerySchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
});
const loginQuerySchema = z.object({
  provider: z.enum(['google', 'facebook']).optional(),
});

function mapLoginProviderToConnection(
  provider: AuthSocialProvider | undefined,
): string | undefined {
  if (!provider) return undefined;
  if (env.AUTH_PROVIDER.trim().toLowerCase() !== 'auth0') {
    throw new ClientError(400, 'selected sign-in provider is not supported');
  }
  if (provider === 'google') return 'google-oauth2';
  if (provider === 'facebook') return 'facebook';
  return undefined;
}

/** Build post-auth frontend redirect URL with status marker. */
function buildAuthResultRedirectUrl(
  outcome: AuthRedirectOutcome,
  reason?: AuthFailureReason,
  message?: string,
): string {
  const baseUrl =
    env.AUTH_LOGIN_REDIRECT_URI || env.CORS_ORIGIN.split(',')[0]?.trim();
  const url = new URL(baseUrl || 'http://localhost:5173');
  url.searchParams.set('auth', outcome);
  if (reason) url.searchParams.set('reason', reason);
  if (message) url.searchParams.set('message', message);
  return url.toString();
}

/** Return true when request explicitly prefers JSON response format. */
function prefersJson(req: Request): boolean {
  const accepted = req.accepts(['json', 'html']);
  return accepted === 'json';
}

/** Send endpoint-level auth error as JSON or browser redirect. */
function sendAuthFailure(
  req: Request,
  res: Response,
  status: number,
  reason: AuthFailureReason,
  message: string,
): void {
  if (prefersJson(req)) {
    sendError(res, status, {
      code: 'client_error',
      message,
      details: { reason },
    });
    return;
  }
  res.redirect(302, buildAuthResultRedirectUrl('error', reason, message));
}

function readRequestIp(req: Request): string | null {
  return req.ip ? String(req.ip) : null;
}

function readRequestUserAgent(req: Request): string | null {
  const value = req.get('user-agent');
  return value ? value.slice(0, 512) : null;
}

/** Handle GET /api/auth/login by redirecting to provider. */
export async function getAuthLogin(req: Request, res: Response): Promise<void> {
  if (!isAuthEnabled()) {
    sendAuthFailure(
      req,
      res,
      503,
      'auth_not_enabled',
      'authentication is not enabled',
    );
    return;
  }

  try {
    const loginQuery = loginQuerySchema.parse(req.query);
    const connection = mapLoginProviderToConnection(loginQuery.provider);
    await writeAuthAuditEvent({
      provider: env.AUTH_PROVIDER,
      eventType: 'login_start',
      outcome: 'success',
      ip: readRequestIp(req),
      userAgent: readRequestUserAgent(req),
    });
    const state = randomState();
    const nonce = randomNonce();
    const codeVerifier = randomPKCECodeVerifier();
    const redirectUrl = await buildLoginRedirectUrl({
      state,
      nonce,
      codeVerifier,
      connection,
    });

    setLoginStateCookie(res, { state, nonce, codeVerifier });
    res.redirect(302, redirectUrl);
  } catch (error) {
    if (error instanceof ZodError) {
      sendAuthFailure(
        req,
        res,
        400,
        'invalid_callback_request',
        'invalid authentication login request',
      );
      return;
    }
    if (error instanceof ClientError) {
      sendAuthFailure(req, res, error.status, 'auth_failed', error.message);
      return;
    }
    await writeAuthAuditEvent({
      provider: env.AUTH_PROVIDER,
      eventType: 'login_start',
      outcome: 'failure',
      reason: 'server_error',
      message: 'could not start authentication login',
      ip: readRequestIp(req),
      userAgent: readRequestUserAgent(req),
    });
    sendAuthFailure(
      req,
      res,
      500,
      'server_error',
      'could not start authentication login',
    );
  }
}

/** Handle GET /api/auth/callback and establish app session cookie. */
export async function getAuthCallback(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    if (!isAuthEnabled()) {
      sendAuthFailure(
        req,
        res,
        503,
        'auth_not_enabled',
        'authentication is not enabled',
      );
      return;
    }

    if (typeof req.query.error === 'string') {
      clearLoginStateCookie(res);
      await writeAuthAuditEvent({
        provider: env.AUTH_PROVIDER,
        eventType: 'callback_failure',
        outcome: 'failure',
        reason: 'provider_rejected',
        message: 'sign-in was cancelled or rejected by provider',
        ip: readRequestIp(req),
        userAgent: readRequestUserAgent(req),
      });
      sendAuthFailure(
        req,
        res,
        401,
        'provider_rejected',
        'sign-in was cancelled or rejected by provider',
      );
      return;
    }

    const query = callbackQuerySchema.parse(req.query);
    const loginState = readLoginStateCookie(req);
    if (!loginState) {
      throw new ClientError(401, 'missing or expired auth login state');
    }
    if (query.state !== loginState.state) {
      throw new ClientError(401, 'invalid auth state');
    }

    const callbackUrl = new URL(
      req.originalUrl,
      `${req.protocol}://${req.get('host')}`,
    );
    const providerIdentity = await exchangeCodeForProviderIdentity({
      callbackUrl,
      expectedState: loginState.state,
      expectedNonce: loginState.nonce,
      codeVerifier: loginState.codeVerifier,
    });
    const userId = await upsertUserFromProviderIdentity(providerIdentity);

    setUserSessionCookie(res, userId);
    clearLoginStateCookie(res);
    await writeAuthAuditEvent({
      userId,
      provider: env.AUTH_PROVIDER,
      eventType: 'callback_success',
      outcome: 'success',
      ip: readRequestIp(req),
      userAgent: readRequestUserAgent(req),
    });
    res.redirect(302, buildAuthResultRedirectUrl('success'));
  } catch (err) {
    clearLoginStateCookie(res);
    if (err instanceof ZodError) {
      await writeAuthAuditEvent({
        provider: env.AUTH_PROVIDER,
        eventType: 'callback_failure',
        outcome: 'failure',
        reason: 'invalid_callback_request',
        message: 'invalid authentication callback request',
        ip: readRequestIp(req),
        userAgent: readRequestUserAgent(req),
      });
      sendAuthFailure(
        req,
        res,
        400,
        'invalid_callback_request',
        'invalid authentication callback request',
      );
      return;
    }
    if (err instanceof ClientError) {
      const reason =
        err.status === 401
          ? 'invalid_state'
          : err.status >= 500
            ? 'server_error'
            : 'auth_failed';
      await writeAuthAuditEvent({
        provider: env.AUTH_PROVIDER,
        eventType: 'callback_failure',
        outcome: 'failure',
        reason,
        message: err.message,
        ip: readRequestIp(req),
        userAgent: readRequestUserAgent(req),
      });
      sendAuthFailure(req, res, err.status, reason, err.message);
      return;
    }
    await writeAuthAuditEvent({
      provider: env.AUTH_PROVIDER,
      eventType: 'callback_failure',
      outcome: 'failure',
      reason: 'server_error',
      message: 'could not complete authentication callback',
      ip: readRequestIp(req),
      userAgent: readRequestUserAgent(req),
    });
    sendAuthFailure(
      req,
      res,
      500,
      'server_error',
      'could not complete authentication callback',
    );
  }
}

/** Handle POST /api/auth/logout by clearing session cookie. */
export async function postAuthLogout(
  req: Request,
  res: Response,
): Promise<void> {
  const session = readUserSessionCookie(req);
  clearUserSessionCookie(res);
  clearLoginStateCookie(res);
  await writeAuthAuditEvent({
    userId: session?.userId ?? null,
    provider: env.AUTH_PROVIDER,
    eventType: 'logout',
    outcome: 'success',
    ip: readRequestIp(req),
    userAgent: readRequestUserAgent(req),
  });
  res.sendStatus(204);
}

/** Handle GET /api/auth/logout for browser logout redirects. */
export async function getAuthLogout(
  req: Request,
  res: Response,
): Promise<void> {
  const session = readUserSessionCookie(req);
  clearUserSessionCookie(res);
  clearLoginStateCookie(res);
  await writeAuthAuditEvent({
    userId: session?.userId ?? null,
    provider: env.AUTH_PROVIDER,
    eventType: 'logout',
    outcome: 'success',
    ip: readRequestIp(req),
    userAgent: readRequestUserAgent(req),
  });
  if (prefersJson(req)) {
    sendSuccess(res, { loggedOut: true });
    return;
  }
  res.redirect(302, env.AUTH_LOGOUT_REDIRECT_URI);
}

/** Handle GET /api/auth/me with minimal account info. */
export async function getAuthMe(req: Request, res: Response): Promise<void> {
  const session = readUserSessionCookie(req);
  const profile = session?.userId
    ? await readUserProfileById(session.userId)
    : null;
  const payload: AuthMeResponse = {
    isAuthenticated: Boolean(profile?.userId),
    userId: profile?.userId ?? null,
    role: profile?.role ?? null,
    displayName: profile?.displayName ?? null,
    avatarUrl: profile?.avatarUrl ?? null,
  };
  sendSuccess(res, payload);
}
