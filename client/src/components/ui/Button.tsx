import { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib';

type ButtonVariant = 'primary' | 'ghost';
type ButtonSize = 'sm' | 'md';

const variantClassMap: Record<ButtonVariant, string> = {
  primary:
    'bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 focus-visible:ring-indigo-500',
  ghost:
    'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-indigo-500',
};

const sizeClassMap: Record<ButtonSize, string> = {
  sm: 'rounded-md px-3 py-1.5 text-xs font-medium',
  md: 'rounded-md px-4 py-2 text-sm font-medium',
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

/**
 * Shared button primitive for app-level actions.
 */
export function Button({
  className,
  variant = 'primary',
  size = 'md',
  type = 'button',
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={cn(
        'transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        variantClassMap[variant],
        sizeClassMap[size],
        className,
      )}
      {...props}
    />
  );
}
