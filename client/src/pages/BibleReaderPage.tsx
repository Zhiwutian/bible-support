import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BIBLE_BOOKS } from '@shared/bible-books';
import type {
  ReaderBookmark,
  ReaderChapterResponse,
  ReaderPreferencesPayload,
  ReaderReadingStyle,
  ScriptureTranslationCode,
} from '@shared/scripture-search-contracts';
import { SUPPORTED_SCRIPTURE_TRANSLATIONS } from '@shared/scripture-search-contracts';
import {
  Button,
  Card,
  EmptyState,
  ModalShell,
  SectionHeader,
  SettingHelpButton,
  SettingHelpModal,
} from '@/components/ui';
import { readAuthMe } from '@/features/auth/auth-api';
import {
  defaultReaderPreferences,
  loadReaderBookmark,
  loadReaderPreferences,
  resetReaderBookmark,
  resetReaderPreferences,
  saveReaderBookmark,
  saveReaderPreferences,
  type ReaderPreferences,
} from '@/features/reader/reader-preferences';
import {
  clearReaderState,
  readReaderChapter,
  readReaderState,
  updateReaderState,
} from '@/features/search/scripture-search-api';
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

function serializeReaderStateSignature(
  preferences: ReaderPreferences,
  bookmark: ReaderBookmark | null,
): string {
  return JSON.stringify({ preferences, bookmark });
}

