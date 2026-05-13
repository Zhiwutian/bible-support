import { describe, expect, it } from 'vitest';
import { isPrivacySafeReaderComfortRolloutPayload } from './reader-comfort-telemetry';

describe('reader comfort rollout telemetry', () => {
  it('accepts documented shapes for rollout events', () => {
    expect(
      isPrivacySafeReaderComfortRolloutPayload(
        'reader_preferences_reset',
        undefined,
      ),
    ).toBe(true);
    expect(
      isPrivacySafeReaderComfortRolloutPayload('reader_preference_changed', {
        key: 'theme',
        value: 'dark',
      }),
    ).toBe(true);
    expect(
      isPrivacySafeReaderComfortRolloutPayload('reader_preference_changed', {
        key: 'reducedMotion',
        value: true,
      }),
    ).toBe(true);
  });

  it('rejects preference payloads that could carry rich data', () => {
    expect(
      isPrivacySafeReaderComfortRolloutPayload('reader_preference_changed', {
        key: 'theme',
        value: { nested: 'no' },
      }),
    ).toBe(false);
    expect(
      isPrivacySafeReaderComfortRolloutPayload('reader_preference_changed', {
        key: 'theme',
        value: 'dark',
        extra: 'leak',
      }),
    ).toBe(false);
  });

  it('treats non-rollout events as out of scope for this helper', () => {
    expect(
      isPrivacySafeReaderComfortRolloutPayload('reader_bookmark_set', {
        book: 'John',
      }),
    ).toBe(true);
  });
});
