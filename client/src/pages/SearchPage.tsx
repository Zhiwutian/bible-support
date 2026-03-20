import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BIBLE_BOOKS } from '@shared/bible-books';
import { getMaxChaptersForBook } from '@shared/bible-book-chapter-counts';
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
  ModalShell,
  SectionHeader,
  SettingHelpButton,
  SettingHelpModal,
} from '@/components/ui';
import { appCopy } from '@/lib/copy';
import {
  readSavedScriptures,
  saveScriptureBatch,
  saveScripture,
  searchScriptures,
  toSavePayload,
} from '@/features/search/scripture-search-api';

/** Render a three-mode scripture search experience with save actions. */
export function SearchPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [mode, setMode] = useState<ScriptureSearchMode>('guided');
  const [translation, setTranslation] =
    useState<ScriptureTranslationCode>('KJV');
  const [book, setBook] = useState<string>(BIBLE_BOOKS[42]);
  const [chapter, setChapter] = useState<number | ''>(3);
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
  const [saveActionsTarget, setSaveActionsTarget] =
    useState<ScriptureVerseResult | null>(null);
  const [settingsHelp, setSettingsHelp] = useState<{
    title: string;
    description: string;
  } | null>(null);

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
  const maxChapterForBook = useMemo(() => getMaxChaptersForBook(book), [book]);

  useEffect(() => {
    if (chapter === '') return;
    if (chapter <= maxChapterForBook) return;
    setChapter(maxChapterForBook);
  }, [book, chapter, maxChapterForBook]);

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
    if (mode === 'guided' && chapter === '') {
      setResults([]);
      setSelectedVerseKeys([]);
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const payload = await searchScriptures({
        mode,
        translation,
        q: queryText,
        book,
        chapter: chapter === '' ? undefined : chapter,
        verseStart: verseStart === '' ? undefined : verseStart,
        verseEnd: verseEnd === '' ? undefined : verseEnd,
        limit: 40,
      });
      setSource(payload.source);
      setResults(payload.verses);
      setSelectedVerseKeys([]);
      if (payload.verses.length === 0) {
        showToast({
          title: 'No verses found yet',
          description:
            'Try a broader phrase, a different translation, or another search type.',
          variant: 'info',
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed';
      setError(message);
      showToast({
        title: 'Search could not be completed',
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
        title: 'Verse saved',
        description: `${verse.reference} is now in your collection.`,
        variant: 'success',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Save failed';
      showToast({
        title: 'We could not save that verse',
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
        title: 'Selected verses saved',
        description: `${response.items.length} verse(s) were saved together.`,
        variant: 'success',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Batch save failed';
      showToast({
        title: 'We could not save selected verses',
        description: message,
        variant: 'error',
      });
    } finally {
      setIsBatchSaving(false);
    }
  }

  function handleOpenVerseInReader(verse: ScriptureVerseResult) {
    const readerParams = new URLSearchParams({
      book: verse.book,
      chapter: String(verse.chapter),
      translation: verse.translation,
      verse: String(verse.verse),
    });
    navigate(`/reader?${readerParams.toString()}`);
  }

  const saveActionsTargetKey = saveActionsTarget
    ? getVerseKey(saveActionsTarget)
    : null;
  const isSaveActionsTargetSelected = saveActionsTargetKey
    ? selectedVerseKeys.includes(saveActionsTargetKey)
    : false;
  const isSaveActionsTargetSaved = saveActionsTargetKey
    ? savedKeySet.has(saveActionsTargetKey)
    : false;

  return (
    <>
      <SectionHeader
        title="Bible Search"
        description="Find verses with guided, reference, or keyword search, then save or open them in Reader."
      />

      <Card className="mb-4 space-y-4 border p-4">
        <label className="flex min-w-[220px] max-w-sm flex-col gap-1 text-sm font-semibold">
          <span className="flex items-center gap-2">
            Search Type
            <SettingHelpButton
              settingLabel="Search Type"
              onClick={() =>
                setSettingsHelp({
                  title: 'Search Type',
                  description:
                    'Guided uses book and chapter fields. Reference accepts entries like John 3:16. Keyword helps you discover verses by topic words.',
                })
              }
            />
          </span>
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
              <span className="flex items-center gap-2">
                Translation
                <SettingHelpButton
                  settingLabel="Search translation"
                  onClick={() =>
                    setSettingsHelp({
                      title: 'Translation',
                      description:
                        'Choose which translation to use for results and saved verses.',
                    })
                  }
                />
              </span>
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
                  <span className="flex items-center gap-2">
                    Book
                    <SettingHelpButton
                      settingLabel="Search book"
                      onClick={() =>
                        setSettingsHelp({
                          title: 'Book',
                          description:
                            'Choose the Bible book for guided search.',
                        })
                      }
                    />
                  </span>
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
                  <span className="flex items-center gap-2">
                    Chapter
                    <SettingHelpButton
                      settingLabel="Search chapter"
                      onClick={() =>
                        setSettingsHelp({
                          title: 'Chapter',
                          description:
                            'Enter the chapter number for guided search.',
                        })
                      }
                    />
                  </span>
                  <Input
                    className="min-h-11"
                    type="number"
                    min={1}
                    max={maxChapterForBook}
                    value={chapter}
                    onChange={(event) =>
                      setChapter(
                        event.target.value === ''
                          ? ''
                          : Number(event.target.value),
                      )
                    }
                    onBlur={() => {
                      if (chapter === '') return;
                      setChapter(
                        Math.min(Math.max(1, chapter), maxChapterForBook),
                      );
                    }}
                  />
                </label>
                <label className="flex min-w-[120px] flex-1 flex-col gap-1 text-sm font-semibold">
                  <span className="flex items-center gap-2">
                    Verse start
                    <SettingHelpButton
                      settingLabel="Verse start"
                      onClick={() =>
                        setSettingsHelp({
                          title: 'Verse start',
                          description:
                            'Optional: set a starting verse to narrow guided results.',
                        })
                      }
                    />
                  </span>
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
                  <span className="flex items-center gap-2">
                    Verse end
                    <SettingHelpButton
                      settingLabel="Verse end"
                      onClick={() =>
                        setSettingsHelp({
                          title: 'Verse end',
                          description:
                            'Optional: set an ending verse for a range. Leave blank to keep it broad.',
                        })
                      }
                    />
                  </span>
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
                <span className="flex items-center gap-2">
                  {mode === 'reference'
                    ? 'Reference (example: John 3:16-18)'
                    : 'Keyword (example: peace, comfort, anxiety)'}
                  <SettingHelpButton
                    settingLabel={
                      mode === 'reference' ? 'Reference input' : 'Keyword input'
                    }
                    onClick={() =>
                      setSettingsHelp({
                        title:
                          mode === 'reference'
                            ? 'Reference input'
                            : 'Keyword input',
                        description:
                          mode === 'reference'
                            ? 'Enter a scripture reference like John 3:16 or a range like John 3:16-18.'
                            : 'Enter topic words like peace, comfort, fear, or anxiety to find related verses.',
                      })
                    }
                  />
                </span>
                <Input
                  className="min-h-11"
                  value={queryText}
                  onChange={(event) => setQueryText(event.target.value)}
                />
              </label>
            )}
          </div>
          <Button
            className="min-h-11 px-6"
            type="submit"
            disabled={isLoading || (mode === 'guided' && chapter === '')}>
            {isLoading ? 'Searching...' : 'Search verses'}
          </Button>
        </form>
      </Card>

      {error && (
        <EmptyState
          title="Search did not finish"
          description={error}
          actions={
            <Button variant="ghost" onClick={() => setError('')}>
              {appCopy.actions.dismiss}
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
                : appCopy.empty.noResultsYet}
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
                {source === 'local' ? 'Local source' : 'Backup source'}
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
                <Button
                  variant="ghost"
                  className="min-h-11"
                  onClick={() => setSaveActionsTarget(verse)}>
                  Save actions
                </Button>
                <Button
                  variant="ghost"
                  className="min-h-11"
                  onClick={() => handleOpenVerseInReader(verse)}>
                  Open in Reader
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      <SettingHelpModal
        help={settingsHelp}
        titleId="search-settings-help-title"
        onClose={() => setSettingsHelp(null)}
      />
      {saveActionsTarget ? (
        <ModalShell
          title="Save actions"
          titleId="search-save-actions-title"
          onClose={() => setSaveActionsTarget(null)}>
          <p className="mt-3 text-sm text-slate-700">
            {saveActionsTarget.reference} ({saveActionsTarget.translation})
          </p>
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-700">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={isSaveActionsTargetSelected}
                onChange={() => toggleSelectedVerse(saveActionsTarget)}
                disabled={isSaveActionsTargetSaved}
              />
              Select for grouped save
            </label>
            <SettingHelpButton
              settingLabel="Grouped save selection"
              onClick={() =>
                setSettingsHelp({
                  title: 'Grouped save',
                  description:
                    'Select multiple verses, then use Save selected to store them together as one grouped save action.',
                })
              }
            />
          </div>
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            {selectedVerseKeys.length > 0 ? (
              <Button
                variant="ghost"
                className="min-h-11"
                onClick={() => void handleBatchSaveSelected()}
                disabled={isBatchSaving}>
                {isBatchSaving
                  ? 'Saving selected...'
                  : `Save selected (${selectedVerseKeys.length})`}
              </Button>
            ) : null}
            <Button
              variant="ghost"
              className="min-h-11"
              onClick={() => void handleSaveVerse(saveActionsTarget)}
              disabled={isSaveActionsTargetSaved}>
              {isSaveActionsTargetSaved ? 'Saved' : 'Save to Collection'}
            </Button>
            <Button
              variant="primary"
              className="min-h-11"
              onClick={() => setSaveActionsTarget(null)}>
              Done
            </Button>
          </div>
        </ModalShell>
      ) : null}
    </>
  );
}
