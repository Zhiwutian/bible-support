import { eq } from 'drizzle-orm';
import { scriptures } from '@server/db/schema.js';
import { ClientError } from '@server/lib/client-error.js';
import { requireDb } from './require-db.js';

type ScriptureContextPayload = {
  reference: string;
  chapterReference: string;
  summary: string;
  fullContext: string;
  sourceName: string;
  sourceUrl: string;
  isFallback: boolean;
};

/** Build chapter-level fallback for references missing stored context. */
function buildFallbackPayload(reference: string): ScriptureContextPayload {
  const chapterReference = reference.split(':')[0]?.trim() || reference;
  const fallbackText = `This verse sits within ${chapterReference}. Reading the full chapter gives clearer context for who is speaking, the setting, and the complete encouragement around this passage.`;
  return {
    reference,
    chapterReference,
    summary: fallbackText,
    fullContext: fallbackText,
    sourceName: 'Seeded Study Context',
    sourceUrl: '',
    isFallback: true,
  };
}

/** Map a scripture row to a context payload with fallback field defaults. */
function toContextPayload(row: {
  reference: string;
  contextChapterReference: string;
  contextSummary: string;
  fullContext: string;
  contextSourceName: string;
}): ScriptureContextPayload {
  const fallback = buildFallbackPayload(row.reference);
  return {
    reference: row.reference,
    chapterReference: row.contextChapterReference || fallback.chapterReference,
    summary: row.contextSummary || fallback.summary,
    fullContext: row.fullContext || fallback.fullContext,
    sourceName: row.contextSourceName || fallback.sourceName,
    sourceUrl: '',
    isFallback: false,
  };
}

/** Read chapter context summary from database using stable scripture row id. */
export async function readScriptureContextFromScriptureId(
  scriptureId: number,
): Promise<ScriptureContextPayload> {
  const db = requireDb();

  const [row] = await db
    .select({
      reference: scriptures.reference,
      contextChapterReference: scriptures.contextChapterReference,
      contextSummary: scriptures.contextSummary,
      fullContext: scriptures.fullContext,
      contextSourceName: scriptures.contextSourceName,
    })
    .from(scriptures)
    .where(eq(scriptures.scriptureId, scriptureId))
    .limit(1);

  if (!row) {
    throw new ClientError(404, 'scripture not found');
  }

  return toContextPayload(row);
}

/** Legacy fallback: read context by reference string for older clients. */
export async function readScriptureContextFromReference(
  reference: string,
): Promise<ScriptureContextPayload> {
  const db = requireDb();
  const [row] = await db
    .select({
      reference: scriptures.reference,
      contextChapterReference: scriptures.contextChapterReference,
      contextSummary: scriptures.contextSummary,
      fullContext: scriptures.fullContext,
      contextSourceName: scriptures.contextSourceName,
    })
    .from(scriptures)
    .where(eq(scriptures.reference, reference))
    .limit(1);
  if (!row) return buildFallbackPayload(reference);
  return toContextPayload(row);
}
