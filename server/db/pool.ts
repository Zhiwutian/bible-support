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
      ssl: env.DB_SSL
        ? {
            rejectUnauthorized: env.DB_SSL_REJECT_UNAUTHORIZED,
          }
        : undefined,
    });
  }

  return pool;
}

/** Gracefully close a previously initialized database pool, if any. */
export async function closeDbPool(): Promise<void> {
  if (!pool) return;
  const existingPool = pool;
  pool = undefined;
  await existingPool.end();
}
