import type {
  ReaderBookmark,
  ReaderReadingStyle,
} from '@shared/scripture-search-contracts';

export type ReaderTheme = 'light' | 'sepia' | 'dark';
export type ReaderFontFamily = 'serif' | 'sans';
export type ReaderFontSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ReaderLineHeight = 'normal' | 'relaxed' | 'loose';
export type ReaderParagraphSpacing = 'tight' | 'normal' | 'loose';
export type ReaderContentWidth = 'narrow' | 'balanced' | 'wide';

export type ReaderPreferences = {
  theme: ReaderTheme;
  fontFamily: ReaderFontFamily;
  fontSize: ReaderFontSize;
  lineHeight: ReaderLineHeight;
  paragraphSpacing: ReaderParagraphSpacing;
  contentWidth: ReaderContentWidth;
  reducedMotion: boolean;
  readingStyle: ReaderReadingStyle;
  hideTranslationIndicators: boolean;
};

type PersistedReaderPreferences = {
  version: number;
  preferences: ReaderPreferences;
};

/** localStorage key; exported for cross-tab sync in `useReaderPreferencesLive`. */
export const READER_PREFERENCES_STORAGE_KEY = 'reader-preferences';
const READER_BOOKMARK_STORAGE_KEY = 'reader-bookmark';
const READER_PREFERENCES_SCHEMA_VERSION = 5;

export const defaultReaderPreferences: ReaderPreferences = {
  theme: 'sepia',
  fontFamily: 'serif',
  fontSize: 'md',
  lineHeight: 'relaxed',
  paragraphSpacing: 'normal',
  contentWidth: 'balanced',
  reducedMotion: false,
  readingStyle: 'verse',
  hideTranslationIndicators: false,
};

function sanitizeReaderPreferences(value: unknown): ReaderPreferences | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Record<string, unknown>;
  const isTheme =
    candidate.theme === 'light' ||
    candidate.theme === 'sepia' ||
    candidate.theme === 'dark';
  const isFontFamily =
    candidate.fontFamily === 'serif' || candidate.fontFamily === 'sans';
  const isFontSize =
    candidate.fontSize === 'xs' ||
    candidate.fontSize === 'sm' ||
    candidate.fontSize === 'md' ||
    candidate.fontSize === 'lg' ||
    candidate.fontSize === 'xl';
  const isLineHeight =
    candidate.lineHeight === 'normal' ||
    candidate.lineHeight === 'relaxed' ||
    candidate.lineHeight === 'loose';
  const isParagraphSpacing =
    candidate.paragraphSpacing === 'tight' ||
    candidate.paragraphSpacing === 'normal' ||
    candidate.paragraphSpacing === 'loose';
  const isContentWidth =
    candidate.contentWidth === 'narrow' ||
    candidate.contentWidth === 'balanced' ||
    candidate.contentWidth === 'wide';
  const isReducedMotion = typeof candidate.reducedMotion === 'boolean';
  const isReadingStyle =
    candidate.readingStyle === 'verse' ||
    candidate.readingStyle === 'standard' ||
    candidate.readingStyle === 'clean';
  const isHideTranslationIndicators =
    typeof candidate.hideTranslationIndicators === 'boolean';
  if (
    !(
      isTheme &&
      isFontFamily &&
      isFontSize &&
      isLineHeight &&
      isParagraphSpacing &&
      isContentWidth &&
      isReducedMotion &&
      isReadingStyle &&
      isHideTranslationIndicators
    )
  ) {
    return null;
  }
  return {
    theme: candidate.theme as ReaderTheme,
    fontFamily: candidate.fontFamily as ReaderFontFamily,
    fontSize: candidate.fontSize as ReaderFontSize,
    lineHeight: candidate.lineHeight as ReaderLineHeight,
    paragraphSpacing: candidate.paragraphSpacing as ReaderParagraphSpacing,
    contentWidth: candidate.contentWidth as ReaderContentWidth,
    reducedMotion: candidate.reducedMotion as boolean,
    readingStyle: candidate.readingStyle as ReaderReadingStyle,
    hideTranslationIndicators: candidate.hideTranslationIndicators as boolean,
  };
}

