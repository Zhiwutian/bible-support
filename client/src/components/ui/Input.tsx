import { InputHTMLAttributes } from 'react';
import { cn } from '@/lib';

type Props = InputHTMLAttributes<HTMLInputElement>;

/**
 * Shared text input primitive for simple forms.
 * Checkbox/radio omit full-width defaults so inline toggles stay compact.
 */
export function Input({ className, type, ...props }: Props) {
  const isCheckboxOrRadio = type === 'checkbox' || type === 'radio';
  return (
    <input
      type={type}
      className={cn(
        !isCheckboxOrRadio && 'w-full min-w-0 max-w-full',
        'rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none ring-indigo-500 transition focus:ring-2',
        className,
      )}
      {...props}
    />
  );
}
