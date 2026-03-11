import pg from 'pg';
import { env } from '@server/config/env.js';
import { logger } from '@server/lib/logger.js';

let pool: pg.Pool | undefined;

/**
 * Return a lazily initialized `pg.Pool` when `DATABASE_URL` is configured.
 * Returns `null` for environments where database access is intentionally disabled.
 */
export function getDbPool(): pg.Pool | null {
  const connectionString = env.DATABASE_URL;
  if (!connectionString) return null;

  if (!pool) {
    // Some managed Postgres URLs embed sslmode in the connection string.
    const hasSslModeInConnectionString =
      /\bsslmode=(require|verify-ca|verify-full)\b/i.test(connectionString);
    const shouldEnableSsl = env.DB_SSL || hasSslModeInConnectionString;
    // Keep production strict by default; make local/dev setups resilient.
    const rejectUnauthorized =
      env.NODE_ENV === 'production' ? env.DB_SSL_REJECT_UNAUTHORIZED : false;

    logger.info(
      {
        dbSslEnabled: shouldEnableSsl,
        dbSslRejectUnauthorized: shouldEnableSsl ? rejectUnauthorized : null,
        dbSslSource: hasSslModeInConnectionString
          ? 'connection_string'
          : env.DB_SSL
            ? 'env'
            : 'disabled',
      },
      'Database SSL configuration',
    );

    pool = new pg.Pool({
      connectionString,
      ssl: shouldEnableSsl
        ? {
            rejectUnauthorized,
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
