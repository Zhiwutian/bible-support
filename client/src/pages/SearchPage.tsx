import { FormEvent, useEffect, useMemo, useState } from 'react';
import { BIBLE_BOOKS } from '@shared/bible-books';
import type {
  SavedScriptureItem,
  ScriptureSearchMode,
  ScriptureTranslationCode,
  ScriptureVerseResult,
} from '@shared/scripture-search-contracts';
import { SUPPORTED_SCRIPTURE_TRANSLATIONS } from '@shared/scripture-search-contracts';
import { useToast } from '@/components/app/toast-context';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  SectionHeader,
} from '@/components/ui';
import {
  readSavedScriptures,
  saveScriptureBatch,
  saveScripture,
  searchScriptures,
  toSavePayload,
} from '@/features/search/scripture-search-api';

/** Render a three-mode scripture search experience with save actions. */
export function SearchPage() {
  const { showToast } = useToast();
  const [mode, setMode] = useState<ScriptureSearchMode>('guided');
  const [translation, setTranslation] =
    useState<ScriptureTranslationCode>('KJV');
  const [book, setBook] = useState<string>(BIBLE_BOOKS[42]);
  const [chapter, setChapter] = useState(3);
  const [verseStart, setVerseStart] = useState<number | ''>('');
  const [verseEnd, setVerseEnd] = useState<number | ''>('');
  const [queryText, setQueryText] = useState('');
  const [results, setResults] = useState<ScriptureVerseResult[]>([]);
  const [source, setSource] = useState<'local' | 'remote'>('local');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedItems, setSavedItems] = useState<SavedScriptureItem[]>([]);
  const [selectedVerseKeys, setSelectedVerseKeys] = useState<string[]>([]);
  const [isBatchSaving, setIsBatchSaving] = useState(false);

  const savedKeySet = useMemo(
    () =>
      new Set(
        savedItems.map(
          (item) =>
            `${item.translation}:${item.book}:${item.chapter}:${item.verseStart}:${item.verseEnd}`,
        ),
      ),
    [savedItems],
  );

  function getVerseKey(verse: ScriptureVerseResult): string {
    return `${verse.translation}:${verse.book}:${verse.chapter}:${verse.verse}:${verse.verse}`;
  }

  function toggleSelectedVerse(verse: ScriptureVerseResult) {
    const key = getVerseKey(verse);
    setSelectedVerseKeys((current) =>
      current.includes(key)
        ? current.filter((value) => value !== key)
        : [...current, key],
    );
  }

  useEffect(() => {
    readSavedScriptures()
      .then(setSavedItems)
      .catch(() => {
        // Keep search functional even if saved collection endpoint is unavailable.
      });
  }, []);

  async function handleSearch(event: FormEvent) {
    event.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const payload = await searchScriptures({
        mode,
        translation,
        q: queryText,
        book,
        chapter,
        verseStart: verseStart === '' ? undefined : verseStart,
        verseEnd: verseEnd === '' ? undefined : verseEnd,
        limit: 40,
      });
      setSource(payload.source);
      setResults(payload.verses);
      setSelectedVerseKeys([]);
      if (payload.verses.length === 0) {
        showToast({
          title: 'No verses found',
          description: 'Try a different search mode or broader query.',
          variant: 'info',
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed';
      setError(message);
      showToast({
        title: 'Search failed',
        description: message,
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSaveVerse(verse: ScriptureVerseResult) {
    try {
      const saved = await saveScripture(
        toSavePayload(verse, source, queryText),
      );
      setSavedItems((current) => [saved, ...current]);
      showToast({
        title: 'Saved verse',
        description: verse.reference,
        variant: 'success',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Save failed';
      showToast({
        title: 'Could not save verse',
        description: message,
        variant: 'error',
      });
    }
  }

  async function handleBatchSaveSelected() {
    const selected = results.filter((verse) =>
      selectedVerseKeys.includes(getVerseKey(verse)),
    );
    if (selected.length === 0) return;
    setIsBatchSaving(true);
    try {
      const response = await saveScriptureBatch({
        items: selected.map((verse) => toSavePayload(verse, source, queryText)),
      });
      setSavedItems((current) => [...response.items, ...current]);
      setSelectedVerseKeys([]);
      showToast({
        title: 'Saved selected verses',
        description: `${response.items.length} verse(s) saved together.`,
        variant: 'success',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Batch save failed';
      showToast({
        title: 'Could not save selected verses',
        description: message,
        variant: 'error',
      });
    } finally {
      setIsBatchSaving(false);
    }
  }

  return (
    <>
      <SectionHeader
        title="Bible Search"
        description="Compare search styles: guided picker, reference input, and keyword search."
      />

      <Card className="mb-4 space-y-4 border p-4">
        <label className="flex min-w-[220px] max-w-sm flex-col gap-1 text-sm font-semibold">
          Search Type
          <select
            className="min-h-11 rounded-md border border-slate-300 bg-white px-3 py-2"
            value={mode}
            onChange={(event) =>
              setMode(event.target.value as ScriptureSearchMode)
            }>
            <option value="guided">Guided picker</option>
            <option value="reference">Reference input</option>
            <option value="keyword">Keyword search</option>
          </select>
        </label>

        <form className="space-y-3" onSubmit={handleSearch}>
          <div className="flex flex-wrap gap-3">
            <label className="flex min-w-[140px] flex-1 flex-col gap-1 text-sm font-semibold">
              Translation
              <select
                className="min-h-11 rounded-md border border-slate-300 bg-white px-3 py-2"
                value={translation}
                onChange={(event) =>
                  setTranslation(event.target.value as ScriptureTranslationCode)
                }>
                {SUPPORTED_SCRIPTURE_TRANSLATIONS.map((translationCode) => (
                  <option key={translationCode} value={translationCode}>
                    {translationCode}
                  </option>
                ))}
              </select>
            </label>

            {mode === 'guided' && (
              <>
                <label className="flex min-w-[200px] flex-[2] flex-col gap-1 text-sm font-semibold">
                  Book
                  <select
                    className="min-h-11 rounded-md border border-slate-300 bg-white px-3 py-2"
                    value={book}
                    onChange={(event) => setBook(event.target.value)}>
                    {BIBLE_BOOKS.map((bookName) => (
                      <option key={bookName} value={bookName}>
                        {bookName}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex min-w-[120px] flex-1 flex-col gap-1 text-sm font-semibold">
                  Chapter
                  <Input
                    className="min-h-11"
                    type="number"
                    min={1}
                    value={chapter}
                    onChange={(event) => setChapter(Number(event.target.value))}
                  />
                </label>
                <label className="flex min-w-[120px] flex-1 flex-col gap-1 text-sm font-semibold">
                  Verse start
                  <Input
                    className="min-h-11"
                    type="number"
                    min={1}
                    placeholder="Optional"
                    value={verseStart}
                    onChange={(event) =>
                      setVerseStart(
                        event.target.value ? Number(event.target.value) : '',
                      )
                    }
                  />
                </label>
                <label className="flex min-w-[120px] flex-1 flex-col gap-1 text-sm font-semibold">
                  Verse end
                  <Input
                    className="min-h-11"
                    type="number"
                    min={1}
                    placeholder="Optional"
                    value={verseEnd}
                    onChange={(event) =>
                      setVerseEnd(
                        event.target.value ? Number(event.target.value) : '',
                      )
                    }
                  />
                </label>
              </>
            )}

            {mode !== 'guided' && (
              <label className="flex min-w-[280px] flex-[3] flex-col gap-1 text-sm font-semibold">
                {mode === 'reference'
                  ? 'Reference (example: John 3:16-18)'
                  : 'Keyword (example: peace, comfort, anxiety)'}
                <Input
                  className="min-h-11"
                  value={queryText}
                  onChange={(event) => setQueryText(event.target.value)}
                />
              </label>
            )}
          </div>
          <Button className="min-h-11 px-6" type="submit" disabled={isLoading}>
            {isLoading ? 'Searching...' : 'Search verses'}
          </Button>
        </form>
      </Card>

      {error && (
        <EmptyState
          title="Search did not complete"
          description={error}
          actions={
            <Button variant="ghost" onClick={() => setError('')}>
              Dismiss
            </Button>
          }
        />
      )}

      {!error && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-700">
              {results.length > 0
                ? `${results.length} result${results.length === 1 ? '' : 's'}`
                : 'No results yet'}
            </p>
            <div className="flex items-center gap-2">
              {selectedVerseKeys.length > 0 && (
                <Button
                  variant="ghost"
                  className="min-h-11"
                  onClick={() => void handleBatchSaveSelected()}
                  disabled={isBatchSaving}>
                  {isBatchSaving
                    ? 'Saving selected...'
                    : `Save selected (${selectedVerseKeys.length})`}
                </Button>
              )}
              <Badge>
                {source === 'local' ? 'Local source' : 'API fallback'}
              </Badge>
            </div>
          </div>

          {results.map((verse) => (
            <Card
              key={`${verse.translation}:${verse.reference}`}
              className="space-y-3 border p-4">
              <p className="font-semibold text-slate-800">
                {verse.reference} ({verse.translation})
              </p>
              <p className="leading-8 text-slate-800">{verse.verseText}</p>
              <div className="flex items-center justify-between gap-3">
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={selectedVerseKeys.includes(getVerseKey(verse))}
                    onChange={() => toggleSelectedVerse(verse)}
                    disabled={savedKeySet.has(getVerseKey(verse))}
                  />
                  Select for grouped save
                </label>
                <Button
                  variant="ghost"
                  className="min-h-11"
                  onClick={() => handleSaveVerse(verse)}
                  disabled={savedKeySet.has(getVerseKey(verse))}>
                  {savedKeySet.has(getVerseKey(verse))
                    ? 'Saved'
                    : 'Save to collection'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
