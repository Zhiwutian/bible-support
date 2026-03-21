import { useEffect, useMemo, useState } from 'react';
import type { SetURLSearchParams } from 'react-router-dom';
import { BIBLE_BOOKS } from '@shared/bible-books';
import { getMaxChaptersForBook } from '@shared/bible-book-chapter-counts';
import type { ScriptureTranslationCode } from '@shared/scripture-search-contracts';
import { SUPPORTED_SCRIPTURE_TRANSLATIONS } from '@shared/scripture-search-contracts';
import { getInitialReaderChapterState } from '@/features/reader/last-reader-location';

type UseReaderChapterRouteStateArgs = {
  searchParams: URLSearchParams;
  setSearchParams: SetURLSearchParams;
};

/**
 * Manage reader book/chapter/translation state and URL synchronization.
 */
export function useReaderChapterRouteState({
  searchParams,
  setSearchParams,
}: UseReaderChapterRouteStateArgs) {
  const [book, setBook] = useState(
    () => getInitialReaderChapterState(searchParams).book,
  );
  const [chapter, setChapter] = useState(
    () => getInitialReaderChapterState(searchParams).chapter,
  );
  const [chapterInputValue, setChapterInputValue] = useState(() =>
    String(getInitialReaderChapterState(searchParams).chapter),
  );
  const [translation, setTranslation] = useState<ScriptureTranslationCode>(
    () => getInitialReaderChapterState(searchParams).translation,
  );

  useEffect(() => {
    const urlBook = searchParams.get('book');
    const urlChapter = Number(searchParams.get('chapter') ?? '');
    const urlTrans = searchParams.get('translation')?.toUpperCase() ?? '';
    if (
      !urlBook ||
      !BIBLE_BOOKS.some((name) => name === urlBook) ||
      !Number.isInteger(urlChapter) ||
      urlChapter < 1 ||
      !urlTrans ||
      !SUPPORTED_SCRIPTURE_TRANSLATIONS.includes(
        urlTrans as ScriptureTranslationCode,
      )
    ) {
      return;
    }
    const t = urlTrans as ScriptureTranslationCode;
    const clampedChapter = Math.min(urlChapter, getMaxChaptersForBook(urlBook));
    if (urlBook !== book) setBook(urlBook);
    if (clampedChapter !== chapter) setChapter(clampedChapter);
    if (t !== translation) setTranslation(t);
  }, [searchParams, book, chapter, translation]);

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
