import { describe, expect, it } from 'vitest';
import {
  normalizeReaderBookmarkFields,
  parsePersistedScriptureTranslation,
} from './scripture-normalization.js';

describe('parsePersistedScriptureTranslation', () => {
  it('returns null for empty or unsupported values', () => {
    expect(parsePersistedScriptureTranslation(null)).toBeNull();
    expect(parsePersistedScriptureTranslation(undefined)).toBeNull();
    expect(parsePersistedScriptureTranslation('')).toBeNull();
    expect(parsePersistedScriptureTranslation('  ')).toBeNull();
    expect(parsePersistedScriptureTranslation('NIV')).toBeNull();
  });

  it('accepts supported codes case-insensitively', () => {
    expect(parsePersistedScriptureTranslation('kjv')).toBe('KJV');
    expect(parsePersistedScriptureTranslation(' WEB ')).toBe('WEB');
  });
});

describe('normalizeReaderBookmarkFields', () => {
  it('canonicalizes book aliases', () => {
    const out = normalizeReaderBookmarkFields({
      book: 'psalm',
      chapter: 1,
      verse: 1,
      translation: 'KJV',
      scrollOffset: 0,
    });
    expect(out).toEqual({
      book: 'Psalms',
      chapter: 1,
      verse: 1,
      translation: 'KJV',
      scrollOffset: 0,
    });
  });

  it('returns null for unknown book', () => {
    expect(
      normalizeReaderBookmarkFields({
        book: 'Not a Bible book',
        chapter: 1,
        verse: 1,
        translation: 'KJV',
        scrollOffset: 0,
      }),
    ).toBeNull();
  });
});
