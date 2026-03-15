import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib';

type Props = {
  to: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
};

/**
 * Reusable navigation link styled like an app button.
 */
export function NavLinkButton({ to, children, className, onClick }: Props) {
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
