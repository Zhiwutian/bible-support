import type { ScriptureTranslationCode } from './scripture-search-contracts';

export type CreateSavedScriptureRequest = {
  label?: string;
  translation: ScriptureTranslationCode;
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  reference: string;
  sourceMode: string;
  queryText?: string;
};

export type UpdateSavedScriptureTranslationRequest = {
  translation: ScriptureTranslationCode;
};

export type SavedScriptureItem = {
  savedId: number;
  deviceId: string | null;
  ownerUserId?: string | null;
  label: string | null;
  translation: ScriptureTranslationCode;
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  reference: string;
  sourceMode: string;
  queryText: string | null;
  createdAt: string;
};
