import { Button } from '@/components/ui';

type ReaderBreakReminderProps = {
  isVisible: boolean;
  onDismiss: () => void;
};

/**
 * Gentle 20-20-20 reader break reminder panel.
 */
export function ReaderBreakReminder({
  isVisible,
  onDismiss,
}: ReaderBreakReminderProps) {
  if (!isVisible) return null;

  return (
    <div className="reader-break-reminder rounded-md border p-3 text-sm">
      <div className="flex items-start justify-between gap-3">
        <p>
          Eye comfort tip: every 20 minutes, look at something about 20 feet
          away for 20 seconds.
        </p>
        <Button
          variant="ghost"
          className="reader-break-dismiss-button min-h-11"
          onClick={onDismiss}>
          Dismiss
        </Button>
      </div>
    </div>
  );
}
