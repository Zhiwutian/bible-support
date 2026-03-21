import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { getLastReaderTo } from '@/features/reader/last-reader-location';
import { cn } from '@/lib';

type Props = {
  className?: string;
  children?: ReactNode;
};

/** Link to Reader using last session-stored book/chapter/translation. */
export function TutorialReaderLink({
  className,
  children = 'Open Reader',
}: Props) {
  return (
    <Link
      to={getLastReaderTo()}
      className={cn(
        'font-semibold text-indigo-700 hover:text-indigo-600',
        className,
      )}>
      {children}
    </Link>
  );
}
