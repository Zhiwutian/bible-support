/**
 * Auth audit event vocabulary — keep in sync with:
 * - `auth_audit_events_event_type_check` in `server/db/schema.ts` / SQL migrations
 * - all `writeAuthAuditEvent({ eventType: ... })` call sites
 */
export const AUTH_AUDIT_EVENT_TYPES = [
  'login_start',
  'callback_success',
  'callback_failure',
  'logout',
  'admin_role_change',
] as const;

export type AuthAuditEventType = (typeof AUTH_AUDIT_EVENT_TYPES)[number];

export const AUTH_AUDIT_OUTCOMES = ['success', 'failure'] as const;

export type AuthAuditOutcome = (typeof AUTH_AUDIT_OUTCOMES)[number];
