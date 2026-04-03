import { afterEach, describe, expect, it } from 'vitest';
import {
  getInitialReaderChapterState,
  getLastReaderTo,
  LAST_READER_LOCATION_KEY,
  LAST_READER_LOCATION_LS_KEY,
  loadLastReaderLocation,
  saveLastReaderLocation,
} from './last-reader-location';
import { PREFERRED_TRANSLATION_STORAGE_KEY } from '@/lib/preferred-translation';

describe('last-reader-location', () => {
  afterEach(() => {
    try {
      window.sessionStorage.clear();
      window.localStorage.clear();
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

  it('falls back to localStorage when session is empty (cross-tab)', () => {
    window.localStorage.setItem(
      LAST_READER_LOCATION_LS_KEY,
      JSON.stringify({
        book: 'Psalms',
        chapter: 23,
        translation: 'KJV',
      }),
    );
    expect(loadLastReaderLocation()).toMatchObject({
      book: 'Psalms',
      chapter: 23,
      translation: 'KJV',
    });
    expect(getLastReaderTo()).toBe(
      '/reader?book=Psalms&chapter=23&translation=KJV',
    );
  });

  it('prefers sessionStorage over localStorage when both are set', () => {
    window.localStorage.setItem(
      LAST_READER_LOCATION_LS_KEY,
      JSON.stringify({
        book: 'Psalms',
        chapter: 23,
        translation: 'KJV',
      }),
    );
    window.sessionStorage.setItem(
      LAST_READER_LOCATION_KEY,
      JSON.stringify({
        book: 'John',
        chapter: 1,
        translation: 'KJV',
      }),
    );
    expect(loadLastReaderLocation()).toMatchObject({
      book: 'John',
      chapter: 1,
    });
  });

  it('getLastReaderTo prefers saved global translation over last-reader translation', () => {
    window.localStorage.setItem(
      PREFERRED_TRANSLATION_STORAGE_KEY,
      JSON.stringify({ v: 1, translation: 'ASV' }),
    );
    window.sessionStorage.setItem(
      LAST_READER_LOCATION_KEY,
      JSON.stringify({
        book: 'John',
        chapter: 3,
        translation: 'KJV',
      }),
    );
    expect(getLastReaderTo()).toBe(
      '/reader?book=John&chapter=3&translation=ASV',
    );
  });

  it('getInitialReaderChapterState seeds preference from URL once and overrides URL translation when set', () => {
    const params = new URLSearchParams({
      book: 'John',
      chapter: '3',
      translation: 'WEB',
    });
    const first = getInitialReaderChapterState(params);
    expect(first.translation).toBe('WEB');
    window.localStorage.setItem(
      PREFERRED_TRANSLATION_STORAGE_KEY,
      JSON.stringify({ v: 1, translation: 'ASV' }),
    );
    const second = getInitialReaderChapterState(params);
    expect(second.book).toBe('John');
    expect(second.chapter).toBe(3);
    expect(second.translation).toBe('ASV');
  });
});
