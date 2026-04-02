import { BIBLE_BOOKS } from '@shared/bible-books';
import type { ScriptureTranslationCode } from '@shared/scripture-search-contracts';
import { SUPPORTED_SCRIPTURE_TRANSLATIONS } from '@shared/scripture-search-contracts';
import { toChapterReference } from '@/features/emotions/scripture-links';

export type ReaderChapterLinkSource = {
  reference: string;
  /** Verse shown in reader (first verse of range when multi-verse). */
  verse?: number | null;
  book?: string | null;
  chapter?: number | null;
  /** Text translation for chapter fetch. */
  translation: string;
  /** Emotion Support flow: slug for back navigation. */
  emotionSlug?: string | null;
  scriptureId?: number | null;
  /** Support UI translation (may differ from `translation` when falling back). */
  fromTranslation?: string | null;
};

function canonicalizeBook(rawBook: string | null | undefined): string | null {
  if (!rawBook?.trim()) return null;
  const lower = rawBook.trim().toLowerCase();
  const found = BIBLE_BOOKS.find((b) => b.toLowerCase() === lower);
  if (found) return found;
  if (lower === 'psalm') return 'Psalms';
  return rawBook.trim();
}

function parseVerseFromReference(reference: string): number | null {
  const match = reference.match(/:\s*(\d+)/);
  if (!match) return null;
  const v = Number(match[1]);
  return Number.isInteger(v) && v > 0 ? v : null;
}

/**
 * Resolve book, chapter, and verse for `/reader` from API fields and/or reference strings.
 */
export function resolveReaderChapterLocation(
  source: ReaderChapterLinkSource,
): { book: string; chapter: number; verse: number | null } | null {
  const parsedReference = toChapterReference(source.reference);
  const chapterMatch = parsedReference.match(/^(.*)\s+(\d+)$/);
  const fallbackBook = chapterMatch?.[1]?.trim();
  const fallbackChapter = Number(chapterMatch?.[2] ?? '');
  const book =
    canonicalizeBook(source.book ?? fallbackBook) ??
    canonicalizeBook(fallbackBook);
  const chapter = source.chapter ?? fallbackChapter;
  if (!book || !Number.isInteger(chapter) || chapter < 1) return null;
  const verseFromRef = parseVerseFromReference(source.reference);
  const verse =
    source.verse != null && Number.isInteger(source.verse) && source.verse > 0
      ? source.verse
      : verseFromRef;
  return { book, chapter, verse };
}

/**
 * Map a requested translation label to a Reader-supported code (KJV / ASV / WEB).
 * Reader chapter API only serves bundled translations.
 */
export function translationForReaderChapter(
  requested: string | undefined | null,
): {
  translation: ScriptureTranslationCode;
  usedFallback: boolean;
  requestedLabel: string;
} {
  const raw = (requested ?? '').trim();
  const upper = raw.toUpperCase();
  if (
    upper &&
    SUPPORTED_SCRIPTURE_TRANSLATIONS.includes(upper as ScriptureTranslationCode)
  ) {
    return {
      translation: upper as ScriptureTranslationCode,
      usedFallback: false,
      requestedLabel: upper,
    };
  }
  return {
    translation: 'KJV',
    usedFallback: Boolean(raw),
    requestedLabel: upper || raw || '—',
  };
}

export type ReaderChapterQueryResult = {
  searchParams: URLSearchParams;
  usedTranslationFallback: boolean;
  effectiveTranslation: ScriptureTranslationCode;
};

/**
 * Build `/reader` query string and metadata, or `null` if book/chapter cannot be resolved.
 */
export function buildReaderChapterQuery(
  source: ReaderChapterLinkSource,
): ReaderChapterQueryResult | null {
  const loc = resolveReaderChapterLocation(source);
  if (!loc) return null;

  const { translation: normalizedTranslation, usedFallback } =
    translationForReaderChapter(source.translation);

  const params = new URLSearchParams({
    book: loc.book,
    chapter: String(loc.chapter),
    translation: normalizedTranslation,
  });
  if (loc.verse != null) {
    params.set('verse', String(loc.verse));
  }
  if (source.emotionSlug?.trim()) {
    params.set('fromEmotion', source.emotionSlug.trim());
  }
  if (source.scriptureId != null && source.scriptureId > 0) {
    params.set('fromScriptureId', String(source.scriptureId));
  }
  if (source.fromTranslation?.trim()) {
    const ft = source.fromTranslation.toUpperCase();
    if (
      SUPPORTED_SCRIPTURE_TRANSLATIONS.includes(ft as ScriptureTranslationCode)
    ) {
      params.set('fromTranslation', ft);
    }
  }
  return {
    searchParams: params,
    usedTranslationFallback: usedFallback,
    effectiveTranslation: normalizedTranslation,
  };
}

/**
 * Build `/reader` query string params, or `null` if book/chapter cannot be resolved.
 */
export function buildReaderChapterSearchParams(
  source: ReaderChapterLinkSource,
): URLSearchParams | null {
  return buildReaderChapterQuery(source)?.searchParams ?? null;
}
