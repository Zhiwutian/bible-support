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

export type CreateSavedScriptureBatchRequest = {
  items: CreateSavedScriptureRequest[];
};

export type UpdateSavedScriptureTranslationRequest = {
  translation: ScriptureTranslationCode;
};

export type UpdateSavedScriptureNoteRequest = {
  note: string | null;
};

export type SavedScriptureItem = {
  savedId: number;
  deviceId: string | null;
  ownerUserId?: string | null;
  label: string | null;
  saveGroupId?: string | null;
  note?: string | null;
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

export type SavedScriptureDisplayItem = SavedScriptureItem & {
  displayText: string;
};

export type SavedScriptureGroup = {
  /**
   * Deterministic group key for rendering. Legacy rows without saveGroupId can
   * use a synthetic key (for example: `legacy:<savedId>`).
   */
  groupId: string;
  saveGroupId: string | null;
  createdAt: string;
  items: SavedScriptureDisplayItem[];
  displayText: string;
  isLegacyUngrouped: boolean;
};

export type SavedScriptureGroupedResponse = {
  groups: SavedScriptureGroup[];
};

export type CreateSavedScriptureBatchResponse = {
  saveGroupId: string;
  items: SavedScriptureItem[];
  displayText: string;
};
