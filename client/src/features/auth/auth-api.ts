import type { AuthMeResponse } from '@shared/auth-contracts';
import type { AuthSocialProvider } from '@shared/auth-contracts';
import { resolveApiInput } from '@/lib/api-base-url';
import { fetchJson, fetchNoContent } from '@/lib/api-client';

/** Read current authentication state from server session cookie. */
export async function readAuthMe(): Promise<AuthMeResponse> {
  return fetchJson<AuthMeResponse>('/api/auth/me');
}

/** Redirect browser to server-side OIDC login endpoint. */
export function redirectToLogin(provider?: AuthSocialProvider): void {
  const loginUrl = new URL(String(resolveApiInput('/api/auth/login')));
  if (provider) {
    loginUrl.searchParams.set('provider', provider);
  }
  window.location.href = loginUrl.toString();
}

/** Clear current authenticated session cookie. */
export async function logout(): Promise<void> {
  await fetchNoContent('/api/auth/logout', { method: 'POST' });
}
