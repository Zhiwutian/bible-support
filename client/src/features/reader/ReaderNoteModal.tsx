import { Button, ModalShell } from '@/components/ui';

type ReaderNoteModalProps = {
  isOpen: boolean;
  reference: string;
  noteDraft: string;
  noteSaveError: string;
  isNoteSaving: boolean;
  onClose: () => void;
  onNoteDraftChange: (nextValue: string) => void;
  onSaveNote: () => void;
};

/**
 * Reader note modal for viewing/editing a verse note.
 */
export function ReaderNoteModal({
  isOpen,
  reference,
  noteDraft,
  noteSaveError,
  isNoteSaving,
  onClose,
  onNoteDraftChange,
  onSaveNote,
}: ReaderNoteModalProps) {
  if (!isOpen) return null;

  return (
    <ModalShell
      title={`Note for ${reference}`}
      titleId="reader-note-modal-title"
      onClose={onClose}
      panelClassName="max-w-lg">
      <div className="mt-3 space-y-3">
        <p className="text-sm text-slate-600">
          Add or edit a note for this saved verse.
        </p>
        <textarea
          aria-label="Reader verse note"
          className="min-h-32 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          value={noteDraft}
          onChange={(event) => onNoteDraftChange(event.target.value)}
          placeholder="Add your note..."
        />
        {noteSaveError ? (
          <p className="text-sm text-rose-700" role="alert">
            {noteSaveError}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" className="min-h-11" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            className="min-h-11"
            disabled={isNoteSaving}
            onClick={onSaveNote}>
            {isNoteSaving ? 'Saving...' : 'Save note'}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
