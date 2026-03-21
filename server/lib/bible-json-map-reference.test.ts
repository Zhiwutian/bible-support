import { describe, expect, it } from 'vitest';
import {
  normalizeBibleJsonVerseText,
  parseBibleJsonMapReference,
} from './bible-json-map-reference.js';

describe('parseBibleJsonMapReference', () => {
  it('parses standard references', () => {
    expect(parseBibleJsonMapReference('Genesis 1:1')).toEqual({
      book: 'Genesis',
      chapter: 1,
      verse: 1,
    });
  });

  it('normalizes Psalm to Psalms', () => {
    expect(parseBibleJsonMapReference('Psalm 23:1')).toEqual({
      book: 'Psalms',
      chapter: 23,
      verse: 1,
    });
  });

  it('returns null for invalid keys', () => {
    expect(parseBibleJsonMapReference('not-a-ref')).toBeNull();
  });
});

describe('normalizeBibleJsonVerseText', () => {
  it('strips paragraph marker and collapses whitespace', () => {
    expect(normalizeBibleJsonVerseText('#  In the beginning')).toBe(
      'In the beginning',
    );
  });
});
