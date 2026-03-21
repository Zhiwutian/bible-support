import { type SelectHTMLAttributes, useId } from 'react';
import { cn } from '@/lib';

type Props = {
  /** Visible label text (rendered above the control). */
  label: string;
  /** Optional class on the outer label wrapper. */
  className?: string;
} & SelectHTMLAttributes<HTMLSelectElement>;

/**
 * Labeled native select aligned with prayer/search filter styling and global mobile select rules in `index.css`.
 */
export function Select({ label, className, id, children, ...props }: Props) {
  const autoId = useId();
  const selectId = id ?? autoId;

  return (
    <label className={cn('block text-sm text-slate-700', className)}>
      {label}
      <select
        id={selectId}
        className="mt-1 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
        {...props}>
        {children}
      </select>
    </label>
  );
}
