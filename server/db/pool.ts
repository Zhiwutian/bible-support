import pg from 'pg';
import { env } from '@server/config/env.js';

let pool: pg.Pool | undefined;

/**
 * Return a lazily initialized `pg.Pool` when `DATABASE_URL` is configured.
 * Returns `null` for environments where database access is intentionally disabled.
 */
export function getDbPool(): pg.Pool | null {
  const connectionString = env.DATABASE_URL;
  if (!connectionString) return null;

  if (!pool) {
    pool = new pg.Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
    });
  }

  return pool;
}
