import { Button } from '@/components/ui';

type ReaderStatusBarProps = {
  canJumpToLastPlace: boolean;
  bookmarkStatus: string;
  isReaderAuthLoading: boolean;
  isReaderAuthenticated: boolean;
  onJumpToLastPlace: () => void;
};

/**
 * Reader chapter status row with jump action and sync state.
 */
export function ReaderStatusBar({
  canJumpToLastPlace,
  bookmarkStatus,
  isReaderAuthLoading,
  isReaderAuthenticated,
  onJumpToLastPlace,
}: ReaderStatusBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="ghost"
        className="min-h-11"
        disabled={!canJumpToLastPlace}
        onClick={onJumpToLastPlace}>
        Jump to last place
      </Button>
      {bookmarkStatus ? (
        <p className="text-sm text-slate-600" role="status">
          {bookmarkStatus}
        </p>
      ) : null}
      {isReaderAuthLoading ? (
        <p className="text-xs text-slate-500">Checking account sync…</p>
      ) : isReaderAuthenticated ? (
        <p className="text-xs text-slate-500">
          Reader settings sync with your account.
        </p>
      ) : (
        <p className="text-xs text-slate-500">
          Reader settings save on this device.
        </p>
      )}
    </div>
  );
}
