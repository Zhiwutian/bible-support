export const AUTH_REDIRECT_OUTCOMES = ['success', 'error'] as const;
export type AuthRedirectOutcome = (typeof AUTH_REDIRECT_OUTCOMES)[number];

export const AUTH_FAILURE_REASONS = [
  'provider_rejected',
  'invalid_state',
  'auth_failed',
  'server_error',
  'auth_not_enabled',
  'invalid_callback_request',
] as const;
export type AuthFailureReason = (typeof AUTH_FAILURE_REASONS)[number];

export type AuthRedirectQuery = {
  auth: AuthRedirectOutcome;
  reason?: AuthFailureReason;
  message?: string;
};

export type AuthMeResponse = {
  isAuthenticated: boolean;
  userId: string | null;
};
