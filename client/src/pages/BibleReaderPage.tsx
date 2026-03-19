import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type {
  ReaderBookmark,
  ReaderChapterResponse,
  ScriptureTranslationCode,
} from '@shared/scripture-search-contracts';
import type { SavedScriptureItem } from '@shared/saved-scripture-contracts';
import { SUPPORTED_SCRIPTURE_TRANSLATIONS } from '@shared/scripture-search-contracts';
import {
  Button,
  Card,
  EmptyState,
  SectionHeader,
  SettingHelpModal,
} from '@/components/ui';
import {
  ReaderChapterContent,
  type ReaderCleanParagraph,
} from '@/features/reader/ReaderChapterContent';
import { ReaderChapterControls } from '@/features/reader/ReaderChapterControls';
import { ReaderChapterNavigation } from '@/features/reader/ReaderChapterNavigation';
import { useReaderAccountSync } from '@/features/reader/useReaderAccountSync';
import { ReaderBreakReminder } from '@/features/reader/ReaderBreakReminder';
import { ReaderNoteModal } from '@/features/reader/ReaderNoteModal';
import { ReaderOptionsModal } from '@/features/reader/ReaderOptionsModal';
import { ReaderStatusBar } from '@/features/reader/ReaderStatusBar';
import { ReaderVerseActionsModal } from '@/features/reader/ReaderVerseActionsModal';
import { useReaderChapterRouteState } from '@/features/reader/useReaderChapterRouteState';
import { useReaderVerseActions } from '@/features/reader/useReaderVerseActions';
import {
  loadReaderBookmark,
  loadReaderPreferences,
  resetReaderBookmark,
  resetReaderPreferences,
  type ReaderPreferences,
} from '@/features/reader/reader-preferences';
import {
  clearReaderState,
  readReaderChapter,
  readSavedScripturesForChapter,
} from '@/features/search/scripture-search-api';
import { appCopy } from '@/lib/copy';
import { trackEvent } from '@/lib/telemetry';

function parseBooleanFlag(
  value: string | undefined,
  defaultValue: boolean,
): boolean {
  if (value === undefined) return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
    return true;
  }
  if (normalized === 'false' || normalized === '0' || normalized === 'no') {
    return false;
  }
  return defaultValue;
}

