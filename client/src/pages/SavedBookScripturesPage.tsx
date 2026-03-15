import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  SUPPORTED_SCRIPTURE_TRANSLATIONS,
  type ScriptureTranslationCode,
} from '@shared/scripture-search-contracts';
import type {
  SavedScriptureGroup,
  SavedScriptureItem,
} from '@shared/saved-scripture-contracts';
import { useToast } from '@/components/app/toast-context';
import {
  Button,
  Card,
  ConfirmModal,
  EmptyState,
  ModalShell,
  SectionHeader,
  SettingHelpButton,
  SettingHelpModal,
} from '@/components/ui';
import {
  deleteSavedScripture,
  readSavedScriptureGroups,
  updateSavedScriptureTranslation,
  updateSavedScriptureNote,
} from '@/features/search/scripture-search-api';

/** Render saved verses for one selected Bible book. */
export function SavedBookScripturesPage() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { book: bookParam } = useParams();
  const decodedBook = useMemo(() => {
    if (!bookParam) return '';
    try {
      return decodeURIComponent(bookParam);
    } catch {
      return bookParam;
    }
  }, [bookParam]);
  const [savedGroups, setSavedGroups] = useState<SavedScriptureGroup[]>([]);
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
  const [updatingNoteId, setUpdatingNoteId] = useState<number | null>(null);
  const [noteDraftBySavedId, setNoteDraftBySavedId] = useState<
    Record<number, string>
  >({});
  const [settingsHelp, setSettingsHelp] = useState<{
    title: string;
    description: string;
  } | null>(null);

  const refreshSavedGroups = useCallback(async () => {
    const response = await readSavedScriptureGroups();
    setSavedGroups(response.groups);
  }, []);

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
    refreshSavedGroups()
      .then(() => {
        if (!isCancelled) {
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
  }, [refreshSavedGroups]);

  const bookGroups = useMemo(
    () =>
      savedGroups
        .map((group) => ({
          ...group,
          items: group.items
            .filter((item) => item.book === decodedBook)
            .sort((a, b) => {
              if (a.chapter !== b.chapter) return a.chapter - b.chapter;
              if (a.verseStart !== b.verseStart)
                return a.verseStart - b.verseStart;
              return a.verseEnd - b.verseEnd;
            }),
        }))
        .filter((group) => group.items.length > 0),
    [decodedBook, savedGroups],
  );

  useEffect(() => {
    const nextDrafts = Object.fromEntries(
      bookGroups
        .flatMap((group) => group.items)
        .map((item) => [item.savedId, item.note ?? '']),
    );
    setNoteDraftBySavedId(nextDrafts);
  }, [bookGroups]);

  async function handleDelete(savedId: number) {
    setIsDeleting(true);
    try {
      await deleteSavedScripture(savedId);
      await refreshSavedGroups();
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
      await refreshSavedGroups();
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

  async function handleSaveNote(item: SavedScriptureItem) {
    setUpdatingNoteId(item.savedId);
    try {
      const draft = noteDraftBySavedId[item.savedId] ?? '';
      const updated = await updateSavedScriptureNote(
        item.savedId,
        draft || null,
      );
      await refreshSavedGroups();
      setNoteDraftBySavedId((current) => ({
        ...current,
        [item.savedId]: updated.note ?? '',
      }));
      showToast({
        title: 'Note saved',
        variant: 'success',
      });
    } catch (err) {
      showToast({
        title: 'Could not save note',
        description: err instanceof Error ? err.message : 'Unexpected error',
        variant: 'error',
      });
    } finally {
      setUpdatingNoteId(null);
    }
  }

  function handleOpenItemInReader(item: SavedScriptureItem) {
    const readerParams = new URLSearchParams({
      book: item.book,
      chapter: String(item.chapter),
      translation: item.translation,
      verse: String(item.verseStart),
    });
    navigate(`/reader?${readerParams.toString()}`);
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

      {!isLoading && !error && bookGroups.length === 0 && (
        <EmptyState
          title="No saved verses in this book"
          description="Go back to Saved and choose a different book, or add more verses from Search."
        />
      )}

      {!isLoading && !error && bookGroups.length > 0 && (
        <div className="space-y-3">
          {bookGroups.map((group) => (
            <Card key={group.groupId} className="space-y-3 border p-4">
              <p className="text-sm font-semibold text-slate-700">
                {group.items.length > 1 ? 'Saved together' : 'Saved verse'} |{' '}
                {new Date(group.createdAt).toLocaleString()}
              </p>
              <pre className="whitespace-pre-wrap text-base leading-8 text-slate-800">
                {group.displayText}
              </pre>
              <div className="space-y-3">
                {group.items.map((item) => (
                  <Card key={item.savedId} className="space-y-2 border p-3">
                    <p className="font-semibold text-slate-800">
                      {item.reference} ({item.translation})
                    </p>
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <span>Translation</span>
                      <SettingHelpButton
                        settingLabel="Saved verse translation"
                        onClick={() =>
                          setSettingsHelp({
                            title: 'Saved verse translation',
                            description:
                              'Lets you change the translation for this saved verse while keeping the same reference coordinates.',
                          })
                        }
                      />
                      <button
                        type="button"
                        className="min-h-11 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                        disabled={updatingTranslationId === item.savedId}
                        onClick={() => openTranslationModal(item)}>
                        {item.translation}
                      </button>
                    </div>
                    <label className="flex flex-col gap-1 text-sm text-slate-700">
                      <span className="flex items-center gap-2">
                        Note
                        <SettingHelpButton
                          settingLabel="Saved verse note"
                          onClick={() =>
                            setSettingsHelp({
                              title: 'Saved verse note',
                              description:
                                'Stores one personal plain-text note for this saved verse entry.',
                            })
                          }
                        />
                      </span>
                      <textarea
                        className="min-h-24 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                        value={noteDraftBySavedId[item.savedId] ?? ''}
                        onChange={(event) =>
                          setNoteDraftBySavedId((current) => ({
                            ...current,
                            [item.savedId]: event.target.value,
                          }))
                        }
                        placeholder="Add a personal note for this saved scripture..."
                      />
                    </label>
                    <p className="text-sm text-slate-700">
                      Source: {item.sourceMode} | Saved:{' '}
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        className="min-h-11"
                        onClick={() => handleOpenItemInReader(item)}>
                        Open in reader
                      </Button>
                      <Button
                        variant="ghost"
                        className="min-h-11"
                        disabled={updatingNoteId === item.savedId}
                        onClick={() => void handleSaveNote(item)}>
                        {updatingNoteId === item.savedId
                          ? 'Saving note...'
                          : 'Save note'}
                      </Button>
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
            <Button
              variant="ghost"
              className="min-h-11"
              onClick={() => setTranslationModalItem(null)}
              disabled={updatingTranslationId === translationModalItem.savedId}>
              Cancel
            </Button>
            <Button
              variant="primary"
              className="min-h-11 disabled:opacity-60"
              onClick={applyTranslationChange}
              disabled={updatingTranslationId === translationModalItem.savedId}>
              {updatingTranslationId === translationModalItem.savedId
                ? 'Updating...'
                : 'Apply'}
            </Button>
          </div>
        </ModalShell>
      )}
      <SettingHelpModal
        help={settingsHelp}
        titleId="saved-settings-help-title"
        onClose={() => setSettingsHelp(null)}
      />
    </>
  );
}
