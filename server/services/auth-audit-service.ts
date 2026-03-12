import { authAuditEvents } from '@server/db/schema.js';
import { logger } from '@server/lib/logger.js';
import { requireDb } from './require-db.js';

export type AuthAuditEventType =
  | 'login_start'
  | 'callback_success'
  | 'callback_failure'
  | 'logout'
  | 'admin_role_change';

type AuthAuditInput = {
  userId?: string | null;
  provider: string;
  eventType: AuthAuditEventType;
  outcome: 'success' | 'failure';
  reason?: string | null;
  message?: string | null;
  ip?: string | null;
  userAgent?: string | null;
};

/**
 * Persist one auth audit event, suppressing persistence failures.
 * Auth flow should not fail solely due to logging failure.
 */
export async function writeAuthAuditEvent(
  input: AuthAuditInput,
): Promise<void> {
  try {
    const db = requireDb();
    await db.insert(authAuditEvents).values({
      userId: input.userId ?? null,
      provider: input.provider,
      eventType: input.eventType,
      outcome: input.outcome,
      reason: input.reason ?? null,
      message: input.message ?? null,
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
    });
  } catch (error) {
    logger.warn(
      { error, eventType: input.eventType },
      'failed to write auth audit event',
    );
  }
}
