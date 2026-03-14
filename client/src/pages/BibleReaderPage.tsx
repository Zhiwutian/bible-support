import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BIBLE_BOOKS } from '@shared/bible-books';
import type {
  ReaderChapterResponse,
  ScriptureTranslationCode,
} from '@shared/scripture-search-contracts';
import { SUPPORTED_SCRIPTURE_TRANSLATIONS } from '@shared/scripture-search-contracts';
import { Button, Card, EmptyState, SectionHeader } from '@/components/ui';
import { readReaderChapter } from '@/features/search/scripture-search-api';

/** Render chapter reader view with URL-synced book/chapter/translation state. */
export function BibleReaderPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialBook = searchParams.get('book');
  const initialChapter = Number(searchParams.get('chapter') ?? '');
  const initialTranslation = searchParams.get('translation')?.toUpperCase();
  const [book, setBook] = useState(
    initialBook && BIBLE_BOOKS.some((bookName) => bookName === initialBook)
      ? initialBook
      : BIBLE_BOOKS[0],
  );
  const [chapter, setChapter] = useState(
    Number.isInteger(initialChapter) && initialChapter > 0 ? initialChapter : 1,
  );
  const [translation, setTranslation] = useState<ScriptureTranslationCode>(
    SUPPORTED_SCRIPTURE_TRANSLATIONS.includes(
      initialTranslation as ScriptureTranslationCode,
    )
      ? (initialTranslation as ScriptureTranslationCode)
      : 'KJV',
  );
  const [payload, setPayload] = useState<ReaderChapterResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    next.set('book', book);
    next.set('chapter', String(chapter));
    next.set('translation', translation);
    setSearchParams(next, { replace: true });
  }, [book, chapter, searchParams, setSearchParams, translation]);

  useEffect(() => {
    let isCancelled = false;
    readReaderChapter({ book, chapter, translation })
      .then((response) => {
        if (isCancelled) return;
        setPayload(response);
      })
      .catch((err) => {
        if (isCancelled) return;
        setError(err instanceof Error ? err.message : 'Could not load chapter');
        setPayload(null);
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });
    return () => {
      isCancelled = true;
    };
  }, [book, chapter, translation]);

  const chapterLabel = useMemo(() => `${book} ${chapter}`, [book, chapter]);

  return (
    <>
      <SectionHeader
        title="Bible Reader"
        description="Read by chapter with scrollable text and move forward/backward one chapter at a time."
      />
      <Card className="mb-4 border p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex min-w-[220px] flex-[2] flex-col gap-1 text-sm font-semibold">
            Book
            <select
              className="min-h-11 rounded-md border border-slate-300 bg-white px-3 py-2"
              value={book}
              onChange={(event) => {
                setIsLoading(true);
                setError('');
                setBook(event.target.value);
                setChapter(1);
              }}>
              {BIBLE_BOOKS.map((bookName) => (
                <option key={bookName} value={bookName}>
                  {bookName}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-[120px] flex-1 flex-col gap-1 text-sm font-semibold">
            Chapter
            <input
              className="min-h-11 rounded-md border border-slate-300 bg-white px-3 py-2"
              type="number"
              min={1}
              value={chapter}
              onChange={(event) =>
                (() => {
                  setIsLoading(true);
                  setError('');
                  setChapter(Math.max(1, Number(event.target.value) || 1));
                })()
              }
            />
          </label>
          <label className="flex min-w-[130px] flex-1 flex-col gap-1 text-sm font-semibold">
            Translation
            <select
              className="min-h-11 rounded-md border border-slate-300 bg-white px-3 py-2"
              value={translation}
              onChange={(event) =>
                (() => {
                  setIsLoading(true);
                  setError('');
                  setTranslation(
                    event.target.value as ScriptureTranslationCode,
                  );
                })()
              }>
              {SUPPORTED_SCRIPTURE_TRANSLATIONS.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      {isLoading && (
        <p className="text-sm text-slate-600">Loading chapter...</p>
      )}
      {!isLoading && error && (
        <EmptyState
          title="Could not load chapter"
          description={error}
          actions={
            <Button variant="ghost" onClick={() => window.location.reload()}>
              Retry
            </Button>
          }
        />
      )}
      {!isLoading && !error && payload && (
        <Card className="space-y-4 border p-4">
          <p className="text-lg font-semibold text-slate-900">
            {chapterLabel} ({payload.translation})
          </p>
          <div className="max-h-[60vh] overflow-y-auto rounded-md border border-slate-200 bg-white p-3">
            <pre className="whitespace-pre-wrap text-base leading-8 text-slate-800">
              {payload.displayText}
            </pre>
          </div>
          <div className="flex justify-between gap-2">
            <Button
              variant="ghost"
              className="min-h-11"
              disabled={!payload.hasPrevious}
              onClick={() => {
                if (!payload.previousChapter) return;
                setIsLoading(true);
                setError('');
                setBook(payload.previousChapter.book);
                setChapter(payload.previousChapter.chapter);
              }}>
              ← Previous chapter
            </Button>
            <Button
              variant="ghost"
              className="min-h-11"
              disabled={!payload.hasNext}
              onClick={() => {
                if (!payload.nextChapter) return;
                setIsLoading(true);
                setError('');
                setBook(payload.nextChapter.book);
                setChapter(payload.nextChapter.chapter);
              }}>
              Next chapter →
            </Button>
          </div>
        </Card>
      )}
    </>
  );
}
