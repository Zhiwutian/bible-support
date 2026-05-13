import type { ReactNode } from 'react';
import { cn } from '@/lib';
import { readerPreferencesClassNames } from '@/features/reader/reader-preferences';
import { useReaderPreferencesLive } from '@/features/reader/useReaderPreferencesLive';

type ReaderSurfaceProps = {
  children: ReactNode;
  className?: string;
  /** Stretch panel + text to the parent width (overrides default horizontal padding and prose max-width). */
  fullWidth?: boolean;
};

/**
 * Applies the same reader theme / typography CSS classes as BibleReaderPage
 * for embedded verse blocks (Support, Saved, etc.).
 */
export function ReaderSurface({
  children,
  className,
  fullWidth = false,
}: ReaderSurfaceProps) {
  const preferences = useReaderPreferencesLive();
  return (
    <div
      className={cn(
        readerPreferencesClassNames(preferences),
        /* reader-content: theme bg + border so light/sepia text stays on parchment in app dark mode */
        'reader-content rounded-md border py-3',
        fullWidth
          ? 'w-full rounded-none border-x-0 px-4 [&>.reader-chapter-text]:mx-0 [&>.reader-chapter-text]:w-full [&>.reader-chapter-text]:max-w-none'
          : 'px-2 sm:px-3',
        className,
      )}>
      <div className="reader-chapter-text max-w-none">{children}</div>
    </div>
  );
}
