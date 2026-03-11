import type { AuthMeResponse } from '@shared/auth-contracts';
import { resolveApiInput } from '@/lib/api-base-url';
import { fetchJson, fetchNoContent } from '@/lib/api-client';

/** Read current authentication state from server session cookie. */
export async function readAuthMe(): Promise<AuthMeResponse> {
  return fetchJson<AuthMeResponse>('/api/auth/me');
}

/** Redirect browser to server-side OIDC login endpoint. */
export function redirectToLogin(): void {
  window.location.href = String(resolveApiInput('/api/auth/login'));
}

/** Clear current authenticated session cookie. */
export async function logout(): Promise<void> {
  await fetchNoContent('/api/auth/logout', { method: 'POST' });
}
