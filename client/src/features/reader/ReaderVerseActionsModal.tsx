import { Button, ModalShell } from '@/components/ui';
import { cn } from '@/lib';

type ReaderVerseActionsModalProps = {
  isOpen: boolean;
  reference: string;
  hasSavedNote: boolean;
  isVerseAlreadySaved: boolean;
  /** When true, backdrop stacks above reader immersive shell (z-[60]). */
  stackAboveImmersiveReader?: boolean;
  onClose: () => void;
  onBookmarkHere: () => void;
  onSaveVerse: () => void;
  onShareVerse: () => void;
  onViewEditNote: () => void;
};

/**
 * Reader verse action picker shown after selecting a verse.
 */
export function ReaderVerseActionsModal({
  isOpen,
  reference,
  hasSavedNote,
  isVerseAlreadySaved,
  stackAboveImmersiveReader = false,
  onClose,
  onBookmarkHere,
  onSaveVerse,
  onShareVerse,
  onViewEditNote,
}: ReaderVerseActionsModalProps) {
  if (!isOpen) return null;

  return (
    <ModalShell
      title={reference}
      titleId="reader-verse-actions-title"
      onClose={onClose}
      className={cn('p-0 md:p-4', stackAboveImmersiveReader && 'z-[70]')}
      panelClassName="w-full max-w-none rounded-t-2xl rounded-b-none border-x-0 border-b-0 pb-[max(1rem,env(safe-area-inset-bottom))] md:max-w-md md:rounded-md md:border md:border-slate-200 md:pb-4">
      <div className="mt-3 space-y-3">
        <p className="text-sm text-slate-600">
          Choose what you would like to do with this verse.
        </p>
        <div className="grid grid-cols-1 gap-2">
          <Button
            variant="ghost"
            className="min-h-11 justify-start"
            onClick={onBookmarkHere}>
            Bookmark Here
          </Button>
          <Button
            variant="ghost"
            className="min-h-11 justify-start"
            disabled={isVerseAlreadySaved}
            onClick={onSaveVerse}>
            Save Verse
          </Button>
          <Button
            variant="ghost"
            className="min-h-11 justify-start"
            onClick={onShareVerse}>
            Share Verse
          </Button>
          <Button
            variant="ghost"
            className="min-h-11 justify-start"
            onClick={onViewEditNote}>
            View/Edit Note
          </Button>
        </div>
        {hasSavedNote ? (
          <p className="text-xs text-slate-600">
            This verse already has a note.
          </p>
        ) : null}
        <div className="flex justify-end">
          <Button variant="ghost" className="min-h-11" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
