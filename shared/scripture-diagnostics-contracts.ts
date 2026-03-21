import type { ScriptureTranslationCode } from './scripture-search-contracts';

export type ScriptureDiagnosticsDatabaseStatus =
  | 'ok'
  | 'unavailable'
  | 'not_configured';

export type ScriptureDiagnosticsFallbackReadiness =
  | 'ready'
  | 'missing_local_files';

export type ScriptureTranslationCount = {
  translation: string;
  verseCount: number;
};

export type LocalTranslationStatus = {
  translation: ScriptureTranslationCode;
  filePath: string;
  present: boolean;
  verseCount: number | null;
  fileSizeBytes: number | null;
};

/** Reader `GET /api/reader/chapter` can use bundled JSON when DB has no `scripture_verses` rows. */
export type ReaderChapterBundledFallback = {
  /** Translation codes with a present `server/data/bible/<code>.json` file. */
  availableTranslations: ScriptureTranslationCode[];
  /** All of `KJV` / `ASV` / `WEB` have local files (full offline Reader coverage for supported codes). */
  allTrackedPresent: boolean;
};

export type ScriptureSourcesDiagnostics = {
  checkedAt: string;
  database: {
    status: ScriptureDiagnosticsDatabaseStatus;
    translationCounts: ScriptureTranslationCount[];
  };
  localFiles: {
    directory: string;
    translations: LocalTranslationStatus[];
  };
  fallbackReadiness: ScriptureDiagnosticsFallbackReadiness;
  readerChapterBundledFallback: ReaderChapterBundledFallback;
};
