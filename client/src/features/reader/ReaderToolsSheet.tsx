import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui';
import { cn } from '@/lib';

const TITLE_ID = 'reader-tools-sheet-title';

type ReaderToolsSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  /** Bottom sheet on narrow viewports; centered modal on md+. */
  useBottomSheetLayout: boolean;
  isReaderComfortEnabled: boolean;
  onSelectFullScreen: () => void;
  onSelectReaderOptions: () => void;
};

/**
 * Reader tools entry point: full-screen reading and optional reader options.
 */
export function ReaderToolsSheet({
  isOpen,
  onClose,
  useBottomSheetLayout,
  isReaderComfortEnabled,
  onSelectFullScreen,
  onSelectReaderOptions,
}: ReaderToolsSheetProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const id = window.requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    });
    return () => window.cancelAnimationFrame(id);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-[52] flex bg-black/40 motion-safe:transition-opacity motion-reduce:transition-none',
        useBottomSheetLayout
          ? 'items-end justify-center p-0'
          : 'cursor-pointer items-center justify-center p-4',
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby={TITLE_ID}
      onClick={onClose}>
      <section
        ref={panelRef}
        className={cn(
          'w-full cursor-default border border-slate-200 bg-white shadow-lg motion-safe:transition-transform motion-reduce:transition-none',
          useBottomSheetLayout
            ? 'max-h-[min(85vh,100dvh)] max-w-none rounded-t-2xl rounded-b-none border-x-0 border-b-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4'
            : 'max-w-md rounded-md p-4',
        )}
        onClick={(event) => event.stopPropagation()}>
        <h2 id={TITLE_ID} className="text-base font-semibold text-slate-900">
          Reader tools
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Choose how you want to read this chapter.
        </p>
        <div className="mt-4 grid gap-2">
          <Button
            type="button"
            variant="primary"
            className="min-h-11 w-full justify-center"
            onClick={onSelectFullScreen}>
            Full screen
          </Button>
          {isReaderComfortEnabled ? (
            <Button
              type="button"
              variant="ghost"
              className="min-h-11 w-full justify-center"
              onClick={onSelectReaderOptions}>
              Reader options
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            className="min-h-11 w-full justify-center"
            onClick={onClose}>
            Close
          </Button>
        </div>
      </section>
    </div>
  );
}
