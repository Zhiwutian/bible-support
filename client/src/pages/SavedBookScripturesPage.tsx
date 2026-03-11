import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  SUPPORTED_SCRIPTURE_TRANSLATIONS,
  type SavedScriptureItem,
  type ScriptureTranslationCode,
} from '@shared/scripture-search-contracts';
import { useToast } from '@/components/app/toast-context';
import {
  Button,
  Card,
  ConfirmModal,
  EmptyState,
  ModalShell,
  SectionHeader,
} from '@/components/ui';
import {
  deleteSavedScripture,
  readSavedScriptures,
  searchScriptures,
  updateSavedScriptureTranslation,
} from '@/features/search/scripture-search-api';

/** Render saved verses for one selected Bible book. */
export function SavedBookScripturesPage() {
  const { showToast } = useToast();
  const { book: bookParam } = useParams();
  const decodedBook = useMemo(() => {
    if (!bookParam) return '';
    try {
      return decodeURIComponent(bookParam);
    } catch {
      return bookParam;
    }
  }, [bookParam]);
  const [savedItems, setSavedItems] = useState<SavedScriptureItem[]>([]);
  const [verseTextBySavedId, setVerseTextBySavedId] = useState<
    Record<number, string>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingDelete, setPendingDelete] = useState<SavedScriptureItem | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingTranslationId, setUpdatingTranslationId] = useState<
    number | null
  >(null);
  const [translationModalItem, setTranslationModalItem] =
    useState<SavedScriptureItem | null>(null);
  const [pendingTranslation, setPendingTranslation] =
    useState<ScriptureTranslationCode>('KJV');

  useEffect(() => {
    function handleEscapeClose(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      if (translationModalItem) {
        setTranslationModalItem(null);
        return;
      }
      if (pendingDelete) {
        setPendingDelete(null);
      }
    }
    window.addEventListener('keydown', handleEscapeClose);
    return () => {
      window.removeEventListener('keydown', handleEscapeClose);
    };
  }, [pendingDelete, translationModalItem]);

  useEffect(() => {
    let isCancelled = false;
    readSavedScriptures()
      .then((rows) => {
        if (!isCancelled) {
          setSavedItems(rows);
          setError('');
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'Could not load saves');
        }
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });
    return () => {
      isCancelled = true;
    };
  }, []);

  const bookItems = useMemo(
    () =>
      savedItems
        .filter((item) => item.book === decodedBook)
        .sort((a, b) => {
          if (a.chapter !== b.chapter) return a.chapter - b.chapter;
          if (a.verseStart !== b.verseStart) return a.verseStart - b.verseStart;
          return a.verseEnd - b.verseEnd;
        }),
    [decodedBook, savedItems],
  );

  useEffect(() => {
    let isCancelled = false;

    async function loadVerseText() {
      const entries = await Promise.all(
        bookItems.map(async (item) => {
          try {
            const result = await searchScriptures({
              mode: 'reference',
              translation: item.translation,
              q: item.reference,
              limit: 30,
            });
            const verseText = result.verses
              .map((verse) => verse.verseText)
              .join(' ')
              .trim();
            return [item.savedId, verseText || item.reference] as const;
          } catch {
            return [item.savedId, item.reference] as const;
          }
        }),
      );

      if (!isCancelled) {
        setVerseTextBySavedId(Object.fromEntries(entries));
      }
    }

    loadVerseText();
    return () => {
      isCancelled = true;
    };
  }, [bookItems]);

  async function handleDelete(savedId: number) {
    setIsDeleting(true);
    try {
      await deleteSavedScripture(savedId);
      setSavedItems((current) =>
        current.filter((item) => item.savedId !== savedId),
      );
      setPendingDelete(null);
      showToast({
        title: 'Removed from collection',
        variant: 'success',
      });
    } catch (err) {
      showToast({
        title: 'Could not remove saved verse',
        description: err instanceof Error ? err.message : 'Unexpected error',
        variant: 'error',
      });
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleTranslationChange(
    item: SavedScriptureItem,
    translation: ScriptureTranslationCode,
  ) {
    if (item.translation === translation) return;
    setUpdatingTranslationId(item.savedId);
    try {
      const updated = await updateSavedScriptureTranslation(
        item.savedId,
        translation,
      );
      setSavedItems((current) =>
        current.map((row) => (row.savedId === updated.savedId ? updated : row)),
      );
      showToast({
        title: 'Updated translation',
        description: `${updated.reference} now set to ${updated.translation}`,
        variant: 'success',
      });
    } catch (err) {
      showToast({
        title: 'Could not update translation',
        description: err instanceof Error ? err.message : 'Unexpected error',
        variant: 'error',
      });
    } finally {
      setUpdatingTranslationId(null);
    }
  }

  function openTranslationModal(item: SavedScriptureItem) {
    setTranslationModalItem(item);
    setPendingTranslation(item.translation);
  }

  async function applyTranslationChange() {
    if (!translationModalItem) return;
    await handleTranslationChange(translationModalItem, pendingTranslation);
    setTranslationModalItem(null);
  }

  return (
    <>
      <SectionHeader
        title={decodedBook ? `Saved in ${decodedBook}` : 'Saved verses'}
        description="Review and manage your saved verses for this book."
      />

      <div className="mb-4">
        <Link
          to="/saved"
          className="inline-flex min-h-11 items-center rounded-md px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
          Back to saved books
        </Link>
      </div>

      {isLoading && (
        <p className="text-sm text-slate-600">Loading saved verses...</p>
      )}

      {!isLoading && error && (
        <EmptyState
          title="Could not load saved verses"
          description={error}
          actions={
            <Button variant="ghost" onClick={() => window.location.reload()}>
              Retry
            </Button>
          }
        />
      )}

      {!isLoading && !error && bookItems.length === 0 && (
        <EmptyState
          title="No saved verses in this book"
          description="Go back to Saved and choose a different book, or add more verses from Search."
        />
      )}

      {!isLoading && !error && bookItems.length > 0 && (
        <div className="space-y-3">
          {bookItems.map((item) => (
            <Card key={item.savedId} className="space-y-2 border p-4">
              <p className="font-semibold text-slate-800">
                {item.reference} ({item.translation})
              </p>
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <span>Translation</span>
                <button
                  type="button"
                  className="min-h-11 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                  disabled={updatingTranslationId === item.savedId}
                  onClick={() => openTranslationModal(item)}>
                  {item.translation}
                </button>
              </div>
              <p className="leading-8 text-slate-800">
                {verseTextBySavedId[item.savedId] ?? 'Loading verse text...'}
              </p>
              <p className="text-sm text-slate-700">
                Source: {item.sourceMode} | Saved:{' '}
                {new Date(item.createdAt).toLocaleString()}
              </p>
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  className="min-h-11"
                  onClick={() => setPendingDelete(item)}>
                  Remove
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      {pendingDelete && (
        <ConfirmModal
          title="Remove saved verse?"
          description="This will permanently remove this verse from your saved collection."
          confirmLabel="Remove verse"
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => handleDelete(pendingDelete.savedId)}
          isConfirming={isDeleting}>
          <p className="text-sm text-slate-700">
            <span className="font-semibold text-slate-900">
              {pendingDelete.reference}
            </span>{' '}
            ({pendingDelete.translation})
          </p>
        </ConfirmModal>
      )}
      {translationModalItem && (
        <ModalShell
          title="Select translation"
          titleId="translation-modal-title"
          onClose={() => setTranslationModalItem(null)}>
          <p className="mt-2 text-sm text-slate-700">
            {translationModalItem.reference}
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2">
            {SUPPORTED_SCRIPTURE_TRANSLATIONS.map((translationCode) => (
              <button
                key={translationCode}
                type="button"
                className={`min-h-11 rounded-md border px-3 py-2 text-left text-sm ${
                  pendingTranslation === translationCode
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                    : 'border-slate-300 bg-white text-slate-800'
                }`}
                onClick={() => setPendingTranslation(translationCode)}>
                {translationCode}
              </button>
            ))}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              className="min-h-11 rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              onClick={() => setTranslationModalItem(null)}
              disabled={updatingTranslationId === translationModalItem.savedId}>
              Cancel
            </button>
            <button
              type="button"
              className="min-h-11 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
              onClick={applyTranslationChange}
              disabled={updatingTranslationId === translationModalItem.savedId}>
              {updatingTranslationId === translationModalItem.savedId
                ? 'Updating...'
                : 'Apply'}
            </button>
          </div>
        </ModalShell>
      )}
    </>
  );
}
