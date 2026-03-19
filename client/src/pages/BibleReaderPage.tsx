import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BIBLE_BOOKS } from '@shared/bible-books';
import { getMaxChaptersForBook } from '@shared/bible-book-chapter-counts';
import type {
  ReaderBookmark,
  ReaderChapterResponse,
  ReaderPreferencesPayload,
  ReaderReadingStyle,
  ScriptureTranslationCode,
} from '@shared/scripture-search-contracts';
import type { SavedScriptureItem } from '@shared/saved-scripture-contracts';
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
  readSavedScripturesForChapter,
  readReaderState,
  saveScripture,
  updateReaderState,
  updateSavedScriptureNote,
} from '@/features/search/scripture-search-api';
import { appCopy } from '@/lib/copy';
import { trackEvent } from '@/lib/telemetry';
import {
  buildAbsoluteVerseShareUrl,
  shareVerseLink,
} from '@/lib/verse-sharing';

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

type ReaderVerseTarget = {
  key: string;
  book: string;
  chapter: number;
  verse: number;
  translation: ScriptureTranslationCode;
  reference: string;
  verseText: string;
};

function toSavedRangeKey(input: {
  translation: string;
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
}): string {
  return [
    input.translation.toUpperCase(),
    input.book,
    input.chapter,
    input.verseStart,
    input.verseEnd,
  ].join(':');
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
  const initialCanonicalBook =
    initialBook && BIBLE_BOOKS.some((bookName) => bookName === initialBook)
      ? initialBook
      : BIBLE_BOOKS[0];
  const initialChapterValue =
    Number.isInteger(initialChapter) && initialChapter > 0 ? initialChapter : 1;
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
  const [savedChapterItems, setSavedChapterItems] = useState<
    SavedScriptureItem[]
  >([]);
  const [verseActionTarget, setVerseActionTarget] =
    useState<ReaderVerseTarget | null>(null);
  const [noteModalTarget, setNoteModalTarget] =
    useState<ReaderVerseTarget | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [isNoteSaving, setIsNoteSaving] = useState(false);
  const [noteSaveError, setNoteSaveError] = useState('');
  const verseActionReturnFocusRef = useRef<HTMLElement | null>(null);
  const noteModalReturnFocusRef = useRef<HTMLElement | null>(null);
  const [isReaderAuthLoading, setIsReaderAuthLoading] = useState(true);
  const [isReaderAuthenticated, setIsReaderAuthenticated] = useState(false);
  const isReaderComfortEnabled = parseBooleanFlag(
    import.meta.env.VITE_READER_COMFORT_ENABLED,
    true,
  );
  const [readerPreferences, setReaderPreferences] = useState<ReaderPreferences>(
    () => loadReaderPreferences(),
  );
  const maxChapterForBook = useMemo(() => getMaxChaptersForBook(book), [book]);

  useEffect(() => {
    setChapter((current) => Math.min(Math.max(1, current), maxChapterForBook));
  }, [maxChapterForBook]);

  useEffect(() => {
    setChapterInputValue(String(chapter));
  }, [chapter]);

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
  }, [isOptionsModalOpen, noteModalTarget, verseActionTarget]);

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

  function toReaderVerseTarget(input: {
    verse: number;
    verseText: string;
  }): ReaderVerseTarget {
    return {
      key: `${translation}:${book}:${chapter}:${input.verse}`,
      book,
      chapter,
      verse: input.verse,
      translation,
      reference: `${book} ${chapter}:${input.verse}`,
      verseText: input.verseText,
    };
  }

  function findExactSavedItemForVerse(
    verse: number,
  ): SavedScriptureItem | null {
    return (
      savedItemsByRangeKey.get(
        toSavedRangeKey({
          translation,
          book,
          chapter,
          verseStart: verse,
          verseEnd: verse,
        }),
      ) ?? null
    );
  }

  function findAnySavedItemForVerse(verse: number): SavedScriptureItem | null {
    const exact = findExactSavedItemForVerse(verse);
    if (exact) return exact;
    const covered = savedItemsByCoveredVerse.get(verse);
    return covered?.[0] ?? null;
  }

  function hasSavedNoteForVerse(verse: number): boolean {
    const covered = savedItemsByCoveredVerse.get(verse) ?? [];
    return covered.some((item) => Boolean(item.note?.trim()));
  }

  function openVerseActionsModal(target: ReaderVerseTarget) {
    verseActionReturnFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setVerseActionTarget(target);
    trackEvent('reader_verse_actions_opened', {
      book: target.book,
      chapter: target.chapter,
      verse: target.verse,
      translation: target.translation,
    });
  }

  function closeVerseActionsModal() {
    setVerseActionTarget(null);
    verseActionReturnFocusRef.current?.focus();
  }

  async function handleSaveVerseFromReader(target: ReaderVerseTarget) {
    try {
      const saved = await saveScripture({
        translation: target.translation,
        book: target.book,
        chapter: target.chapter,
        verseStart: target.verse,
        verseEnd: target.verse,
        reference: target.reference,
        sourceMode: 'local',
      });
      setSavedChapterItems((current) => {
        const exists = current.some((item) => item.savedId === saved.savedId);
        return exists ? current : [saved, ...current];
      });
      setBookmarkStatus(`Saved ${target.reference}.`);
      closeVerseActionsModal();
      trackEvent('reader_save_verse', {
        book: target.book,
        chapter: target.chapter,
        verse: target.verse,
        translation: target.translation,
      });
    } catch (err) {
      setBookmarkStatus(
        err instanceof Error
          ? err.message
          : 'We could not save this verse yet.',
      );
    }
  }

  async function ensureSavedItemForVerse(
    target: ReaderVerseTarget,
  ): Promise<SavedScriptureItem> {
    const existing = findAnySavedItemForVerse(target.verse);
    if (existing) return existing;
    const saved = await saveScripture({
      translation: target.translation,
      book: target.book,
      chapter: target.chapter,
      verseStart: target.verse,
      verseEnd: target.verse,
      reference: target.reference,
      sourceMode: 'local',
    });
    setSavedChapterItems((current) => {
      const exists = current.some((item) => item.savedId === saved.savedId);
      return exists ? current : [saved, ...current];
    });
    setBookmarkStatus(`Saved ${target.reference}.`);
    trackEvent('reader_save_verse', {
      book: target.book,
      chapter: target.chapter,
      verse: target.verse,
      translation: target.translation,
    });
    return saved;
  }

  async function openNoteModalForVerse(target: ReaderVerseTarget) {
    let saved: SavedScriptureItem;
    try {
      saved = await ensureSavedItemForVerse(target);
    } catch (err) {
      setBookmarkStatus(
        err instanceof Error
          ? err.message
          : 'We could not open note editing yet.',
      );
      return;
    }
    setNoteSaveError('');
    setNoteDraft(saved.note ?? '');
    noteModalReturnFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setNoteModalTarget(target);
    setVerseActionTarget(null);
    trackEvent('reader_note_opened', {
      book: target.book,
      chapter: target.chapter,
      verse: target.verse,
      translation: target.translation,
      hasExistingNote: Boolean(saved.note?.trim()),
    });
  }

  function closeNoteModal() {
    setNoteModalTarget(null);
    setNoteSaveError('');
    noteModalReturnFocusRef.current?.focus();
  }

  async function handleSaveReaderVerseNote() {
    if (!noteModalTarget) return;
    let saved: SavedScriptureItem;
    try {
      saved = await ensureSavedItemForVerse(noteModalTarget);
    } catch (err) {
      setNoteSaveError(
        err instanceof Error
          ? err.message
          : 'We could not prepare this saved verse.',
      );
      return;
    }
    setIsNoteSaving(true);
    setNoteSaveError('');
    try {
      const updated = await updateSavedScriptureNote(saved.savedId, noteDraft);
      setSavedChapterItems((current) =>
        current.map((item) =>
          item.savedId === updated.savedId
            ? { ...item, note: updated.note }
            : item,
        ),
      );
      setBookmarkStatus(`Saved note for ${noteModalTarget.reference}.`);
      closeNoteModal();
      trackEvent('reader_note_saved', {
        book: noteModalTarget.book,
        chapter: noteModalTarget.chapter,
        verse: noteModalTarget.verse,
        translation: noteModalTarget.translation,
        hasNote: Boolean(updated.note?.trim()),
      });
    } catch (err) {
      setNoteSaveError(
        err instanceof Error ? err.message : 'We could not save your note yet.',
      );
    } finally {
      setIsNoteSaving(false);
    }
  }

  async function handleShareVerseFromReader(target: ReaderVerseTarget) {
    const shareUrl = buildAbsoluteVerseShareUrl({
      book: target.book,
      chapter: target.chapter,
      verse: target.verse,
      translation: target.translation,
    });
    trackEvent('reader_share_clicked', {
      book: target.book,
      chapter: target.chapter,
      verse: target.verse,
      translation: target.translation,
    });
    try {
      const outcome = await shareVerseLink({
        title: `${target.reference} (${target.translation})`,
        text: target.verseText,
        url: shareUrl,
      });
      if (outcome === 'shared') {
        setBookmarkStatus(`Share options are open for ${target.reference}.`);
        closeVerseActionsModal();
        trackEvent('share_native_success', {
          source: 'reader',
          book: target.book,
          chapter: target.chapter,
          verse: target.verse,
          translation: target.translation,
        });
        return;
      }
      if (outcome === 'copied') {
        setBookmarkStatus(`Share link copied for ${target.reference}.`);
        closeVerseActionsModal();
        trackEvent('share_fallback_copy_success', {
          source: 'reader',
          book: target.book,
          chapter: target.chapter,
          verse: target.verse,
          translation: target.translation,
        });
        return;
      }
      setBookmarkStatus(appCopy.status.shareCanceled);
    } catch (err) {
      setBookmarkStatus(
        err instanceof Error ? err.message : appCopy.errors.couldNotShareVerse,
      );
      trackEvent('share_failed', {
        source: 'reader',
        book: target.book,
        chapter: target.chapter,
        verse: target.verse,
        translation: target.translation,
        message: err instanceof Error ? err.message : 'unknown',
      });
    }
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

  const savedItemsByRangeKey = useMemo(() => {
    const map = new Map<string, SavedScriptureItem>();
    for (const item of savedChapterItems) {
      map.set(
        toSavedRangeKey({
          translation: item.translation,
          book: item.book,
          chapter: item.chapter,
          verseStart: item.verseStart,
          verseEnd: item.verseEnd,
        }),
        item,
      );
    }
    return map;
  }, [savedChapterItems]);

  const savedItemsByCoveredVerse = useMemo(() => {
    const map = new Map<number, SavedScriptureItem[]>();
    for (const item of savedChapterItems) {
      for (let verse = item.verseStart; verse <= item.verseEnd; verse += 1) {
        const current = map.get(verse) ?? [];
        current.push(item);
        map.set(verse, current);
      }
    }
    return map;
  }, [savedChapterItems]);

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
      {isReaderComfortEnabled && isOptionsModalOpen && (
        <ModalShell
          title="Reader Options"
          titleId="reader-options-modal-title"
          onClose={() => setIsOptionsModalOpen(false)}
          panelClassName="max-h-[85vh] max-w-xl overflow-y-auto">
          <div className="sticky top-0 z-10 -mx-1 -mt-1 mb-3 flex items-center justify-between gap-2 border-b border-slate-200 bg-white px-1 pb-2 pt-1">
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
                        'Verse shows one verse per line. Standard keeps paragraph flow with verse numbers. Clean keeps paragraph flow without verse indicators.',
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
                        'Choose chapter colors (Light, Sepia, or Dark). This setting is separate from app-level dark mode.',
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
                        'Choose serif or sans-serif for chapter text.',
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
                        'Adjust chapter text size in Reader. XL is tuned for low-vision readability.',
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
                        'Adjust vertical spacing between lines to improve reading comfort.',
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
                        'Adjust spacing between verse blocks for easier scanning.',
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
                        'Adjust line length for comfort. Narrow can feel easier for focused reading.',
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
                    'Reduce animation and transitions in Reader interactions.',
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
                    'Show a gentle 20-20-20 eye comfort reminder while reading.',
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
                    'Hide bracket-style markers while reading. This changes display only, not source text.',
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
          <div className="sticky bottom-0 z-10 -mx-1 mt-4 flex justify-end border-t border-slate-200 bg-white px-1 pb-1 pt-2">
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
      {verseActionTarget && (
        <ModalShell
          title={verseActionTarget.reference}
          titleId="reader-verse-actions-title"
          onClose={closeVerseActionsModal}
          className="p-0 md:p-4"
          panelClassName="w-full max-w-none rounded-t-2xl rounded-b-none border-x-0 border-b-0 pb-[max(1rem,env(safe-area-inset-bottom))] md:max-w-md md:rounded-md md:border md:border-slate-200 md:pb-4">
          <div className="mt-3 space-y-3">
            <p className="text-sm text-slate-600">
              Choose what you would like to do with this verse.
            </p>
            <div className="grid grid-cols-1 gap-2">
              <Button
                variant="ghost"
                className="min-h-11 justify-start"
                onClick={() => {
                  handleSetBookmark(verseActionTarget.verse);
                  closeVerseActionsModal();
                }}>
                Bookmark Here
              </Button>
              <Button
                variant="ghost"
                className="min-h-11 justify-start"
                disabled={Boolean(
                  findExactSavedItemForVerse(verseActionTarget.verse),
                )}
                onClick={() => {
                  void handleSaveVerseFromReader(verseActionTarget);
                }}>
                Save Verse
              </Button>
              <Button
                variant="ghost"
                className="min-h-11 justify-start"
                onClick={() => {
                  void handleShareVerseFromReader(verseActionTarget);
                }}>
                Share Verse
              </Button>
              <Button
                variant="ghost"
                className="min-h-11 justify-start"
                onClick={() => {
                  void openNoteModalForVerse(verseActionTarget);
                }}>
                View/Edit Note
              </Button>
            </div>
            {hasSavedNoteForVerse(verseActionTarget.verse) ? (
              <p className="text-xs text-slate-600">
                This verse already has a note.
              </p>
            ) : null}
            <div className="flex justify-end">
              <Button
                variant="ghost"
                className="min-h-11"
                onClick={closeVerseActionsModal}>
                Close
              </Button>
            </div>
          </div>
        </ModalShell>
      )}
      {noteModalTarget && (
        <ModalShell
          title={`Note for ${noteModalTarget.reference}`}
          titleId="reader-note-modal-title"
          onClose={closeNoteModal}
          panelClassName="max-w-lg">
          <div className="mt-3 space-y-3">
            <p className="text-sm text-slate-600">
              Add or edit a note for this saved verse.
            </p>
            <textarea
              aria-label="Reader verse note"
              className="min-h-32 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              value={noteDraft}
              onChange={(event) => setNoteDraft(event.target.value)}
              placeholder="Add your note..."
            />
            {noteSaveError ? (
              <p className="text-sm text-rose-700" role="alert">
                {noteSaveError}
              </p>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                className="min-h-11"
                onClick={closeNoteModal}>
                Cancel
              </Button>
              <Button
                variant="primary"
                className="min-h-11"
                disabled={isNoteSaving}
                onClick={() => {
                  void handleSaveReaderVerseNote();
                }}>
                {isNoteSaving ? 'Saving...' : 'Save note'}
              </Button>
            </div>
          </div>
        </ModalShell>
      )}
      <Card className="-mx-6 mb-4 rounded-none border-x-0 p-4 sm:mx-0 sm:rounded-md sm:border-x">
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
                setChapterInputValue('1');
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
              max={maxChapterForBook}
              value={chapterInputValue}
              onChange={(event) => {
                const nextValue = event.target.value;
                setChapterInputValue(nextValue);
                if (nextValue === '') {
                  setError('');
                  return;
                }
                const parsed = Number(nextValue);
                if (!Number.isInteger(parsed) || parsed < 1) return;
                const clamped = Math.min(parsed, maxChapterForBook);
                setIsLoading(true);
                setError('');
                setChapter(clamped);
              }}
              onBlur={() => {
                if (chapterInputValue === '') return;
                const parsed = Number(chapterInputValue);
                if (!Number.isInteger(parsed) || parsed < 1) {
                  setChapterInputValue(String(chapter));
                  return;
                }
                const clamped = Math.min(
                  Math.max(1, parsed),
                  maxChapterForBook,
                );
                setChapterInputValue(String(clamped));
                if (clamped !== chapter) {
                  setIsLoading(true);
                  setError('');
                  setChapter(clamped);
                }
              }}
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
                Reader settings sync with your account.
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
                    onClick={() =>
                      openVerseActionsModal(
                        toReaderVerseTarget({
                          verse: verse.verse,
                          verseText: verse.verseText,
                        }),
                      )
                    }>
                    <sup className="mr-1 align-super text-xs font-semibold">
                      {verse.verse}
                    </sup>
                    {readerPreferences.hideTranslationIndicators
                      ? stripTranslationIndicatorText(verse.verseText)
                      : verse.verseText}
                    {hasSavedNoteForVerse(verse.verse) ? (
                      <sup
                        aria-label={`Has note for ${book} ${chapter}:${verse.verse}`}
                        className="ml-1 align-super text-[0.65rem] font-semibold text-indigo-700">
                        n
                      </sup>
                    ) : null}
                  </button>
                ))}
              {readerPreferences.readingStyle === 'standard' &&
                cleanParagraphs.map((paragraph) => (
                  <div
                    key={paragraph.key}
                    data-verse-start={paragraph.verses[0]?.verse}
                    data-verse-end={
                      paragraph.verses[paragraph.verses.length - 1]?.verse
                    }
                    className={`reader-verse-paragraph block w-full rounded px-1 text-left ${
                      isBookmarkedVerse(paragraph.firstVerse)
                        ? 'ring-1 ring-indigo-400'
                        : 'hover:bg-slate-100/60'
                    }`}>
                    {paragraph.verses.map((entry) => (
                      <span
                        key={`${paragraph.key}-${entry.verse}`}
                        role="button"
                        tabIndex={0}
                        aria-label={`Open actions for ${book} ${chapter}:${entry.verse}`}
                        className="inline cursor-pointer rounded px-0.5 hover:bg-slate-200/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400"
                        onClick={() =>
                          openVerseActionsModal(
                            toReaderVerseTarget({
                              verse: entry.verse,
                              verseText: entry.verseText,
                            }),
                          )
                        }
                        onKeyDown={(event) => {
                          if (event.key !== 'Enter' && event.key !== ' ')
                            return;
                          event.preventDefault();
                          openVerseActionsModal(
                            toReaderVerseTarget({
                              verse: entry.verse,
                              verseText: entry.verseText,
                            }),
                          );
                        }}>
                        <sup className="mr-1 align-super text-xs font-semibold text-indigo-700">
                          {entry.verse}
                        </sup>
                        {entry.verseText}
                        {hasSavedNoteForVerse(entry.verse) ? (
                          <sup
                            aria-label={`Has note for ${book} ${chapter}:${entry.verse}`}
                            className="ml-1 mr-1 align-super text-[0.55rem] font-semibold text-indigo-700">
                            n
                          </sup>
                        ) : null}{' '}
                      </span>
                    ))}
                  </div>
                ))}
              {readerPreferences.readingStyle === 'clean' &&
                cleanParagraphs.map((paragraph) => (
                  <div
                    key={paragraph.key}
                    data-verse-start={paragraph.verses[0]?.verse}
                    data-verse-end={
                      paragraph.verses[paragraph.verses.length - 1]?.verse
                    }
                    className={`reader-verse-paragraph block w-full rounded px-1 text-left ${
                      isBookmarkedVerse(paragraph.firstVerse)
                        ? 'ring-1 ring-indigo-400'
                        : 'hover:bg-slate-100/60'
                    }`}>
                    {paragraph.verses.map((entry) => (
                      <span
                        key={`${paragraph.key}-clean-${entry.verse}`}
                        role="button"
                        tabIndex={0}
                        aria-label={`Open actions for ${book} ${chapter}:${entry.verse}`}
                        className="inline cursor-pointer rounded px-0.5 hover:bg-slate-200/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400"
                        onClick={() =>
                          openVerseActionsModal(
                            toReaderVerseTarget({
                              verse: entry.verse,
                              verseText: entry.verseText,
                            }),
                          )
                        }
                        onKeyDown={(event) => {
                          if (event.key !== 'Enter' && event.key !== ' ')
                            return;
                          event.preventDefault();
                          openVerseActionsModal(
                            toReaderVerseTarget({
                              verse: entry.verse,
                              verseText: entry.verseText,
                            }),
                          );
                        }}>
                        {entry.verseText}
                        {hasSavedNoteForVerse(entry.verse) ? (
                          <sup
                            aria-label={`Has note for ${book} ${chapter}:${entry.verse}`}
                            className="ml-1 mr-1 align-super text-[0.55rem] font-semibold text-indigo-700">
                            n
                          </sup>
                        ) : null}{' '}
                      </span>
                    ))}
                  </div>
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
