export type ScriptureSearchMode = 'guided' | 'reference' | 'keyword';
export type ScriptureSource = 'local' | 'remote';
export const SUPPORTED_SCRIPTURE_TRANSLATIONS = ['KJV', 'ASV', 'WEB'] as const;
export type ScriptureTranslationCode =
  (typeof SUPPORTED_SCRIPTURE_TRANSLATIONS)[number];

export type ScriptureVerseResult = {
  translation: ScriptureTranslationCode;
  book: string;
  chapter: number;
  verse: number;
  reference: string;
  verseText: string;
};

export type ScriptureSearchResponse = {
  mode: ScriptureSearchMode;
  source: ScriptureSource;
  queryText: string;
  total: number;
  verses: ScriptureVerseResult[];
};
export type { SavedScriptureItem } from './saved-scripture-contracts';
