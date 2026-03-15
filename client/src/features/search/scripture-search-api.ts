import type {
  ReaderBookmark,
  ReaderChapterResponse,
  ReaderPreferencesPayload,
  ReaderStateResponse,
  ScriptureSearchMode,
  ScriptureSearchResponse,
  ScriptureTranslationCode,
  UpdateReaderStateRequest,
  ScriptureVerseResult,
} from '@shared/scripture-search-contracts';
import type {
  CreateSavedScriptureBatchRequest,
  CreateSavedScriptureBatchResponse,
  CreateSavedScriptureRequest,
  SavedScriptureGroupedResponse,
  SavedScriptureItem,
  UpdateSavedScriptureNoteRequest,
  UpdateSavedScriptureTranslationRequest,
} from '@shared/saved-scripture-contracts';
import { fetchJson, fetchNoContent } from '@/lib';

export type SearchInput = {
  mode: ScriptureSearchMode;
  q?: string;
  translation: ScriptureTranslationCode;
  book?: string;
  chapter?: number;
  verseStart?: number;
  verseEnd?: number;
  limit?: number;
};

/** Search scriptures across guided, reference, and keyword modes. */
export async function searchScriptures(
  input: SearchInput,
): Promise<ScriptureSearchResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set('mode', input.mode);
  searchParams.set('translation', input.translation);
  if (input.q) searchParams.set('q', input.q);
  if (input.book) searchParams.set('book', input.book);
  if (input.chapter) searchParams.set('chapter', String(input.chapter));
  if (input.verseStart)
    searchParams.set('verseStart', String(input.verseStart));
  if (input.verseEnd) searchParams.set('verseEnd', String(input.verseEnd));
  if (input.limit) searchParams.set('limit', String(input.limit));

  return fetchJson<ScriptureSearchResponse>(
    `/api/scriptures/search?${searchParams.toString()}`,
  );
}

/** Return all saved scripture items for this browser/device. */
export async function readSavedScriptures(): Promise<SavedScriptureItem[]> {
  return fetchJson<SavedScriptureItem[]>('/api/saved-scriptures');
}

/** Return grouped saved scripture payload with backend display formatting. */
export async function readSavedScriptureGroups(): Promise<SavedScriptureGroupedResponse> {
  return fetchJson<SavedScriptureGroupedResponse>(
    '/api/saved-scriptures/grouped',
  );
}

/** Save one verse or verse range for this browser/device. */
export async function saveScripture(
  input: CreateSavedScriptureRequest,
): Promise<SavedScriptureItem> {
  return fetchJson<SavedScriptureItem>('/api/saved-scriptures', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
}

/** Save multiple verses concurrently into a shared save group. */
export async function saveScriptureBatch(
  input: CreateSavedScriptureBatchRequest,
): Promise<CreateSavedScriptureBatchResponse> {
  return fetchJson<CreateSavedScriptureBatchResponse>(
    '/api/saved-scriptures/batch',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    },
  );
}

/** Remove a previously saved scripture item. */
export async function deleteSavedScripture(savedId: number): Promise<void> {
  await fetchNoContent(`/api/saved-scriptures/${savedId}`, {
    method: 'DELETE',
  });
}

/** Update translation for one previously saved scripture item. */
export async function updateSavedScriptureTranslation(
  savedId: number,
  translation: ScriptureTranslationCode,
): Promise<SavedScriptureItem> {
  const payload: UpdateSavedScriptureTranslationRequest = { translation };
  return fetchJson<SavedScriptureItem>(`/api/saved-scriptures/${savedId}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

/** Update note text for one previously saved scripture item. */
export async function updateSavedScriptureNote(
  savedId: number,
  note: string | null,
): Promise<SavedScriptureItem> {
  const payload: UpdateSavedScriptureNoteRequest = { note };
  return fetchJson<SavedScriptureItem>(
    `/api/saved-scriptures/${savedId}/note`,
    {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    },
  );
}

/** Read one Bible chapter payload with backend-formatted display text. */
export async function readReaderChapter(input: {
  book: string;
  chapter: number;
  translation: ScriptureTranslationCode;
}): Promise<ReaderChapterResponse> {
  const searchParams = new URLSearchParams({
    book: input.book,
    chapter: String(input.chapter),
    translation: input.translation,
  });
  return fetchJson<ReaderChapterResponse>(
    `/api/reader/chapter?${searchParams}`,
  );
}

/** Read account-synced reader preferences/bookmark for authenticated user. */
export async function readReaderState(): Promise<ReaderStateResponse> {
  return fetchJson<ReaderStateResponse>('/api/reader/state');
}

/** Patch account-synced reader state for authenticated user. */
export async function updateReaderState(
  input: UpdateReaderStateRequest,
): Promise<ReaderStateResponse> {
  return fetchJson<ReaderStateResponse>('/api/reader/state', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
}

/** Clear account-synced reader state for authenticated user. */
export async function clearReaderState(): Promise<void> {
  await fetchNoContent('/api/reader/state', {
    method: 'DELETE',
  });
}

/** Build normalized payload for updating only reader preferences. */
export function toReaderStatePreferencesPayload(
  preferences: ReaderPreferencesPayload,
): UpdateReaderStateRequest {
  return { preferences };
}

/** Build normalized payload for updating only reader bookmark. */
export function toReaderStateBookmarkPayload(
  bookmark: ReaderBookmark | null,
): UpdateReaderStateRequest {
  return { bookmark };
}

/** Convert verse rows into a contiguous reference span payload for save. */
export function toSavePayload(
  verse: ScriptureVerseResult,
  sourceMode: string,
  queryText?: string,
): CreateSavedScriptureRequest {
  return {
    translation: verse.translation,
    book: verse.book,
    chapter: verse.chapter,
    verseStart: verse.verse,
    verseEnd: verse.verse,
    reference: verse.reference,
    sourceMode,
    queryText,
  };
}
