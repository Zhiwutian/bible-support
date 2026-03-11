import { ReactNode } from 'react';
import { Button } from './Button';
import { ModalShell } from './ModalShell';

type Props = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isConfirming?: boolean;
  children?: ReactNode;
};

/** Accessible confirmation modal used for destructive actions. */
export function ConfirmModal({
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isConfirming = false,
  children,
}: Props) {
  return (
    <ModalShell title={title} onClose={onCancel} className="items-center">
      <p id="confirm-modal-description" className="mt-2 text-sm text-slate-700">
        {description}
      </p>
      {children && <div className="mt-3">{children}</div>}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel} disabled={isConfirming}>
          {cancelLabel}
        </Button>
        <Button onClick={onConfirm} disabled={isConfirming}>
          {isConfirming ? 'Removing...' : confirmLabel}
        </Button>
      </div>
    </ModalShell>
  );
}
