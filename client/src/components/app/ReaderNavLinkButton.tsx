import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { getLastReaderTo } from '@/features/reader/last-reader-location';
import { cn } from '@/lib';

type Props = {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
};

/**
 * Navigates to Reader using the last session-stored book/chapter/translation when available.
 */
export function ReaderNavLinkButton({ children, className, onClick }: Props) {
  const to = getLastReaderTo();
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'inline-flex items-center rounded-md px-4 py-2 text-sm font-medium transition capitalize',
          'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
          isActive ? 'bg-slate-200 text-slate-900' : undefined,
          className,
        )
      }>
      {children}
    </NavLink>
  );
}