function prefersReducedMotionByDefault(): boolean {
  if (
    typeof window === 'undefined' ||
    typeof window.matchMedia !== 'function'
  ) {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function defaultPreferencesWithRuntimeHints(): ReaderPreferences {
  return {
    ...defaultReaderPreferences,
    reducedMotion: prefersReducedMotionByDefault(),
  };
}

function isV1ReaderPreferences(
  value: unknown,
): value is Omit<
  ReaderPreferences,
  'readingStyle' | 'hideTranslationIndicators'
> {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    (candidate.theme === 'light' ||
      candidate.theme === 'sepia' ||
      candidate.theme === 'dark') &&
    (candidate.fontFamily === 'serif' || candidate.fontFamily === 'sans') &&
    (candidate.fontSize === 'sm' ||
      candidate.fontSize === 'xs' ||
      candidate.fontSize === 'md' ||
      candidate.fontSize === 'lg' ||
      candidate.fontSize === 'xl') &&
    (candidate.lineHeight === 'normal' ||
      candidate.lineHeight === 'relaxed' ||
      candidate.lineHeight === 'loose') &&
    (candidate.paragraphSpacing === 'tight' ||
      candidate.paragraphSpacing === 'normal' ||
      candidate.paragraphSpacing === 'loose') &&
    (candidate.contentWidth === 'narrow' ||
      candidate.contentWidth === 'balanced' ||
      candidate.contentWidth === 'wide') &&
    typeof candidate.reducedMotion === 'boolean'
  );
}

function isV2ReaderPreferences(
  value: unknown,
): value is Omit<ReaderPreferences, 'readingStyle'> {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    (candidate.theme === 'light' ||
      candidate.theme === 'sepia' ||
      candidate.theme === 'dark') &&
    (candidate.fontFamily === 'serif' || candidate.fontFamily === 'sans') &&
    (candidate.fontSize === 'sm' ||
      candidate.fontSize === 'xs' ||
      candidate.fontSize === 'md' ||
      candidate.fontSize === 'lg' ||
      candidate.fontSize === 'xl') &&
    (candidate.lineHeight === 'normal' ||
      candidate.lineHeight === 'relaxed' ||
      candidate.lineHeight === 'loose') &&
    (candidate.paragraphSpacing === 'tight' ||
      candidate.paragraphSpacing === 'normal' ||
      candidate.paragraphSpacing === 'loose') &&
    (candidate.contentWidth === 'narrow' ||
      candidate.contentWidth === 'balanced' ||
      candidate.contentWidth === 'wide') &&
    typeof candidate.reducedMotion === 'boolean'
  );
}

function isV3ReaderPreferences(
  value: unknown,
): value is Omit<ReaderPreferences, 'hideTranslationIndicators'> {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    (candidate.theme === 'light' ||
      candidate.theme === 'sepia' ||
      candidate.theme === 'dark') &&
    (candidate.fontFamily === 'serif' || candidate.fontFamily === 'sans') &&
    (candidate.fontSize === 'sm' ||
      candidate.fontSize === 'xs' ||
      candidate.fontSize === 'md' ||
      candidate.fontSize === 'lg' ||
      candidate.fontSize === 'xl') &&
    (candidate.lineHeight === 'normal' ||
      candidate.lineHeight === 'relaxed' ||
      candidate.lineHeight === 'loose') &&
    (candidate.paragraphSpacing === 'tight' ||
      candidate.paragraphSpacing === 'normal' ||
      candidate.paragraphSpacing === 'loose') &&
    (candidate.contentWidth === 'narrow' ||
      candidate.contentWidth === 'balanced' ||
      candidate.contentWidth === 'wide') &&
    typeof candidate.reducedMotion === 'boolean' &&
    (candidate.readingStyle === 'verse' ||
      candidate.readingStyle === 'standard' ||
      candidate.readingStyle === 'clean')
  );
}

/**
 * Read persisted reader preferences, falling back to defaults on invalid data.
 */
