import { createApp } from '@server/app.js';
import { env } from '@server/config/env.js';
import { closeDbPool } from '@server/db/pool.js';
import { logger } from '@server/lib/logger.js';

/** Warn when local Auth0 callback origin cannot receive the OIDC state cookie from default Vite + proxy sign-in. */
function warnIfLocalAuthRedirectMismatchesSpa(): void {
  if (env.NODE_ENV !== 'development' || !env.AUTH_ENABLED) return;
  if (!env.AUTH_REDIRECT_URI.trim()) return;
  try {
    const redirect = new URL(env.AUTH_REDIRECT_URI);
    const corsFirst = env.CORS_ORIGIN.split(',')[0]?.trim();
    if (!corsFirst) return;
    const spa = new URL(corsFirst);
    if (redirect.origin === spa.origin) return;
    const isTypicalSplitLocalhost =
      redirect.hostname === 'localhost' &&
      spa.hostname === 'localhost' &&
      redirect.port === '8080' &&
      spa.port === '5173';
    if (isTypicalSplitLocalhost) {
      logger.warn(
        {
          authRedirectOrigin: redirect.origin,
          spaOrigin: spa.origin,
        },
        'AUTH_REDIRECT_URI origin differs from CORS_ORIGIN: sign-in via http://localhost:5173/api/auth/login stores oidc_login_state for :5173, but Auth0 returns to :8080 so the cookie is not sent. Fix: set AUTH_REDIRECT_URI=http://localhost:5173/api/auth/callback (and the same URL in Auth0 Allowed Callback URLs), or set VITE_API_BASE_URL=http://localhost:8080 so the browser uses the API origin for /api (and keep callback on :8080).',
      );
    }
  } catch {
    // ignore invalid URLs
  }
}

const app = createApp();
const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'Listening on port');
  warnIfLocalAuthRedirectMismatchesSpa();
});

let isShuttingDown = false;

/**
 * Gracefully shut down the HTTP server and database pool.
 */
function shutdown(signal: NodeJS.Signals): void {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info({ signal }, 'Received shutdown signal');

  const forceExitTimer = setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
  forceExitTimer.unref();

  server.close(async (serverCloseErr) => {
    if (serverCloseErr) {
      logger.error({ err: serverCloseErr }, 'Error while closing HTTP server');
      process.exit(1);
      return;
    }

    try {
      await closeDbPool();
      logger.info('Graceful shutdown complete');
      process.exit(0);
    } catch (dbCloseErr) {
      logger.error({ err: dbCloseErr }, 'Error while closing database pool');
      process.exit(1);
    }
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
