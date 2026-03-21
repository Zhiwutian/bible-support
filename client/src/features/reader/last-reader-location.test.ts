import { afterEach, describe, expect, it } from 'vitest';
import {
  getLastReaderTo,
  LAST_READER_LOCATION_KEY,
  loadLastReaderLocation,
  saveLastReaderLocation,
} from './last-reader-location';

describe('last-reader-location', () => {
  afterEach(() => {
    try {
      window.sessionStorage.clear();
    } catch {
      // ignore
    }
  });

  it('round-trips book, chapter, translation, and optional verse', () => {
    saveLastReaderLocation({
      book: 'John',
      chapter: 3,
      translation: 'KJV',
      verse: 16,
    });
    expect(loadLastReaderLocation()).toEqual({
      book: 'John',
      chapter: 3,
      translation: 'KJV',
      verse: 16,
    });
    expect(getLastReaderTo()).toBe(
      '/reader?book=John&chapter=3&translation=KJV&verse=16',
    );
  });

  it('returns /reader when nothing is stored', () => {
    expect(getLastReaderTo()).toBe('/reader');
  });

  it('clears invalid JSON from storage on read', () => {
    window.sessionStorage.setItem(LAST_READER_LOCATION_KEY, '{not json');
    expect(loadLastReaderLocation()).toBeNull();
  });
});
