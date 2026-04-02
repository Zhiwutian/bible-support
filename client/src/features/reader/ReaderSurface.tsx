import type { ReactNode } from 'react';
import { cn } from '@/lib';
import { readerPreferencesClassNames } from '@/features/reader/reader-preferences';
import { useReaderPreferencesLive } from '@/features/reader/useReaderPreferencesLive';

type ReaderSurfaceProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Applies the same reader theme / typography CSS classes as BibleReaderPage
 * for embedded verse blocks (Support, Saved, etc.).
 */
export function ReaderSurface({ children, className }: ReaderSurfaceProps) {
  const preferences = useReaderPreferencesLive();
  return (
    <div
      className={cn(
        readerPreferencesClassNames(preferences),
        'rounded-md border border-slate-200/80 bg-transparent px-2 py-3 sm:px-3',
        className,
      )}>
      <div className="reader-chapter-text max-w-none">{children}</div>
    </div>
  );
}
