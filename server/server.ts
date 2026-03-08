import { createApp } from '@server/app.js';
import { env } from '@server/config/env.js';
import { closeDbPool } from '@server/db/pool.js';
import { logger } from '@server/lib/logger.js';

const app = createApp();
const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'Listening on port');
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
