import { describe, expect, it } from 'vitest';
import { mapScriptureVerseRow } from './scripture-verse-row.js';

describe('mapScriptureVerseRow', () => {
  it('normalizes translation and copies verse fields', () => {
    const row = {
      verseId: 1,
      translation: 'kjv',
      book: 'John',
      chapter: 3,
      verse: 16,
      reference: 'John 3:16',
      verseText: ' For God so loved... ',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(mapScriptureVerseRow(row)).toEqual({
      translation: 'KJV',
      book: 'John',
      chapter: 3,
      verse: 16,
      reference: 'John 3:16',
      verseText: ' For God so loved... ',
    });
  });
});
