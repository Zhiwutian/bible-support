import { ReactNode } from 'react';
import { Button, ModalShell } from '@/components/ui';

type Props = {
  title: string;
  titleId: string;
  open: boolean;
  onClose: () => void;
  onApply: () => void;
  children: ReactNode;
};

/**
 * Shared modal frame for prayer roster / list filter forms (styleguide: ModalShell + mobile scroll).
 */
export function PrayerFilterModalShell({
  title,
  titleId,
  open,
  onClose,
  onApply,
  children,
}: Props) {
  if (!open) return null;

  return (
    <ModalShell
      title={title}
      titleId={titleId}
      onClose={onClose}
      panelClassName="max-h-[85vh] max-w-lg overflow-y-auto">
      <div className="mt-4 space-y-4">{children}</div>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="ghost"
          className="min-h-11 w-full sm:w-auto"
          onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="primary"
          className="min-h-11 w-full sm:w-auto"
          onClick={onApply}>
          Apply filters
        </Button>
      </div>
    </ModalShell>
  );
}