function stripTranslationIndicatorText(value: string): string {
  return value
    .replace(/[[\]]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function buildCleanParagraphs(payload: ReaderChapterResponse): Array<{
  key: string;
  firstVerse: number;
  text: string;
  verses: Array<{ verse: number; verseText: string }>;
}> {
  const chunks: Array<{
    key: string;
    firstVerse: number;
    text: string;
    verses: Array<{ verse: number; verseText: string }>;
  }> = [];
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
  const syncDebounceRef = useRef<number | null>(null);
  const lastSyncedSignatureRef = useRef('');
  const isReaderStateHydratingRef = useRef(false);
  const latestReaderPreferencesRef = useRef<ReaderPreferences>(
    loadReaderPreferences(),
  );
  const latestBookmarkRef = useRef<ReaderBookmark | null>(loadReaderBookmark());
  const fromEmotion = searchParams.get('fromEmotion')?.trim() ?? '';
  const fromScriptureId = Number(searchParams.get('fromScriptureId') ?? '');
  const fromTranslation = searchParams.get('fromTranslation')?.toUpperCase();
  const canReturnToSupportVerse = fromEmotion.length > 0;
  const initialBook = searchParams.get('book');
  const initialChapter = Number(searchParams.get('chapter') ?? '');
  const initialTranslation = searchParams.get('translation')?.toUpperCase();
  const initialVerse = Number(searchParams.get('verse') ?? '');
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
  const [isReaderAuthLoading, setIsReaderAuthLoading] = useState(true);
  const [isReaderAuthenticated, setIsReaderAuthenticated] = useState(false);
  const isReaderComfortEnabled = parseBooleanFlag(
    import.meta.env.VITE_READER_COMFORT_ENABLED,
    true,
  );
  const [readerPreferences, setReaderPreferences] = useState<ReaderPreferences>(
    () => loadReaderPreferences(),
  );

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

  useEffect(() => {
    saveReaderPreferences(readerPreferences);
  }, [readerPreferences]);

  useEffect(() => {
    saveReaderBookmark(bookmark);
  }, [bookmark]);

  useEffect(() => {
    let isCancelled = false;
    readAuthMe()
      .then((authPayload) => {
        if (isCancelled) return;
        setIsReaderAuthenticated(authPayload.isAuthenticated);
      })
      .catch(() => {
        if (isCancelled) return;
        setIsReaderAuthenticated(false);
      })
      .finally(() => {
        if (isCancelled) return;
        setIsReaderAuthLoading(false);
      });
    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    latestReaderPreferencesRef.current = readerPreferences;
    latestBookmarkRef.current = bookmark;
  }, [bookmark, readerPreferences]);

  useEffect(() => {
    if (isReaderAuthLoading) return;
    const currentSignature = serializeReaderStateSignature(
      latestReaderPreferencesRef.current,
      latestBookmarkRef.current,
    );
    if (!isReaderAuthenticated) {
      isReaderStateHydratingRef.current = false;
      lastSyncedSignatureRef.current = currentSignature;
      return;
    }
    let isCancelled = false;
    isReaderStateHydratingRef.current = true;
    readReaderState()
      .then((payload) => {
        if (isCancelled) return;
        setReaderPreferences(
          payload.preferences ??
            (defaultReaderPreferences as ReaderPreferences),
        );
        setBookmark(payload.bookmark ?? null);
        lastSyncedSignatureRef.current = serializeReaderStateSignature(
          payload.preferences ??
            (defaultReaderPreferences as ReaderPreferences),
          payload.bookmark ?? null,
        );
        trackEvent('reader_state_synced', { source: 'account' });
      })
      .catch(() => {
        if (isCancelled) return;
        lastSyncedSignatureRef.current = currentSignature;
      })
      .finally(() => {
        if (isCancelled) return;
        isReaderStateHydratingRef.current = false;
      });
    return () => {
      isCancelled = true;
    };
  }, [isReaderAuthLoading, isReaderAuthenticated]);

  useEffect(() => {
    if (!isReaderAuthenticated || isReaderStateHydratingRef.current) return;
    const signature = serializeReaderStateSignature(
      readerPreferences,
      bookmark,
    );
    if (signature === lastSyncedSignatureRef.current) return;
    if (syncDebounceRef.current !== null) {
      window.clearTimeout(syncDebounceRef.current);
    }
    syncDebounceRef.current = window.setTimeout(() => {
      updateReaderState({
        preferences: readerPreferences as ReaderPreferencesPayload,
        bookmark,
      })
        .then(() => {
          lastSyncedSignatureRef.current = signature;
          trackEvent('reader_state_synced', { source: 'patch' });
        })
        .catch(() => {
          // Keep reader usable with local persistence when sync fails.
        });
    }, 500);
    return () => {
      if (syncDebounceRef.current !== null) {
        window.clearTimeout(syncDebounceRef.current);
      }
    };
  }, [bookmark, isReaderAuthenticated, readerPreferences]);

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
    if (!isOptionsModalOpen) return;
    function handleEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      setIsOptionsModalOpen(false);
    }
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOptionsModalOpen]);

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
    setBookmarkStatus(`Saved your place at ${book} ${chapter}:${verse}.`);
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
    lastSyncedSignatureRef.current = serializeReaderStateSignature(
      readerPreferences,
      bookmark,
    );
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
        description="Read by chapter with scrollable text and move forward/backward one chapter at a time."
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
      {isReaderComfortEnabled && isOptionsModalOpen && (
        <ModalShell
          title="Reader Options"
          titleId="reader-options-modal-title"
          onClose={() => setIsOptionsModalOpen(false)}
          panelClassName="max-w-xl">
          <div className="mt-3 flex items-center justify-between gap-2">
            <p className="text-base font-semibold text-slate-900">
              Reader settings
            </p>
            <Button
              variant="ghost"
              className="min-h-11"
              onClick={handleResetReaderPreferences}>
              Reset reader settings
            </Button>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm font-semibold">
              <span className="flex items-center gap-2">
                Reading style
                <SettingHelpButton
                  settingLabel="Reading style"
                  onClick={() =>
                    setReaderSettingsHelp({
                      title: 'Reading style',
                      description:
                        'Verse shows one verse per line with superscript numbers. Standard shows paragraph flow with superscript verse numbers inline. Clean shows paragraph flow without verse indicators.',
                    })
                  }
                />
              </span>
              <select
                aria-label="Reading style"
                className="min-h-11 rounded-md border border-slate-300 bg-white px-3 py-2"
                value={readerPreferences.readingStyle}
                onChange={(event) => {
                  const nextStyle = event.target.value as ReaderReadingStyle;
                  updateReaderPreference('readingStyle', nextStyle);
                  trackEvent('reader_style_changed', {
                    readingStyle: nextStyle,
                  });
                }}>
                <option value="verse">Verse</option>
                <option value="standard">Standard</option>
                <option value="clean">Clean</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm font-semibold">
              <span className="flex items-center gap-2">
                Theme
                <SettingHelpButton
                  settingLabel="Theme"
                  onClick={() =>
                    setReaderSettingsHelp({
                      title: 'Theme',
                      description:
                        'Changes chapter reading colors only (Light, Sepia, Dark). This is separate from global app dark mode.',
                    })
                  }
                />
              </span>
              <select
                aria-label="Theme"
                className="min-h-11 rounded-md border border-slate-300 bg-white px-3 py-2"
                value={readerPreferences.theme}
                onChange={(event) =>
                  updateReaderPreference(
                    'theme',
                    event.target.value as ReaderPreferences['theme'],
                  )
                }>
                <option value="light">Light</option>
                <option value="sepia">Sepia</option>
                <option value="dark">Dark</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm font-semibold">
              <span className="flex items-center gap-2">
                Font family
                <SettingHelpButton
                  settingLabel="Font family"
                  onClick={() =>
                    setReaderSettingsHelp({
                      title: 'Font family',
                      description:
                        'Switches the chapter body text style between serif and sans-serif.',
                    })
                  }
                />
              </span>
              <select
                aria-label="Font family"
                className="min-h-11 rounded-md border border-slate-300 bg-white px-3 py-2"
                value={readerPreferences.fontFamily}
                onChange={(event) =>
                  updateReaderPreference(
                    'fontFamily',
                    event.target.value as ReaderPreferences['fontFamily'],
                  )
                }>
                <option value="serif">Serif</option>
                <option value="sans">Sans</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm font-semibold">
              <span className="flex items-center gap-2">
                Font size
                <SettingHelpButton
                  settingLabel="Reader font size"
                  onClick={() =>
                    setReaderSettingsHelp({
                      title: 'Reader font size',
                      description:
                        'Changes only Bible Reader chapter text size. XL is tuned for low-vision readability.',
                    })
                  }
                />
              </span>
              <select
                aria-label="Font size"
                className="min-h-11 rounded-md border border-slate-300 bg-white px-3 py-2"
                value={readerPreferences.fontSize}
                onChange={(event) =>
                  updateReaderPreference(
                    'fontSize',
                    event.target.value as ReaderPreferences['fontSize'],
                  )
                }>
                <option value="xs">Extra Small</option>
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
                <option value="xl">Extra Large</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm font-semibold">
              <span className="flex items-center gap-2">
                Line height
                <SettingHelpButton
                  settingLabel="Line height"
                  onClick={() =>
                    setReaderSettingsHelp({
                      title: 'Line height',
                      description:
                        'Adjusts vertical spacing between text lines inside chapter content.',
                    })
                  }
                />
              </span>
              <select
                aria-label="Line height"
                className="min-h-11 rounded-md border border-slate-300 bg-white px-3 py-2"
                value={readerPreferences.lineHeight}
                onChange={(event) =>
                  updateReaderPreference(
                    'lineHeight',
                    event.target.value as ReaderPreferences['lineHeight'],
                  )
                }>
                <option value="normal">Normal</option>
                <option value="relaxed">Relaxed</option>
                <option value="loose">Loose</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm font-semibold">
              <span className="flex items-center gap-2">
                Paragraph spacing
                <SettingHelpButton
                  settingLabel="Paragraph spacing"
                  onClick={() =>
                    setReaderSettingsHelp({
                      title: 'Paragraph spacing',
                      description:
                        'Controls spacing between verse/paragraph blocks for easier scanning while reading.',
                    })
                  }
                />
              </span>
              <select
                aria-label="Paragraph spacing"
                className="min-h-11 rounded-md border border-slate-300 bg-white px-3 py-2"
                value={readerPreferences.paragraphSpacing}
                onChange={(event) =>
                  updateReaderPreference(
                    'paragraphSpacing',
                    event.target.value as ReaderPreferences['paragraphSpacing'],
                  )
                }>
                <option value="tight">Tight</option>
                <option value="normal">Normal</option>
                <option value="loose">Loose</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm font-semibold">
              <span className="flex items-center gap-2">
                Content width
                <SettingHelpButton
                  settingLabel="Content width"
                  onClick={() =>
                    setReaderSettingsHelp({
                      title: 'Content width',
                      description:
                        'Adjusts the maximum line length of chapter text. Narrow is easier for focused reading.',
                    })
                  }
                />
              </span>
              <select
                aria-label="Content width"
                className="min-h-11 rounded-md border border-slate-300 bg-white px-3 py-2"
                value={readerPreferences.contentWidth}
                onChange={(event) =>
                  updateReaderPreference(
                    'contentWidth',
                    event.target.value as ReaderPreferences['contentWidth'],
                  )
                }>
                <option value="narrow">Narrow</option>
                <option value="balanced">Balanced</option>
                <option value="wide">Wide</option>
              </select>
            </label>
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm font-semibold">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={readerPreferences.reducedMotion}
                onChange={(event) =>
                  updateReaderPreference('reducedMotion', event.target.checked)
                }
              />
              Reduced motion
            </label>
            <SettingHelpButton
              settingLabel="Reduced motion"
              onClick={() =>
                setReaderSettingsHelp({
                  title: 'Reduced motion',
                  description:
                    'Minimizes animation and transition effects in Reader interactions.',
                })
              }
            />
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm font-semibold">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={readerPreferences.breakReminder}
                onChange={(event) => {
                  updateReaderPreference('breakReminder', event.target.checked);
                  if (event.target.checked) setIsBreakTipDismissed(false);
                }}
              />
              Gentle break reminders
            </label>
            <SettingHelpButton
              settingLabel="Gentle break reminders"
              onClick={() =>
                setReaderSettingsHelp({
                  title: 'Gentle break reminders',
                  description:
                    'Shows a non-intrusive 20-20-20 eye comfort reminder while reading.',
                })
              }
            />
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm font-semibold">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={readerPreferences.hideTranslationIndicators}
                onChange={(event) =>
                  updateReaderPreference(
                    'hideTranslationIndicators',
                    event.target.checked,
                  )
                }
              />
              Hide translation indicators
            </label>
            <SettingHelpButton
              settingLabel="Hide translation indicators"
              onClick={() =>
                setReaderSettingsHelp({
                  title: 'Hide translation indicators',
                  description:
                    'Removes bracket-style markers from verse text while reading. This only changes display, not source data.',
                })
              }
            />
          </div>
          {isReaderAuthenticated && (
            <div className="mt-3">
              <Button
                variant="ghost"
                className="min-h-11"
                onClick={() => {
                  void handleClearSyncedReaderData();
                }}>
                Clear synced reader data
              </Button>
            </div>
          )}
          <div className="mt-4 flex justify-end">
            <Button
              variant="ghost"
              className="min-h-11"
              onClick={() => setIsOptionsModalOpen(false)}>
              Done
            </Button>
          </div>
        </ModalShell>
      )}
      <SettingHelpModal
        help={readerSettingsHelp}
        titleId="reader-settings-help-title"
        onClose={() => setReaderSettingsHelp(null)}
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
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              className="min-h-11"
              disabled={!bookmark}
              onClick={handleJumpToLastPlace}>
              Jump to last place
            </Button>
            {bookmarkStatus ? (
              <p className="text-sm text-slate-600" role="status">
                {bookmarkStatus}
              </p>
            ) : null}
            {isReaderAuthLoading ? (
              <p className="text-xs text-slate-500">Checking account sync…</p>
            ) : isReaderAuthenticated ? (
              <p className="text-xs text-slate-500">
                Reader settings sync with account.
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                Reader settings save on this device.
              </p>
            )}
          </div>
          <div
            ref={readerContainerRef}
            className="reader-content max-h-[60vh] overflow-y-auto rounded-md border p-3">
            <div className="reader-chapter-text">
              {readerPreferences.readingStyle === 'verse' &&
                payload.verses.map((verse) => (
                  <button
                    key={verse.reference}
                    type="button"
                    data-verse-start={verse.verse}
                    data-verse-end={verse.verse}
                    className={`reader-verse-paragraph block w-full rounded px-1 text-left ${
                      isBookmarkedVerse(verse.verse)
                        ? 'ring-1 ring-indigo-400'
                        : 'hover:bg-slate-100/60'
                    }`}
                    onClick={() => handleSetBookmark(verse.verse)}>
                    <sup className="mr-1 align-super text-xs font-semibold">
                      {verse.verse}
                    </sup>
                    {readerPreferences.hideTranslationIndicators
                      ? stripTranslationIndicatorText(verse.verseText)
                      : verse.verseText}
                  </button>
                ))}
              {readerPreferences.readingStyle === 'standard' &&
                cleanParagraphs.map((paragraph) => (
                  <button
                    key={paragraph.key}
                    type="button"
                    data-verse-start={paragraph.verses[0]?.verse}
                    data-verse-end={
                      paragraph.verses[paragraph.verses.length - 1]?.verse
                    }
                    className={`reader-verse-paragraph block w-full rounded px-1 text-left ${
                      isBookmarkedVerse(paragraph.firstVerse)
                        ? 'ring-1 ring-indigo-400'
                        : 'hover:bg-slate-100/60'
                    }`}
                    onClick={() => handleSetBookmark(paragraph.firstVerse)}>
                    {paragraph.verses.map((entry) => (
                      <span key={`${paragraph.key}-${entry.verse}`}>
                        <sup className="mr-1 align-super text-xs font-semibold">
                          {entry.verse}
                        </sup>
                        {entry.verseText}{' '}
                      </span>
                    ))}
                  </button>
                ))}
              {readerPreferences.readingStyle === 'clean' &&
                cleanParagraphs.map((paragraph) => (
                  <button
                    key={paragraph.key}
                    type="button"
                    data-verse-start={paragraph.verses[0]?.verse}
                    data-verse-end={
                      paragraph.verses[paragraph.verses.length - 1]?.verse
                    }
                    className={`reader-verse-paragraph block w-full rounded px-1 text-left ${
                      isBookmarkedVerse(paragraph.firstVerse)
                        ? 'ring-1 ring-indigo-400'
                        : 'hover:bg-slate-100/60'
                    }`}
                    onClick={() => handleSetBookmark(paragraph.firstVerse)}>
                    {paragraph.text}
                  </button>
                ))}
            </div>
          </div>
          {isReaderComfortEnabled &&
            readerPreferences.breakReminder &&
            !isBreakTipDismissed && (
              <div className="reader-break-reminder rounded-md border p-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <p>
                    Eye comfort tip: every 20 minutes, look at something about
                    20 feet away for 20 seconds.
                  </p>
                  <Button
                    variant="ghost"
                    className="reader-break-dismiss-button min-h-11"
                    onClick={() => {
                      setIsBreakTipDismissed(true);
                      trackEvent('reader_break_tip_dismissed');
                    }}>
                    Dismiss
                  </Button>
                </div>
              </div>
            )}
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
    </div>
  );
}
