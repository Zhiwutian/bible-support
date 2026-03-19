import { useCallback, useMemo, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { ScriptureTranslationCode } from '@shared/scripture-search-contracts';
import type { SavedScriptureItem } from '@shared/saved-scripture-contracts';
import {
  saveScripture,
  updateSavedScriptureNote,
} from '@/features/search/scripture-search-api';
import { appCopy } from '@/lib/copy';
import { trackEvent } from '@/lib/telemetry';
import {
  buildAbsoluteVerseShareUrl,
  shareVerseLink,
} from '@/lib/verse-sharing';

export type ReaderVerseTarget = {
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

type UseReaderVerseActionsArgs = {
  book: string;
  chapter: number;
  translation: ScriptureTranslationCode;
  savedChapterItems: SavedScriptureItem[];
  setSavedChapterItems: Dispatch<SetStateAction<SavedScriptureItem[]>>;
  setBookmarkStatus: (value: string) => void;
};

/**
 * Manage reader verse actions, note flow, and share/save behavior.
 */
export function useReaderVerseActions({
  book,
  chapter,
  translation,
  savedChapterItems,
  setSavedChapterItems,
  setBookmarkStatus,
}: UseReaderVerseActionsArgs) {
  const [verseActionTarget, setVerseActionTarget] =
    useState<ReaderVerseTarget | null>(null);
  const [noteModalTarget, setNoteModalTarget] =
    useState<ReaderVerseTarget | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [isNoteSaving, setIsNoteSaving] = useState(false);
  const [noteSaveError, setNoteSaveError] = useState('');
  const verseActionReturnFocusRef = useRef<HTMLElement | null>(null);
  const noteModalReturnFocusRef = useRef<HTMLElement | null>(null);

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

  function toReaderVerseTarget(input: {
    verse: number;
    verseText: string;
  }): ReaderVerseTarget {
    return {
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

  function openVerseActionsForVerse(verse: number, verseText: string) {
    const target = toReaderVerseTarget({ verse, verseText });
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

  const closeVerseActionsModal = useCallback(() => {
    setVerseActionTarget(null);
    verseActionReturnFocusRef.current?.focus();
  }, []);

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

  const closeNoteModal = useCallback(() => {
    setNoteModalTarget(null);
    setNoteSaveError('');
    noteModalReturnFocusRef.current?.focus();
  }, []);

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

  return {
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
  };
}
