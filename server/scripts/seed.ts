import { count } from 'drizzle-orm';
import { env } from '@server/config/env.js';
import { getDrizzleDb } from '@server/db/drizzle.js';
import { todos } from '@server/db/schema.js';
import { logger } from '@server/lib/logger.js';

/**
 * Insert starter todo rows if and only if the table is currently empty.
 */
async function seedTodos(): Promise<void> {
  const db = getDrizzleDb();
  if (!db) {
    throw new Error('DATABASE_URL is required to run db:seed');
  }

  // Count first so this script is safe to run repeatedly.
  const [{ total }] = await db.select({ total: count() }).from(todos);
  if (total > 0) {
    logger.info({ total }, 'Skipping seed: todos table already has data');
    return;
  }

  await db
    .insert(todos)
    .values([
      { task: 'Review template docs' },
      { task: 'Create your first feature' },
      { task: 'Ship your MVP' },
    ]);
  logger.info('Seeded starter todos');
}

seedTodos()
  .catch((err) => {
    logger.error({ err }, 'db:seed failed');
    process.exitCode = 1;
  })
  .finally(() => {
    logger.info({ nodeEnv: env.NODE_ENV }, 'db:seed completed');
  });
