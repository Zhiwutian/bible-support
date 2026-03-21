import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type {
  PrayerPartner,
  PrayerPartnerNote,
} from '@shared/prayer-contracts';
import { useToast } from '@/components/app/toast-context';
import {
  Button,
  Card,
  ConfirmModal,
  EmptyState,
  Input,
  SectionHeader,
  SettingHelpButton,
  SettingHelpModal,
} from '@/components/ui';
import {
  createPrayerPartnerNote,
  deletePrayerPartnerNote,
  readPrayerPartner,
  readPrayerPartnerNotes,
  updatePrayerPartner,
  updatePrayerPartnerNote,
} from '@/features/prayer-partners/prayer-partners-api';
import {
  prayerPartnerDetailRoutePath,
  prayerPartnerDetailRouteStateSchema,
  readRouteState,
  writeRouteState,
} from '@/lib/route-session-state';

function normalizePartnerImageUrl(rawValue: string): {
  value: string | null;
  error: string | null;
} {
  const trimmed = rawValue.trim();
  if (!trimmed) return { value: null, error: null };
  if (trimmed.toLowerCase().startsWith('data:')) {
    return {
      value: null,
      error:
        'Image URL must be a hosted http(s) link. Base64 data URLs are not supported.',
    };
  }
  if (trimmed.length > 2048) {
    return {
      value: null,
      error: 'Image URL must be 2048 characters or less.',
    };
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        value: null,
        error: 'Image URL must use http or https.',
      };
    }
  } catch {
    return {
      value: null,
      error: 'Image URL must be a valid URL.',
    };
  }
  return { value: trimmed, error: null };
}

