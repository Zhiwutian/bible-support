import { HTMLAttributes } from 'react';
import { cn } from '@/lib';

type Props = HTMLAttributes<HTMLElement>;

/**
 * Shared card container for grouped content blocks.
 */
export function Card({ className, ...props }: Props) {
  return (
    <section
      className={cn(
        'rounded-md border border-slate-200 bg-white shadow-sm',
        className,
      )}
      {...props}
    />
  );
}
