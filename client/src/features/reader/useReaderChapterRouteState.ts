import { useEffect, useMemo, useState } from 'react';
import type { SetURLSearchParams } from 'react-router-dom';
import { BIBLE_BOOKS } from '@shared/bible-books';
import { getMaxChaptersForBook } from '@shared/bible-book-chapter-counts';
import type { ScriptureTranslationCode } from '@shared/scripture-search-contracts';
import { SUPPORTED_SCRIPTURE_TRANSLATIONS } from '@shared/scripture-search-contracts';

type UseReaderChapterRouteStateArgs = {
  initialBookParam: string | null;
  initialChapterParam: number;
  initialTranslationParam?: string;
  searchParams: URLSearchParams;
  setSearchParams: SetURLSearchParams;
};

/**
 * Manage reader book/chapter/translation state and URL synchronization.
 */
export function useReaderChapterRouteState({
  initialBookParam,
  initialChapterParam,
  initialTranslationParam,
  searchParams,
  setSearchParams,
}: UseReaderChapterRouteStateArgs) {
  const initialCanonicalBook =
    initialBookParam &&
    BIBLE_BOOKS.some((bookName) => bookName === initialBookParam)
      ? initialBookParam
      : BIBLE_BOOKS[0];
  const initialChapterValue =
    Number.isInteger(initialChapterParam) && initialChapterParam > 0
      ? initialChapterParam
      : 1;
  const initialChapterClamped = Math.min(
    initialChapterValue,
    getMaxChaptersForBook(initialCanonicalBook),
  );

  const [book, setBook] = useState(initialCanonicalBook);
  const [chapter, setChapter] = useState(initialChapterClamped);
  const [chapterInputValue, setChapterInputValue] = useState(
    String(initialChapterClamped),
  );
  const [translation, setTranslation] = useState<ScriptureTranslationCode>(
    SUPPORTED_SCRIPTURE_TRANSLATIONS.includes(
      initialTranslationParam as ScriptureTranslationCode,
    )
      ? (initialTranslationParam as ScriptureTranslationCode)
      : 'KJV',
  );

  const maxChapterForBook = useMemo(() => getMaxChaptersForBook(book), [book]);

  useEffect(() => {
    setChapter((current) => Math.min(Math.max(1, current), maxChapterForBook));
  }, [maxChapterForBook]);

  useEffect(() => {
    setChapterInputValue(String(chapter));
  }, [chapter]);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    next.set('book', book);
    next.set('chapter', String(chapter));
    next.set('translation', translation);
    setSearchParams(next, { replace: true });
  }, [book, chapter, searchParams, setSearchParams, translation]);

  function setBookAndResetChapter(nextBook: string) {
    setBook(nextBook);
    setChapter(1);
    setChapterInputValue('1');
  }

  function updateChapterFromInput(nextValue: string): boolean {
    setChapterInputValue(nextValue);
    if (nextValue === '') return false;
    const parsed = Number(nextValue);
    if (!Number.isInteger(parsed) || parsed < 1) return false;
    const clamped = Math.min(parsed, maxChapterForBook);
    setChapter(clamped);
    return true;
  }

  function clampChapterInputOnBlur(): boolean {
    if (chapterInputValue === '') return false;
    const parsed = Number(chapterInputValue);
    if (!Number.isInteger(parsed) || parsed < 1) {
      setChapterInputValue(String(chapter));
      return false;
    }
    const clamped = Math.min(Math.max(1, parsed), maxChapterForBook);
    setChapterInputValue(String(clamped));
    if (clamped === chapter) return false;
    setChapter(clamped);
    return true;
  }

  return {
    book,
    chapter,
    chapterInputValue,
    maxChapterForBook,
    translation,
    setBook,
    setChapter,
    setTranslation,
    setBookAndResetChapter,
    updateChapterFromInput,
    clampChapterInputOnBlur,
  };
}