export function loadReaderPreferences(): ReaderPreferences {
  if (typeof window === 'undefined')
    return defaultPreferencesWithRuntimeHints();
  const raw = window.localStorage.getItem(READER_PREFERENCES_STORAGE_KEY);
  if (!raw) return defaultPreferencesWithRuntimeHints();
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedReaderPreferences>;
    if (parsed.version === READER_PREFERENCES_SCHEMA_VERSION) {
      return (
        sanitizeReaderPreferences(parsed.preferences) ??
        defaultPreferencesWithRuntimeHints()
      );
    }
    // Legacy v4 payloads may include a removed `breakReminder` field; strip via sanitize.
    if (parsed.version === 4) {
      return (
        sanitizeReaderPreferences(parsed.preferences) ??
        defaultPreferencesWithRuntimeHints()
      );
    }
    // Backward-compatible upgrade path from phase-2 schema.
    if (parsed.version === 1 && isV1ReaderPreferences(parsed.preferences)) {
      return (
        sanitizeReaderPreferences({
          ...parsed.preferences,
          readingStyle: 'verse',
          hideTranslationIndicators: false,
        }) ?? defaultPreferencesWithRuntimeHints()
      );
    }
    if (parsed.version === 2 && isV2ReaderPreferences(parsed.preferences)) {
      return (
        sanitizeReaderPreferences({
          ...parsed.preferences,
          readingStyle: 'verse',
          hideTranslationIndicators: false,
        }) ?? defaultPreferencesWithRuntimeHints()
      );
    }
    if (parsed.version === 3 && isV3ReaderPreferences(parsed.preferences)) {
      return (
        sanitizeReaderPreferences({
          ...parsed.preferences,
          hideTranslationIndicators: false,
        }) ?? defaultPreferencesWithRuntimeHints()
      );
    }
    return defaultPreferencesWithRuntimeHints();
  } catch {
    return defaultPreferencesWithRuntimeHints();
  }
}

/** Same-tab listeners (e.g. embedded `ReaderSurface`) can subscribe to this event name. */
export const READER_PREFERENCES_CHANGED_EVENT = 'reader-preferences-changed';

function dispatchReaderPreferencesChanged(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(READER_PREFERENCES_CHANGED_EVENT));
}

/** Build CSS class string for reader theming (shared by BibleReaderPage and ReaderSurface). */
export function readerPreferencesClassNames(
  preferences: ReaderPreferences,
): string {
  return [
    'reader-root',
    `reader-theme-${preferences.theme}`,
    `reader-font-${preferences.fontFamily}`,
    `reader-size-${preferences.fontSize}`,
    `reader-line-${preferences.lineHeight}`,
    `reader-paragraph-${preferences.paragraphSpacing}`,
    `reader-width-${preferences.contentWidth}`,
    preferences.reducedMotion ? 'reader-reduced-motion' : '',
  ]
    .filter(Boolean)
    .join(' ');
}

/** Persist reader preferences in local storage with version metadata. */
export function saveReaderPreferences(preferences: ReaderPreferences): void {
  if (typeof window === 'undefined') return;
  const payload: PersistedReaderPreferences = {
    version: READER_PREFERENCES_SCHEMA_VERSION,
    preferences,
  };
  window.localStorage.setItem(
    READER_PREFERENCES_STORAGE_KEY,
    JSON.stringify(payload),
  );
  dispatchReaderPreferencesChanged();
}

/** Clear stored reader preferences and return the default profile. */
export function resetReaderPreferences(): ReaderPreferences {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(READER_PREFERENCES_STORAGE_KEY);
    dispatchReaderPreferencesChanged();
  }
  return defaultPreferencesWithRuntimeHints();
}

function isReaderBookmark(value: unknown): value is ReaderBookmark {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.book === 'string' &&
    candidate.book.trim().length > 0 &&
    typeof candidate.chapter === 'number' &&
    Number.isInteger(candidate.chapter) &&
    candidate.chapter > 0 &&
    typeof candidate.verse === 'number' &&
    Number.isInteger(candidate.verse) &&
    candidate.verse > 0 &&
    (candidate.translation === 'KJV' ||
      candidate.translation === 'ASV' ||
      candidate.translation === 'WEB') &&
    typeof candidate.scrollOffset === 'number' &&
    Number.isInteger(candidate.scrollOffset) &&
    candidate.scrollOffset >= 0
  );
}

/** Read persisted local bookmark for guest/fallback reader resume behavior. */
export function loadReaderBookmark(): ReaderBookmark | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(READER_BOOKMARK_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return isReaderBookmark(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Persist local reader bookmark for guest/fallback reader resume behavior. */
export function saveReaderBookmark(bookmark: ReaderBookmark | null): void {
  if (typeof window === 'undefined') return;
  if (!bookmark) {
    window.localStorage.removeItem(READER_BOOKMARK_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(
    READER_BOOKMARK_STORAGE_KEY,
    JSON.stringify(bookmark),
  );
}

/** Remove local bookmark persistence entry. */
export function resetReaderBookmark(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(READER_BOOKMARK_STORAGE_KEY);
}
