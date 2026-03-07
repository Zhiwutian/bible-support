import { HTMLAttributes } from 'react';
import { cn } from '@/lib';

type BadgeVariant = 'neutral' | 'success';

const variantClassMap: Record<BadgeVariant, string> = {
  neutral: 'bg-slate-100 text-slate-700',
  success: 'bg-emerald-100 text-emerald-700',
};

type Props = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

/**
 * Small status pill for counts and state labels.
 */
export function Badge({ className, variant = 'neutral', ...props }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantClassMap[variant],
        className,
      )}
      {...props}
    />
  );
}
