import { describe, expect, it } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  it('merges conflicting Tailwind utilities (last wins)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('text-sm', 'text-base')).toBe('text-base');
  });

  it('drops falsy entries', () => {
    expect(cn('a', false, undefined, null, 'b')).toBe('a b');
  });
});
