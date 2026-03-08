import { fetchJson } from '@/lib';

export type EmotionTile = {
  emotionId: number;
  slug: string;
  name: string;
  description: string | null;
};

export type ScriptureQuote = {
  scriptureId: number;
  emotionId: number;
  reference: string;
  verseText: string;
  translation: string;
  displayOrder: number;
};

export type ScriptureContext = {
  reference: string;
  chapterReference: string;
  summary: string;
  fullContext?: string;
  sourceName: string;
  sourceUrl: string;
  isFallback: boolean;
};

type EmotionScripturePayload = {
  emotion: EmotionTile;
  scriptures: ScriptureQuote[];
};

type RandomScripturePayload = {
  emotion: EmotionTile;
  scripture: ScriptureQuote;
};

/** Return emotion tiles for the home grid. */
export async function readEmotions(): Promise<EmotionTile[]> {
  return fetchJson<EmotionTile[]>('/api/emotions');
}

/** Return all scriptures for an emotion slug in fixed order. */
export async function readEmotionScriptures(
  slug: string,
): Promise<EmotionScripturePayload> {
  return fetchJson<EmotionScripturePayload>(`/api/emotions/${slug}/scriptures`);
}

/** Return one random scripture for an emotion slug. */
export async function readRandomEmotionScripture(
  slug: string,
): Promise<RandomScripturePayload> {
  return fetchJson<RandomScripturePayload>(
    `/api/emotions/${slug}/scriptures/random`,
  );
}

type ScriptureContextQuery = {
  scriptureId?: number;
  reference?: string;
};

/** Return context summary for one scripture row. */
export async function readScriptureContext(
  query: ScriptureContextQuery,
): Promise<ScriptureContext> {
  const searchParams = new URLSearchParams();
  if (query.scriptureId !== undefined) {
    searchParams.set('scriptureId', String(query.scriptureId));
  }
  if (query.reference) {
    searchParams.set('reference', query.reference);
  }
  return fetchJson<ScriptureContext>(`/api/scripture-context?${searchParams}`);
}
