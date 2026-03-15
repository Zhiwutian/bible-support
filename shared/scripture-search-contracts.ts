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

export type ReaderChapterVerse = {
  translation: ScriptureTranslationCode;
  book: string;
  chapter: number;
  verse: number;
  reference: string;
  verseText: string;
};

export type ReaderChapterReference = {
  book: string;
  chapter: number;
};

export const READER_READING_STYLES = ['verse', 'standard', 'clean'] as const;
export type ReaderReadingStyle = (typeof READER_READING_STYLES)[number];

export type ReaderPreferencesPayload = {
  theme: 'light' | 'sepia' | 'dark';
  fontFamily: 'serif' | 'sans';
  fontSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  lineHeight: 'normal' | 'relaxed' | 'loose';
  paragraphSpacing: 'tight' | 'normal' | 'loose';
  contentWidth: 'narrow' | 'balanced' | 'wide';
  reducedMotion: boolean;
  breakReminder: boolean;
  readingStyle: ReaderReadingStyle;
  hideTranslationIndicators: boolean;
};

export type ReaderBookmark = {
  book: string;
  chapter: number;
  verse: number;
  translation: ScriptureTranslationCode;
  scrollOffset: number;
};

export type ReaderStateResponse = {
  preferences: ReaderPreferencesPayload | null;
  bookmark: ReaderBookmark | null;
  updatedAt: string | null;
};

export type UpdateReaderStateRequest = {
  preferences?: ReaderPreferencesPayload;
  bookmark?: ReaderBookmark | null;
};

export type ReaderChapterResponse = {
  translation: ScriptureTranslationCode;
  book: string;
  chapter: number;
  verses: ReaderChapterVerse[];
  displayText: string;
  hasPrevious: boolean;
  hasNext: boolean;
  previousChapter: ReaderChapterReference | null;
  nextChapter: ReaderChapterReference | null;
};
export type { SavedScriptureItem } from './saved-scripture-contracts';
