import { useEffect, useMemo, useRef, useState } from 'react';
import type { SetURLSearchParams } from 'react-router-dom';
import { BIBLE_BOOKS } from '@shared/bible-books';
import { getMaxChaptersForBook } from '@shared/bible-book-chapter-counts';
import type { ScriptureTranslationCode } from '@shared/scripture-search-contracts';
import { SUPPORTED_SCRIPTURE_TRANSLATIONS } from '@shared/scripture-search-contracts';
import { getInitialReaderChapterState } from '@/features/reader/last-reader-location';
import { loadPreferredTranslation } from '@/lib/preferred-translation';

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

  const searchParamsRef = useRef(searchParams);
  useEffect(() => {
    searchParamsRef.current = searchParams;
  }, [searchParams]);

  // Only react to URL changes (back/forward, deep links). Do NOT depend on
  // book/chapter/translation — on local edits state updates before the URL
  // effect runs; re-running this with stale searchParams would revert the user.
  // Use functional updates so we never set state when already in sync (avoids
  // redundant renders / tight loops with the URL-write effect below).
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
    const clampedChapter = Math.min(urlChapter, getMaxChaptersForBook(urlBook));
    const preferred = loadPreferredTranslation();
    const resolvedTranslation =
      preferred ?? (urlTrans as ScriptureTranslationCode);
    setBook((prev) => (prev === urlBook ? prev : urlBook));
    setChapter((prev) => (prev === clampedChapter ? prev : clampedChapter));
    setTranslation((prev) =>
      prev === resolvedTranslation ? prev : resolvedTranslation,
    );
  }, [searchParams]);

  const maxChapterForBook = useMemo(() => getMaxChaptersForBook(book), [book]);

  useEffect(() => {
    setChapter((current) => Math.min(Math.max(1, current), maxChapterForBook));
  }, [maxChapterForBook]);

  useEffect(() => {
    setChapterInputValue(String(chapter));
  }, [chapter]);

  useEffect(() => {
    const current = searchParamsRef.current;
    const curBook = current.get('book');
    const curChapter = current.get('chapter');
    const curTrans = current.get('translation')?.toUpperCase() ?? '';
    if (
      curBook === book &&
      curChapter === String(chapter) &&
      curTrans === translation
    ) {
      return;
    }
    const next = new URLSearchParams(current);
    next.set('book', book);
    next.set('chapter', String(chapter));
    next.set('translation', translation);
    setSearchParams(next, { replace: true });
  }, [book, chapter, setSearchParams, translation]);

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
