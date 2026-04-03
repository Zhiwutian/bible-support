import { afterEach, describe, expect, it } from 'vitest';
import {
  loadPreferredTranslation,
  PREFERRED_TRANSLATION_STORAGE_KEY,
  savePreferredTranslation,
  seedPreferredTranslationFromReaderUrlIfNeeded,
} from './preferred-translation';

describe('preferred-translation', () => {
  afterEach(() => {
    try {
      window.localStorage.clear();
    } catch {
      // ignore
    }
  });

  it('round-trips a supported translation', () => {
    savePreferredTranslation('WEB');
    expect(loadPreferredTranslation()).toBe('WEB');
  });

  it('returns null and clears storage for invalid JSON', () => {
    window.localStorage.setItem(PREFERRED_TRANSLATION_STORAGE_KEY, '{');
    expect(loadPreferredTranslation()).toBeNull();
    expect(
      window.localStorage.getItem(PREFERRED_TRANSLATION_STORAGE_KEY),
    ).toBeNull();
  });

  it('returns null for wrong schema version', () => {
    window.localStorage.setItem(
      PREFERRED_TRANSLATION_STORAGE_KEY,
      JSON.stringify({ v: 2, translation: 'KJV' }),
    );
    expect(loadPreferredTranslation()).toBeNull();
  });

  it('seeds from reader URL only when preference is unset', () => {
    const params = new URLSearchParams({ translation: 'asv' });
    seedPreferredTranslationFromReaderUrlIfNeeded(params);
    expect(loadPreferredTranslation()).toBe('ASV');
    window.localStorage.removeItem(PREFERRED_TRANSLATION_STORAGE_KEY);
    savePreferredTranslation('KJV');
    seedPreferredTranslationFromReaderUrlIfNeeded(
      new URLSearchParams({ translation: 'WEB' }),
    );
    expect(loadPreferredTranslation()).toBe('KJV');
  });
});
