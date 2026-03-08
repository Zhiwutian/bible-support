import { DbClient, getDrizzleDb } from '@server/db/drizzle.js';
import { ClientError } from '@server/lib/client-error.js';

/**
 * Return a configured Drizzle DB client or throw a 503 client error.
 * Keeps service-level DB availability behavior consistent across modules.
 */
export function requireDb(): DbClient {
  const db = getDrizzleDb();
  if (!db) {
    throw new ClientError(
      503,
      'database is not configured. set DATABASE_URL and run migrations.',
    );
  }
  return db;
}
