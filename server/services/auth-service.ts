import * as oidc from 'openid-client';
import { and, eq } from 'drizzle-orm';
import { env } from '@server/config/env.js';
import { authAccounts, users } from '@server/db/schema.js';
import { ClientError } from '@server/lib/client-error.js';
import type { OidcLoginState } from '@server/lib/auth-types.js';
import { logger } from '@server/lib/logger.js';
import { requireDb } from './require-db.js';

let oidcConfigPromise: Promise<oidc.Configuration> | null = null;

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

/** Exchange auth code and return provider subject from verified ID token. */
export async function exchangeCodeForProviderSubject(input: {
  callbackUrl: URL;
  expectedState: string;
  expectedNonce: string;
  codeVerifier: string;
}): Promise<string> {
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
  return subject;
}

/** Resolve existing local user by provider subject or create one. */
export async function upsertUserFromProviderSubject(
  providerSubject: string,
): Promise<string> {
  const db = requireDb();
  const provider = env.AUTH_PROVIDER.trim().toLowerCase();

  const [existingAccount] = await db
    .select({ userId: authAccounts.userId })
    .from(authAccounts)
    .where(
      and(
        eq(authAccounts.provider, provider),
        eq(authAccounts.providerSubject, providerSubject),
      ),
    )
    .limit(1);
  if (existingAccount?.userId) return existingAccount.userId;

  const [createdUser] = await db.insert(users).values({}).returning({
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
      providerSubject,
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
        eq(authAccounts.providerSubject, providerSubject),
      ),
    )
    .limit(1);
  if (!accountAfterRace?.userId) {
    logger.error(
      { provider, providerSubject },
      'auth account upsert race did not resolve',
    );
    throw new ClientError(500, 'failed to resolve user account');
  }
  return accountAfterRace.userId;
}
