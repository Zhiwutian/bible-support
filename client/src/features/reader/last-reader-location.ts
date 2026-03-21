import { z } from 'zod';
import { BIBLE_BOOKS } from '@shared/bible-books';
import { getMaxChaptersForBook } from '@shared/bible-book-chapter-counts';
import type { ScriptureTranslationCode } from '@shared/scripture-search-contracts';
import { SUPPORTED_SCRIPTURE_TRANSLATIONS } from '@shared/scripture-search-contracts';

export const LAST_READER_LOCATION_KEY = 'reader:last-location:v1';

/** Same JSON shape as session; used so new tabs can open the last reader place. */
export const LAST_READER_LOCATION_LS_KEY = 'reader:last-location:v1:crossTab';

const lastReaderLocationSchema = z.object({
  book: z.string(),
  chapter: z.number().int().positive(),
  translation: z.string(),
  verse: z.number().int().positive().optional(),
});

export type LastReaderLocation = z.infer<typeof lastReaderLocationSchema>;

export type ReaderChapterInitialState = {
  book: string;
  chapter: number;
  translation: ScriptureTranslationCode;
};

function isValidBook(book: string): boolean {
  return BIBLE_BOOKS.some((b) => b === book);
}

function isValidTranslation(value: string): value is ScriptureTranslationCode {
  return SUPPORTED_SCRIPTURE_TRANSLATIONS.includes(
    value as ScriptureTranslationCode,
  );
}

function clampChapterForBook(book: string, chapter: number): number {
  return Math.min(Math.max(1, chapter), getMaxChaptersForBook(book));
}

function parseStoredLastReader(raw: string): LastReaderLocation | null {
  try {
    const data = JSON.parse(raw) as unknown;
    const parsed = lastReaderLocationSchema.safeParse(data);
    if (!parsed.success) return null;
    if (!isValidBook(parsed.data.book)) return null;
    if (!isValidTranslation(parsed.data.translation)) return null;
    const chapter = Math.min(
      Math.max(1, parsed.data.chapter),
      getMaxChaptersForBook(parsed.data.book),
    );
    return {
      book: parsed.data.book,
      chapter,
      translation: parsed.data.translation,
      verse: parsed.data.verse,
    };
  } catch {
    return null;
  }
}

/**
 * Persist last reader book/chapter/translation (optional verse) for restore.
 * Writes **sessionStorage** (current tab) and **localStorage** (cross-tab / new tab).
 */
export function saveLastReaderLocation(input: LastReaderLocation): void {
  if (typeof window === 'undefined') return;
  try {
    const parsed = lastReaderLocationSchema.parse(input);
    if (!isValidBook(parsed.book)) return;
    if (!isValidTranslation(parsed.translation)) return;
    const chapter = Math.min(
      Math.max(1, parsed.chapter),
      getMaxChaptersForBook(parsed.book),
    );
    const payload: LastReaderLocation = {
      book: parsed.book,
      chapter,
      translation: parsed.translation,
      verse: parsed.verse,
    };
    const json = JSON.stringify(payload);
    try {
      window.sessionStorage.setItem(LAST_READER_LOCATION_KEY, json);
    } catch {
      // ignore
    }
    try {
      window.localStorage.setItem(LAST_READER_LOCATION_LS_KEY, json);
    } catch {
      // ignore
    }
  } catch {
    // Quota, private mode, or disabled storage — ignore.
  }
}

/** Prefer session (tab), then localStorage (cross-tab). */
export function loadLastReaderLocation(): LastReaderLocation | null {
  if (typeof window === 'undefined') return null;
  try {
    const sessionRaw = window.sessionStorage.getItem(LAST_READER_LOCATION_KEY);
    if (sessionRaw) {
      const fromSession = parseStoredLastReader(sessionRaw);
      if (fromSession) return fromSession;
    }
  } catch {
    // ignore
  }
  try {
    const localRaw = window.localStorage.getItem(LAST_READER_LOCATION_LS_KEY);
    if (localRaw) {
      return parseStoredLastReader(localRaw);
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Resolve initial book/chapter/translation from the URL, else session last-reader, else defaults.
 */
export function getInitialReaderChapterState(
  searchParams: URLSearchParams,
): ReaderChapterInitialState {
  const urlBook = searchParams.get('book');
  const urlChapter = Number(searchParams.get('chapter') ?? '');
  const urlTrans = searchParams.get('translation')?.toUpperCase() ?? '';

  if (
    urlBook &&
    isValidBook(urlBook) &&
    Number.isInteger(urlChapter) &&
    urlChapter > 0 &&
    urlTrans &&
    isValidTranslation(urlTrans)
  ) {
    return {
      book: urlBook,
      chapter: clampChapterForBook(urlBook, urlChapter),
      translation: urlTrans,
    };
  }

  const stored = loadLastReaderLocation();
  if (stored) {
    return {
      book: stored.book,
      chapter: clampChapterForBook(stored.book, stored.chapter),
      translation: stored.translation as ScriptureTranslationCode,
    };
  }

  return {
    book: BIBLE_BOOKS[0],
    chapter: 1,
    translation: 'KJV',
  };
}

/** Href for nav links when user may not have a stored reader location yet. */
export function getLastReaderTo(): string {
  const loc = loadLastReaderLocation();
  if (!loc) return '/reader';
  const p = new URLSearchParams();
  p.set('book', loc.book);
  p.set('chapter', String(loc.chapter));
  p.set('translation', loc.translation);
  if (loc.verse != null && loc.verse > 0) {
    p.set('verse', String(loc.verse));
  }
  return `/reader?${p.toString()}`;
}

export const READER_SCROLL_KEY_PREFIX = 'reader:scroll:v1:';

export function readerScrollStorageKey(
  book: string,
  chapter: number,
  translation: string,
): string {
  return `${READER_SCROLL_KEY_PREFIX}${book}|${chapter}|${translation}`;
}

export function saveReaderScrollPosition(
  book: string,
  chapter: number,
  translation: string,
  scrollTop: number,
): void {
  if (typeof window === 'undefined') return;
  try {
    if (!Number.isFinite(scrollTop) || scrollTop < 0) return;
    window.sessionStorage.setItem(
      readerScrollStorageKey(book, chapter, translation),
      String(Math.round(scrollTop)),
    );
  } catch {
    // ignore
  }
}

export function loadReaderScrollPosition(
  book: string,
  chapter: number,
  translation: string,
): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(
      readerScrollStorageKey(book, chapter, translation),
    );
    if (raw == null) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : null;
  } catch {
    return null;
  }
}
