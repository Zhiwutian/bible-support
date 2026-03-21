import { describe, expect, it } from 'vitest';
import { isValidIanaTimeZoneId } from './iana-timezone.js';

describe('isValidIanaTimeZoneId', () => {
  it('accepts UTC and common regions when Intl enumeration is available', () => {
    expect(isValidIanaTimeZoneId('UTC')).toBe(true);
    expect(isValidIanaTimeZoneId('America/Chicago')).toBe(true);
    expect(isValidIanaTimeZoneId('Europe/London')).toBe(true);
  });

  it('rejects empty and obvious garbage', () => {
    expect(isValidIanaTimeZoneId('')).toBe(false);
    expect(isValidIanaTimeZoneId('not a zone')).toBe(false);
    expect(isValidIanaTimeZoneId('../../../etc/passwd')).toBe(false);
  });
});
