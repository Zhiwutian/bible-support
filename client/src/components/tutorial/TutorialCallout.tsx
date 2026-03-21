import type { ReactNode } from 'react';
import { cn } from '@/lib';

type Props = {
  children: ReactNode;
  variant?: 'info' | 'tip';
  className?: string;
};

export function TutorialCallout({
  children,
  variant = 'info',
  className,
}: Props) {
  return (
    <aside
      className={cn(
        'rounded-lg border px-4 py-3 text-sm leading-relaxed',
        variant === 'info' && 'border-indigo-200 bg-indigo-50 text-indigo-950',
        variant === 'tip' && 'border-amber-200 bg-amber-50 text-amber-950',
        className,
      )}>
      {children}
    </aside>
  );
}
