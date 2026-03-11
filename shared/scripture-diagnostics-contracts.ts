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
};
