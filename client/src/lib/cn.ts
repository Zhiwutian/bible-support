import { twMerge } from 'tailwind-merge';

/**
 * Join class names and resolve conflicting Tailwind utilities (last wins).
 */
export function cn(
  ...values: Array<string | false | null | undefined>
): string {
  const merged = values.filter(Boolean).join(' ');
  return merged ? twMerge(merged) : '';
}