export function PrayerPartnerDetailPage() {
  const { partnerId } = useParams();
  const { showToast } = useToast();
  const parsedPartnerId = Number(partnerId);
  const [partner, setPartner] = useState<PrayerPartner | null>(null);
  const [notes, setNotes] = useState<PrayerPartnerNote[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState('');
  const [prayerFocus, setPrayerFocus] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [newNote, setNewNote] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingNoteValue, setEditingNoteValue] = useState('');
  const [settingsHelp, setSettingsHelp] = useState<{
    title: string;
    description: string;
  } | null>(null);
  const [pendingDeleteNoteId, setPendingDeleteNoteId] = useState<number | null>(
    null,
  );
  const [isDeletingNote, setIsDeletingNote] = useState(false);

  const partnerDetailRoutePath = useMemo(() => {
    if (!partnerId) return '';
    return prayerPartnerDetailRoutePath(partnerId);
  }, [partnerId]);

  useEffect(() => {
    if (!partnerDetailRoutePath) return;
    const saved = readRouteState(
      partnerDetailRoutePath,
      prayerPartnerDetailRouteStateSchema,
    );
    if (saved) {
      requestAnimationFrame(() => {
        window.scrollTo({ top: saved.scrollY, left: 0, behavior: 'auto' });
      });
    }
  }, [partnerDetailRoutePath]);

  const persistPartnerDetailScroll = useCallback(() => {
    if (!partnerDetailRoutePath) return;
    writeRouteState(partnerDetailRoutePath, {
      version: 1,
      scrollY: Math.max(0, window.scrollY),
    });
  }, [partnerDetailRoutePath]);

  useEffect(() => {
    if (!partnerDetailRoutePath || isLoading) return;
    let timeoutId: number | undefined;
    function onScroll() {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        timeoutId = undefined;
        persistPartnerDetailScroll();
      }, 200);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      persistPartnerDetailScroll();
    };
  }, [partnerDetailRoutePath, isLoading, persistPartnerDetailScroll]);

  const loadDetail = useCallback(async () => {
    if (!Number.isFinite(parsedPartnerId) || parsedPartnerId <= 0) {
      setError('Invalid prayer partner id.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [partnerPayload, notesPayload] = await Promise.all([
        readPrayerPartner(parsedPartnerId),
        readPrayerPartnerNotes(parsedPartnerId),
      ]);
      setPartner(partnerPayload);
      setName(partnerPayload.name);
      setPrayerFocus(partnerPayload.prayerFocus);
      setImageUrl(partnerPayload.imageUrl ?? '');
      setNotes(notesPayload);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load partner');
    } finally {
      setIsLoading(false);
    }
  }, [parsedPartnerId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  async function onSavePartner() {
    if (!partner) return;
    const parsedImageUrl = normalizePartnerImageUrl(imageUrl);
    if (parsedImageUrl.error) {
      showToast({
        title: 'Invalid image URL',
        description: parsedImageUrl.error,
        variant: 'error',
      });
      return;
    }
    try {
      const updated = await updatePrayerPartner(partner.partnerId, {
        name: name.trim(),
        prayerFocus: prayerFocus.trim(),
        imageUrl: parsedImageUrl.value,
      });
      setPartner(updated);
      showToast({ title: 'Partner updated', variant: 'success' });
    } catch (err) {
      showToast({
        title: 'Could not update partner',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'error',
      });
    }
  }

  async function onAddNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!partner || !newNote.trim()) return;
    try {
      await createPrayerPartnerNote(partner.partnerId, {
        note: newNote.trim(),
      });
      setNewNote('');
      await loadDetail();
      showToast({ title: 'Note added', variant: 'success' });
    } catch (err) {
      showToast({
        title: 'Could not add note',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'error',
      });
    }
  }

  async function onSaveEditedNote(noteId: number) {
    if (!partner || !editingNoteValue.trim()) return;
    try {
      await updatePrayerPartnerNote(partner.partnerId, noteId, {
        note: editingNoteValue.trim(),
      });
      setEditingNoteId(null);
      setEditingNoteValue('');
      await loadDetail();
      showToast({ title: 'Note updated', variant: 'success' });
    } catch (err) {
      showToast({
        title: 'Could not update note',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'error',
      });
    }
  }

  async function confirmDeleteNote() {
    if (!partner || pendingDeleteNoteId == null) return;
    setIsDeletingNote(true);
    try {
      await deletePrayerPartnerNote(partner.partnerId, pendingDeleteNoteId);
      setPendingDeleteNoteId(null);
      await loadDetail();
      showToast({ title: 'Note deleted', variant: 'success' });
    } catch (err) {
      showToast({
        title: 'Could not delete note',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'error',
      });
    } finally {
      setIsDeletingNote(false);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-slate-600">Loading prayer partner...</p>;
  }

  if (error || !partner) {
    return (
      <EmptyState
        title="Prayer partner unavailable"
        description={error || 'This partner could not be found.'}
        actions={
          <Link to="/prayer-partners">
            <Button variant="ghost">Back to partners</Button>
          </Link>
        }
      />
    );
  }

  return (
    <>
      <SectionHeader
        title={partner.name}
        description="Track prayer needs and progress updates for this person."
        metadata={
          <SettingHelpButton
            settingLabel="Prayer partner detail"
            onClick={() =>
              setSettingsHelp({
                title: 'Partner detail',
                description:
                  'Update name, prayer focus, and an optional image URL (must be a normal http or https link to a hosted image—base64 data URLs are not allowed). Save changes before leaving if you edited fields. Progress notes are dated: add updates, edit, or delete individual notes. Use Back to return to the roster; archive or delete the partner from the hub card if you need to remove them from rotation.',
              })
            }
          />
        }
      />

      <Card className="mb-4 space-y-3 border p-4">
        <h2 className="text-base font-semibold text-slate-800">
          Partner details
        </h2>
        <label className="block text-sm font-medium text-slate-700">
          Name
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-1"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Prayer focus
          <textarea
            value={prayerFocus}
            onChange={(event) => setPrayerFocus(event.target.value)}
            rows={3}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Image URL
          <Input
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            className="mt-1"
            placeholder="https://..."
          />
          <span className="mt-1 block text-xs font-normal text-slate-500">
            Use a hosted http(s) image link. Base64 data URLs are not supported.
          </span>
        </label>
        <div className="flex gap-2">
          <Button variant="primary" onClick={() => void onSavePartner()}>
            Save changes
          </Button>
          <Link to="/prayer-partners">
            <Button variant="ghost">Back</Button>
          </Link>
        </div>
      </Card>

      <Card className="space-y-3 border p-4">
        <h2 className="text-base font-semibold text-slate-800">
          Progress notes
        </h2>
        <form className="space-y-2" onSubmit={(event) => void onAddNote(event)}>
          <textarea
            value={newNote}
            onChange={(event) => setNewNote(event.target.value)}
            rows={3}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Add an update from your latest conversation..."
          />
          <Button variant="primary" type="submit">
            Add note
          </Button>
        </form>

        {notes.length === 0 ? (
          <p className="text-sm text-slate-600">No notes yet.</p>
        ) : (
          <div className="space-y-2">
            {notes.map((note) => (
              <div
                key={note.prayerPartnerNoteId}
                className="rounded-md border p-3">
                {editingNoteId === note.prayerPartnerNoteId ? (
                  <>
                    <textarea
                      value={editingNoteValue}
                      onChange={(event) =>
                        setEditingNoteValue(event.target.value)
                      }
                      rows={3}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                    <div className="mt-2 flex gap-2">
                      <Button
                        variant="primary"
                        onClick={() =>
                          void onSaveEditedNote(note.prayerPartnerNoteId)
                        }>
                        Save
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setEditingNoteId(null);
                          setEditingNoteValue('');
                        }}>
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-slate-700">{note.note}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(note.createdAt).toLocaleString()}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setEditingNoteId(note.prayerPartnerNoteId);
                          setEditingNoteValue(note.note);
                        }}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() =>
                          setPendingDeleteNoteId(note.prayerPartnerNoteId)
                        }>
                        Delete
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
      <SettingHelpModal
        help={settingsHelp}
        titleId="prayer-partner-detail-settings-help-title"
        onClose={() => setSettingsHelp(null)}
      />
      {pendingDeleteNoteId != null ? (
        <ConfirmModal
          title="Delete this note?"
          titleId="prayer-partner-note-delete-confirm-title"
          description="This removes the note from this partner’s timeline. It cannot be undone."
          confirmLabel="Delete note"
          confirmPendingLabel="Deleting..."
          cancelLabel="Cancel"
          onCancel={() => setPendingDeleteNoteId(null)}
          onConfirm={() => void confirmDeleteNote()}
          isConfirming={isDeletingNote}
        />
      ) : null}
    </>
  );
}