function stripTranslationIndicatorText(value: string): string {
  return value
    .replace(/[[\]]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function buildCleanParagraphs(
  payload: ReaderChapterResponse,
): ReaderCleanParagraph[] {
  const chunks: ReaderCleanParagraph[] = [];
  for (let i = 0; i < payload.verses.length; i += 4) {
    const slice = payload.verses.slice(i, i + 4);
    if (slice.length === 0) continue;
    chunks.push({
      key: `${payload.book}-${payload.chapter}-${slice[0].verse}`,
      firstVerse: slice[0].verse,
      text: slice.map((row) => row.verseText.trim()).join(' '),
      verses: slice.map((row) => ({
        verse: row.verse,
        verseText: row.verseText.trim(),
      })),
    });
  }
  return chunks;
}

/** Render chapter reader view with URL-synced book/chapter/translation state. */
export function BibleReaderPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const readerContainerRef = useRef<HTMLDivElement | null>(null);
  const pendingJumpBookmarkRef = useRef<ReaderBookmark | null>(null);
  const pendingVerseFromUrlRef = useRef<number | null>(null);
  const hasRestoredInitialBookmarkRef = useRef(false);
  const fromEmotion = searchParams.get('fromEmotion')?.trim() ?? '';
  const fromScriptureId = Number(searchParams.get('fromScriptureId') ?? '');
  const fromTranslation = searchParams.get('fromTranslation')?.toUpperCase();
  const canReturnToSupportVerse = fromEmotion.length > 0;
  const initialBook = searchParams.get('book');
  const initialChapter = Number(searchParams.get('chapter') ?? '');
  const initialTranslation = searchParams.get('translation')?.toUpperCase();
  const initialVerse = Number(searchParams.get('verse') ?? '');
  const {
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
  } = useReaderChapterRouteState({
    initialBookParam: initialBook,
    initialChapterParam: initialChapter,
    initialTranslationParam: initialTranslation,
    searchParams,
    setSearchParams,
  });
  const [payload, setPayload] = useState<ReaderChapterResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [isBreakTipDismissed, setIsBreakTipDismissed] = useState(false);
  const [readerSettingsHelp, setReaderSettingsHelp] = useState<{
    title: string;
    description: string;
  } | null>(null);
  const [bookmarkStatus, setBookmarkStatus] = useState('');
  const [bookmark, setBookmark] = useState<ReaderBookmark | null>(() =>
    loadReaderBookmark(),
  );
  const [savedChapterItems, setSavedChapterItems] = useState<
    SavedScriptureItem[]
  >([]);
  const isReaderComfortEnabled = parseBooleanFlag(
    import.meta.env.VITE_READER_COMFORT_ENABLED,
    true,
  );
  const [readerPreferences, setReaderPreferences] = useState<ReaderPreferences>(
    () => loadReaderPreferences(),
  );
  const {
    verseActionTarget,
    noteModalTarget,
    noteDraft,
    isNoteSaving,
    noteSaveError,
    setNoteDraft,
    findExactSavedItemForVerse,
    hasSavedNoteForVerse,
    openVerseActionsForVerse,
    closeVerseActionsModal,
    handleSaveVerseFromReader,
    openNoteModalForVerse,
    closeNoteModal,
    handleSaveReaderVerseNote,
    handleShareVerseFromReader,
  } = useReaderVerseActions({
    book,
    chapter,
    translation,
    savedChapterItems,
    setSavedChapterItems,
    setBookmarkStatus,
  });
  const { isReaderAuthLoading, isReaderAuthenticated, markCurrentAsSynced } =
    useReaderAccountSync({
      readerPreferences,
      bookmark,
      setReaderPreferences,
      setBookmark,
    });

  useEffect(() => {
    if (
      pendingVerseFromUrlRef.current !== null ||
      !Number.isInteger(initialVerse) ||
      initialVerse < 1
    ) {
      return;
    }
    pendingVerseFromUrlRef.current = initialVerse;
  }, [initialVerse]);

  useEffect(() => {
    let isCancelled = false;
    readReaderChapter({ book, chapter, translation })
      .then((response) => {
        if (isCancelled) return;
        setPayload(response);
      })
      .catch((err) => {
        if (isCancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : 'We could not load this chapter.',
        );
        setPayload(null);
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });
    return () => {
      isCancelled = true;
    };
  }, [book, chapter, translation]);

  useEffect(() => {
    const controller = new AbortController();
    readSavedScripturesForChapter(
      { book, chapter, translation },
      controller.signal,
    )
      .then((response) => {
        setSavedChapterItems(response.items);
      })
      .catch((err) => {
        if (err instanceof Error && err.name === 'AbortError') return;
        // Keep reader usable even if saved-chapter metadata lookup fails.
        setSavedChapterItems([]);
      });
    return () => {
      controller.abort();
    };
  }, [book, chapter, translation]);

  useEffect(() => {
    if (!payload) return;
    const pending = pendingJumpBookmarkRef.current;
    const hasMatchingBookmark =
      bookmark &&
      bookmark.book === payload.book &&
      bookmark.chapter === payload.chapter &&
      bookmark.translation === payload.translation;
    const target =
      pending ??
      (!hasRestoredInitialBookmarkRef.current && hasMatchingBookmark
        ? bookmark
        : null);
    if (!target) return;
    if (!readerContainerRef.current) return;
    requestAnimationFrame(() => {
      if (!readerContainerRef.current) return;
      readerContainerRef.current.scrollTop = target.scrollOffset;
    });
    if (pending) {
      pendingJumpBookmarkRef.current = null;
    }
    hasRestoredInitialBookmarkRef.current = true;
  }, [bookmark, payload]);

  useEffect(() => {
    if (!payload) return;
    const targetVerse = pendingVerseFromUrlRef.current;
    if (!targetVerse) return;
    if (!readerContainerRef.current) return;
    const verseButton = readerContainerRef.current.querySelector<HTMLElement>(
      `[data-verse-start][data-verse-end]`,
    );
    if (!verseButton) return;
    const candidates = Array.from(
      readerContainerRef.current.querySelectorAll<HTMLElement>(
        '[data-verse-start][data-verse-end]',
      ),
    );
    const match = candidates.find((node) => {
      const start = Number(node.dataset.verseStart ?? '');
      const end = Number(node.dataset.verseEnd ?? '');
      return Number.isInteger(start) && Number.isInteger(end)
        ? targetVerse >= start && targetVerse <= end
        : false;
    });
    if (!match) return;
    match.scrollIntoView({ block: 'center' });
    pendingVerseFromUrlRef.current = null;
  }, [payload, readerPreferences.readingStyle]);

  useEffect(() => {
    if (!verseActionTarget && !noteModalTarget && !isOptionsModalOpen) return;
    function handleEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      if (verseActionTarget) {
        closeVerseActionsModal();
        return;
      }
      if (noteModalTarget) {
        closeNoteModal();
        return;
      }
      if (isOptionsModalOpen) {
        setIsOptionsModalOpen(false);
      }
    }
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [
    closeNoteModal,
    closeVerseActionsModal,
    isOptionsModalOpen,
    noteModalTarget,
    verseActionTarget,
  ]);

  const chapterLabel = useMemo(() => `${book} ${chapter}`, [book, chapter]);
  const readerRootClassName = useMemo(
    () =>
      [
        'reader-root',
        `reader-theme-${readerPreferences.theme}`,
        `reader-font-${readerPreferences.fontFamily}`,
        `reader-size-${readerPreferences.fontSize}`,
        `reader-line-${readerPreferences.lineHeight}`,
        `reader-paragraph-${readerPreferences.paragraphSpacing}`,
        `reader-width-${readerPreferences.contentWidth}`,
        readerPreferences.reducedMotion ? 'reader-reduced-motion' : '',
      ]
        .filter(Boolean)
        .join(' '),
    [readerPreferences],
  );

  function handleBackToSupportVerse() {
    if (!canReturnToSupportVerse) return;
    const backSearchParams = new URLSearchParams();
    if (Number.isInteger(fromScriptureId) && fromScriptureId > 0) {
      backSearchParams.set('scriptureId', String(fromScriptureId));
    }
    if (
      fromTranslation &&
      SUPPORTED_SCRIPTURE_TRANSLATIONS.includes(
        fromTranslation as ScriptureTranslationCode,
      )
    ) {
      backSearchParams.set('translation', fromTranslation);
    }
    const suffix =
      backSearchParams.size > 0 ? `?${backSearchParams.toString()}` : '';
    navigate(`/emotions/${fromEmotion}${suffix}`);
  }

  function updateReaderPreference<K extends keyof ReaderPreferences>(
    key: K,
    value: ReaderPreferences[K],
  ) {
    setReaderPreferences((current) => ({
      ...current,
      [key]: value,
    }));
    trackEvent('reader_preference_changed', {
      key,
      value,
    });
  }

  function handleResetReaderPreferences() {
    setReaderPreferences(resetReaderPreferences());
    trackEvent('reader_preferences_reset');
  }

  function handleOpenOptionsModal() {
    setIsOptionsModalOpen(true);
    trackEvent('reader_options_opened');
  }

  function isBookmarkedVerse(verse: number): boolean {
    if (!bookmark) return false;
    return (
      bookmark.book === book &&
      bookmark.chapter === chapter &&
      bookmark.translation === translation &&
      bookmark.verse === verse
    );
  }

  function handleSetBookmark(verse: number) {
    const scrollOffset = Math.max(
      0,
      Math.round(readerContainerRef.current?.scrollTop ?? 0),
    );
    const nextBookmark: ReaderBookmark = {
      book,
      chapter,
      verse,
      translation,
      scrollOffset,
    };
    const nextSignature = JSON.stringify(nextBookmark);
    const currentSignature = bookmark ? JSON.stringify(bookmark) : '';
    if (nextSignature === currentSignature) return;
    setBookmark(nextBookmark);
    setBookmarkStatus(`You are bookmarked at ${book} ${chapter}:${verse}.`);
    trackEvent('reader_bookmark_set', {
      book,
      chapter,
      verse,
      translation,
    });
  }

  async function handleClearSyncedReaderData() {
    if (!isReaderAuthenticated) return;
    await clearReaderState();
    resetReaderPreferences();
    resetReaderBookmark();
    markCurrentAsSynced(readerPreferences, bookmark);
    setBookmarkStatus(
      'Cleared synced reader data. Current view stays active until you change it.',
    );
    trackEvent('reader_state_cleared');
  }

  function handleJumpToLastPlace() {
    if (!bookmark) return;
    pendingJumpBookmarkRef.current = bookmark;
    setBookmarkStatus(
      `Jumping to ${bookmark.book} ${bookmark.chapter}:${bookmark.verse}...`,
    );
    setIsLoading(true);
    setError('');
    setBook(bookmark.book);
    setChapter(bookmark.chapter);
    setTranslation(bookmark.translation);
  }

  const cleanParagraphs = useMemo(() => {
    if (!payload) return [];
    const shouldHideIndicators = readerPreferences.hideTranslationIndicators;
    if (!shouldHideIndicators) return buildCleanParagraphs(payload);
    const normalizedPayload: ReaderChapterResponse = {
      ...payload,
      verses: payload.verses.map((verse) => ({
        ...verse,
        verseText: stripTranslationIndicatorText(verse.verseText),
      })),
    };
    return buildCleanParagraphs(normalizedPayload);
  }, [payload, readerPreferences.hideTranslationIndicators]);

  return (
    <div className={readerRootClassName}>
      <SectionHeader
        title="Bible Reader"
        description="Read one chapter at a time, save your place, and use verse actions when you need them."
      />
      {canReturnToSupportVerse && (
        <div className="mb-4 flex items-center gap-2">
          <Button
            variant="ghost"
            className="min-h-11"
            onClick={handleBackToSupportVerse}>
            Back to Support Verse
          </Button>
          {isReaderComfortEnabled && (
            <Button
              variant="primary"
              className="min-h-11"
              onClick={handleOpenOptionsModal}>
              Options
            </Button>
          )}
        </div>
      )}
      {isReaderComfortEnabled && !canReturnToSupportVerse && (
        <div className="mb-4">
          <Button
            variant="primary"
            className="min-h-11"
            onClick={handleOpenOptionsModal}>
            Options
          </Button>
        </div>
      )}
      {isReaderComfortEnabled && (
        <ReaderOptionsModal
          isOpen={isOptionsModalOpen}
          readerPreferences={readerPreferences}
          isReaderAuthenticated={isReaderAuthenticated}
          onClose={() => setIsOptionsModalOpen(false)}
          onResetReaderPreferences={handleResetReaderPreferences}
          onUpdateReaderPreference={updateReaderPreference}
          onReadingStyleChanged={(nextStyle) => {
            updateReaderPreference('readingStyle', nextStyle);
            trackEvent('reader_style_changed', {
              readingStyle: nextStyle,
            });
          }}
          onBreakReminderToggle={(enabled) => {
            updateReaderPreference('breakReminder', enabled);
            if (enabled) setIsBreakTipDismissed(false);
          }}
          onOpenHelp={(help) => {
            setReaderSettingsHelp(help);
          }}
          onClearSyncedReaderData={handleClearSyncedReaderData}
        />
      )}
      <SettingHelpModal
        help={readerSettingsHelp}
        titleId="reader-settings-help-title"
        onClose={() => setReaderSettingsHelp(null)}
      />
      <ReaderVerseActionsModal
        isOpen={Boolean(verseActionTarget)}
        reference={verseActionTarget?.reference ?? ''}
        hasSavedNote={
          verseActionTarget
            ? hasSavedNoteForVerse(verseActionTarget.verse)
            : false
        }
        isVerseAlreadySaved={
          verseActionTarget
            ? Boolean(findExactSavedItemForVerse(verseActionTarget.verse))
            : false
        }
        onClose={closeVerseActionsModal}
        onBookmarkHere={() => {
          if (!verseActionTarget) return;
          handleSetBookmark(verseActionTarget.verse);
          closeVerseActionsModal();
        }}
        onSaveVerse={() => {
          if (!verseActionTarget) return;
          void handleSaveVerseFromReader(verseActionTarget);
        }}
        onShareVerse={() => {
          if (!verseActionTarget) return;
          void handleShareVerseFromReader(verseActionTarget);
        }}
        onViewEditNote={() => {
          if (!verseActionTarget) return;
          void openNoteModalForVerse(verseActionTarget);
        }}
      />
      <ReaderNoteModal
        isOpen={Boolean(noteModalTarget)}
        reference={noteModalTarget?.reference ?? ''}
        noteDraft={noteDraft}
        noteSaveError={noteSaveError}
        isNoteSaving={isNoteSaving}
        onClose={closeNoteModal}
        onNoteDraftChange={setNoteDraft}
        onSaveNote={() => {
          void handleSaveReaderVerseNote();
        }}
      />
      <Card className="-mx-6 mb-4 rounded-none border-x-0 p-4 sm:mx-0 sm:rounded-md sm:border-x">
        <ReaderChapterControls
          book={book}
          chapterInputValue={chapterInputValue}
          maxChapterForBook={maxChapterForBook}
          translation={translation}
          onBookChange={(nextBook) => {
            setIsLoading(true);
            setError('');
            setBookAndResetChapter(nextBook);
          }}
          onChapterInputChange={(nextValue) => {
            if (nextValue === '') {
              updateChapterFromInput(nextValue);
              setError('');
              return;
            }
            const hasValidChapterInput = updateChapterFromInput(nextValue);
            if (hasValidChapterInput) {
              setIsLoading(true);
              setError('');
            }
          }}
          onChapterInputBlur={() => {
            const didChangeChapter = clampChapterInputOnBlur();
            if (didChangeChapter) {
              setIsLoading(true);
              setError('');
            }
          }}
          onTranslationChange={(nextTranslation) => {
            setIsLoading(true);
            setError('');
            setTranslation(nextTranslation);
          }}
        />
      </Card>

      {isLoading && (
        <p className="text-sm text-slate-600">Loading chapter...</p>
      )}
      {!isLoading && error && (
        <EmptyState
          title="We could not load this chapter"
          description={error}
          actions={
            <Button variant="ghost" onClick={() => window.location.reload()}>
              {appCopy.actions.retry}
            </Button>
          }
        />
      )}
      {!isLoading && !error && payload && (
        <Card className="-mx-6 space-y-4 rounded-none border-x-0 p-4 sm:mx-0 sm:rounded-md sm:border-x">
          <p className="text-lg font-semibold text-slate-900">
            {chapterLabel} ({payload.translation})
          </p>
          <ReaderStatusBar
            canJumpToLastPlace={Boolean(bookmark)}
            bookmarkStatus={bookmarkStatus}
            isReaderAuthLoading={isReaderAuthLoading}
            isReaderAuthenticated={isReaderAuthenticated}
            onJumpToLastPlace={handleJumpToLastPlace}
          />
          <div
            ref={readerContainerRef}
            className="reader-content max-h-[60vh] overflow-y-auto rounded-md border p-3">
            <ReaderChapterContent
              payload={payload}
              book={book}
              chapter={chapter}
              readingStyle={readerPreferences.readingStyle}
              cleanParagraphs={cleanParagraphs}
              isBookmarkedVerse={isBookmarkedVerse}
              hasSavedNoteForVerse={hasSavedNoteForVerse}
              formatVerseText={(verseText) =>
                readerPreferences.hideTranslationIndicators
                  ? stripTranslationIndicatorText(verseText)
                  : verseText
              }
              onOpenVerseActions={(verse, verseText) => {
                openVerseActionsForVerse(verse, verseText);
              }}
            />
          </div>
          <ReaderBreakReminder
            isVisible={
              isReaderComfortEnabled &&
              readerPreferences.breakReminder &&
              !isBreakTipDismissed
            }
            onDismiss={() => {
              setIsBreakTipDismissed(true);
              trackEvent('reader_break_tip_dismissed');
            }}
          />
          <ReaderChapterNavigation
            hasPrevious={payload.hasPrevious}
            hasNext={payload.hasNext}
            onPreviousChapter={() => {
              if (!payload.previousChapter) return;
              setIsLoading(true);
              setError('');
              setBook(payload.previousChapter.book);
              setChapter(payload.previousChapter.chapter);
            }}
            onNextChapter={() => {
              if (!payload.nextChapter) return;
              setIsLoading(true);
              setError('');
              setBook(payload.nextChapter.book);
              setChapter(payload.nextChapter.chapter);
            }}
          />
        </Card>
      )}
    </div>
  );
}
