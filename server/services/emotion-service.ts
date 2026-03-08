import { and, asc, eq, sql } from 'drizzle-orm';
import { emotions, scriptures } from '@server/db/schema.js';
import { ClientError } from '@server/lib/client-error.js';
import { requireDb } from './require-db.js';

export type EmotionRecord = typeof emotions.$inferSelect;

export type ScriptureRecord = typeof scriptures.$inferSelect;

/** Return all emotion tiles ordered alphabetically by name. */
export async function readEmotions(): Promise<EmotionRecord[]> {
  const db = requireDb();
  return db.select().from(emotions).orderBy(asc(emotions.name));
}

/** Return all scriptures for an emotion slug in fixed display order. */
export async function readEmotionScripturesBySlug(
  slug: string,
): Promise<{ emotion: EmotionRecord; scriptures: ScriptureRecord[] }> {
  const db = requireDb();
  const [emotion] = await db
    .select()
    .from(emotions)
    .where(eq(emotions.slug, slug))
    .limit(1);
  if (!emotion) {
    throw new ClientError(404, 'emotion not found');
  }

  const scriptureRows = await db
    .select()
    .from(scriptures)
    .where(eq(scriptures.emotionId, emotion.emotionId))
    .orderBy(asc(scriptures.displayOrder));

  return { emotion, scriptures: scriptureRows };
}

/** Return a random scripture for an emotion slug. */
export async function readRandomEmotionScriptureBySlug(slug: string): Promise<{
  emotion: EmotionRecord;
  scripture: ScriptureRecord;
}> {
  const db = requireDb();
  const [emotion] = await db
    .select()
    .from(emotions)
    .where(eq(emotions.slug, slug))
    .limit(1);
  if (!emotion) {
    throw new ClientError(404, 'emotion not found');
  }

  const [scripture] = await db
    .select()
    .from(scriptures)
    .where(and(eq(scriptures.emotionId, emotion.emotionId)))
    .orderBy(sql`RANDOM()`)
    .limit(1);

  if (!scripture) {
    throw new ClientError(404, 'no scriptures found for emotion');
  }

  return { emotion, scripture };
}
