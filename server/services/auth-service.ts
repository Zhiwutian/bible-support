import * as oidc from 'openid-client';
import { and, eq, sql } from 'drizzle-orm';
import { env } from '@server/config/env.js';
import { authAccounts, users } from '@server/db/schema.js';
import { ClientError } from '@server/lib/client-error.js';
import type { OidcLoginState } from '@server/lib/auth-types.js';
import { logger } from '@server/lib/logger.js';
import { requireDb } from './require-db.js';

let oidcConfigPromise: Promise<oidc.Configuration> | null = null;

export type ProviderIdentity = {
  providerSubject: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export type AuthUserProfile = {
  userId: string;
  role: 'user' | 'admin';
  displayName: string | null;
  avatarUrl: string | null;
};

/** Return true when OIDC auth feature is enabled. */
export function isAuthEnabled(): boolean {
  return env.AUTH_ENABLED;
}

/** Ensure auth env is configured before running OIDC flow. */
function assertAuthEnabled(): void {
  if (!isAuthEnabled()) {
    throw new ClientError(503, 'authentication is not enabled');
  }
}

/** Build and memoize OpenID client configuration from issuer discovery. */
async function getOidcConfig(): Promise<oidc.Configuration> {
  if (!oidcConfigPromise) {
    const issuer = new URL(env.AUTH_ISSUER);
    const clientAuth = env.AUTH_CLIENT_SECRET
      ? oidc.ClientSecretPost(env.AUTH_CLIENT_SECRET)
      : oidc.None();
    oidcConfigPromise = oidc.discovery(
      issuer,
      env.AUTH_CLIENT_ID,
      undefined,
      clientAuth,
    );
  }
  return oidcConfigPromise;
}

/** Build provider authorization URL for login redirect. */
export async function buildLoginRedirectUrl(
  params: OidcLoginState,
): Promise<string> {
  assertAuthEnabled();
  const config = await getOidcConfig();
  const redirectUrl = oidc.buildAuthorizationUrl(config, {
    redirect_uri: env.AUTH_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid',
    state: params.state,
    nonce: params.nonce,
    code_challenge: await oidc.calculatePKCECodeChallenge(params.codeVerifier),
    code_challenge_method: 'S256',
  });
  return redirectUrl.toString();
}

function normalizeDisplayName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized) return null;
  return normalized.slice(0, 120);
}

function normalizeAvatarUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized) return null;
  if (normalized.length > 2048) return null;
  try {
    const parsed = new URL(normalized);
    const protocol = parsed.protocol.toLowerCase();
    if (env.NODE_ENV === 'production') {
      if (protocol !== 'https:') return null;
    } else if (protocol !== 'https:' && protocol !== 'http:') {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

/** Exchange auth code and return provider identity from verified ID token. */
export async function exchangeCodeForProviderIdentity(input: {
  callbackUrl: URL;
  expectedState: string;
  expectedNonce: string;
  codeVerifier: string;
}): Promise<ProviderIdentity> {
  assertAuthEnabled();
  const config = await getOidcConfig();
  const tokenResponse = await oidc.authorizationCodeGrant(
    config,
    input.callbackUrl,
    {
      expectedState: input.expectedState,
      expectedNonce: input.expectedNonce,
      pkceCodeVerifier: input.codeVerifier,
    },
  );
  const claims = tokenResponse.claims();
  const subject = claims?.sub;
  if (!subject) {
    throw new ClientError(401, 'id token subject claim is missing');
  }
  return {
    providerSubject: subject,
    displayName: normalizeDisplayName(claims?.name),
    avatarUrl: normalizeAvatarUrl(claims?.picture),
  };
}

/** Resolve existing local user by provider subject or create one. */
export async function upsertUserFromProviderIdentity(
  identity: ProviderIdentity,
): Promise<string> {
  const db = requireDb();
  const provider = env.AUTH_PROVIDER.trim().toLowerCase();

  const [existingAccount] = await db
    .select({ userId: authAccounts.userId })
    .from(authAccounts)
    .where(
      and(
        eq(authAccounts.provider, provider),
        eq(authAccounts.providerSubject, identity.providerSubject),
      ),
    )
    .limit(1);
  if (existingAccount?.userId) {
    await db
      .update(users)
      .set({
        displayName: sql`coalesce(${users.displayName}, ${identity.displayName})`,
        avatarUrl: sql`coalesce(${users.avatarUrl}, ${identity.avatarUrl})`,
      })
      .where(eq(users.userId, existingAccount.userId));
    return existingAccount.userId;
  }

  const [createdUser] = await db
    .insert(users)
    .values({
      displayName: identity.displayName,
      avatarUrl: identity.avatarUrl,
    })
    .returning({
      userId: users.userId,
    });
  if (!createdUser) {
    throw new ClientError(500, 'failed to create user');
  }

  const [createdAccount] = await db
    .insert(authAccounts)
    .values({
      userId: createdUser.userId,
      provider,
      providerSubject: identity.providerSubject,
    })
    .onConflictDoNothing()
    .returning({ userId: authAccounts.userId });
  if (createdAccount?.userId) return createdAccount.userId;

  // Rare race: account inserted concurrently after user row creation.
  const [accountAfterRace] = await db
    .select({ userId: authAccounts.userId })
    .from(authAccounts)
    .where(
      and(
        eq(authAccounts.provider, provider),
        eq(authAccounts.providerSubject, identity.providerSubject),
      ),
    )
    .limit(1);
  if (!accountAfterRace?.userId) {
    logger.error(
      { provider, providerSubject: identity.providerSubject },
      'auth account upsert race did not resolve',
    );
    throw new ClientError(500, 'failed to resolve user account');
  }
  return accountAfterRace.userId;
}

/** Return local user profile used by auth session APIs. */
export async function readUserProfileById(
  userId: string,
): Promise<AuthUserProfile | null> {
  const db = requireDb();
  const [row] = await db
    .select({
      userId: users.userId,
      role: users.role,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(eq(users.userId, userId))
    .limit(1);
  if (!row) return null;
  return {
    userId: row.userId,
    role: row.role === 'admin' ? 'admin' : 'user',
    displayName: row.displayName,
    avatarUrl: row.avatarUrl,
  };
}
