import { ReactNode } from 'react';
import { Button } from './Button';
import { ModalShell } from './ModalShell';

type Props = {
  title: string;
  description: string;
  confirmLabel?: string;
  /** Shown on the confirm button while `isConfirming` is true (default: "Removing…"). */
  confirmPendingLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isConfirming?: boolean;
  children?: ReactNode;
  titleId?: string;
};

/** Accessible confirmation modal used for destructive actions. */
export function ConfirmModal({
  title,
  description,
  confirmLabel = 'Confirm',
  confirmPendingLabel = 'Removing...',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isConfirming = false,
  children,
  titleId = 'confirm-modal-title',
}: Props) {
  return (
    <ModalShell
      title={title}
      titleId={titleId}
      onClose={onCancel}
      className="items-center">
      <p id="confirm-modal-description" className="mt-2 text-sm text-slate-700">
        {description}
      </p>
      {children && <div className="mt-3">{children}</div>}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel} disabled={isConfirming}>
          {cancelLabel}
        </Button>
        <Button onClick={onConfirm} disabled={isConfirming}>
          {isConfirming ? confirmPendingLabel : confirmLabel}
        </Button>
      </div>
    </ModalShell>
  );
}
