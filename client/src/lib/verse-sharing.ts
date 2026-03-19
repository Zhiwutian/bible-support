import { BIBLE_BOOKS } from '@shared/bible-books';
import { getMaxChaptersForBook } from '@shared/bible-book-chapter-counts';
import {
  SUPPORTED_SCRIPTURE_TRANSLATIONS,
  type ScriptureTranslationCode,
} from '@shared/scripture-search-contracts';

export type VerseShareParams = {
  book: string;
  chapter: number;
  verse: number;
  translation: ScriptureTranslationCode;
};

function normalizeBook(book: string | null): string | null {
  if (!book) return null;
  const trimmed = book.trim();
  if (!trimmed) return null;
  const canonical =
    BIBLE_BOOKS.find(
      (candidate) => candidate.toLowerCase() === trimmed.toLowerCase(),
    ) ?? null;
  return canonical;
}

function normalizePositiveInteger(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return null;
  return parsed;
}

function normalizeTranslation(
  translation: string | null,
): ScriptureTranslationCode | null {
  if (!translation) return null;
  const normalized = translation.trim().toUpperCase();
  if (
    !SUPPORTED_SCRIPTURE_TRANSLATIONS.includes(
      normalized as ScriptureTranslationCode,
    )
  ) {
    return null;
  }
  return normalized as ScriptureTranslationCode;
}

export function parseVerseShareParams(
  searchParams: URLSearchParams,
): VerseShareParams | null {
  const book = normalizeBook(searchParams.get('book'));
  const chapter = normalizePositiveInteger(searchParams.get('chapter'));
  const verse = normalizePositiveInteger(searchParams.get('verse'));
  const translation = normalizeTranslation(searchParams.get('translation'));
  if (!book || !chapter || !verse || !translation) return null;
  const maxChapter = getMaxChaptersForBook(book);
  if (chapter > maxChapter) return null;
  return { book, chapter, verse, translation };
}

export function toVerseShareSearchParams(input: VerseShareParams): string {
  return new URLSearchParams({
    book: input.book,
    chapter: String(input.chapter),
    verse: String(input.verse),
    translation: input.translation,
  }).toString();
}

export function buildVerseSharePath(input: VerseShareParams): string {
  return `/verse?${toVerseShareSearchParams(input)}`;
}

export function buildReaderPathForSharedVerse(input: VerseShareParams): string {
  return `/reader?${new URLSearchParams({
    book: input.book,
    chapter: String(input.chapter),
    verse: String(input.verse),
    translation: input.translation,
  }).toString()}`;
}

export function buildAbsoluteVerseShareUrl(input: VerseShareParams): string {
  if (typeof window === 'undefined') return buildVerseSharePath(input);
  return new URL(buildVerseSharePath(input), window.location.origin).toString();
}

export async function shareVerseLink(input: {
  title: string;
  text: string;
  url: string;
}): Promise<'shared' | 'copied' | 'cancelled'> {
  if (
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function'
  ) {
    try {
      await navigator.share({
        title: input.title,
        text: input.text,
        url: input.url,
      });
      return 'shared';
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return 'cancelled';
      }
      // Fall through to clipboard fallback.
    }
  }
  if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
    throw new Error('Sharing is unavailable on this device.');
  }
  await navigator.clipboard.writeText(input.url);
  return 'copied';
}
