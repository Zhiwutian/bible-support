import { beforeEach, describe, expect, it } from 'vitest';
import {
  defaultReaderPreferences,
  loadReaderBookmark,
  loadReaderPreferences,
  resetReaderBookmark,
  resetReaderPreferences,
  saveReaderBookmark,
  saveReaderPreferences,
} from './reader-preferences';

describe('reader preferences persistence', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('returns defaults when nothing is stored', () => {
    expect(loadReaderPreferences()).toEqual(defaultReaderPreferences);
  });

  it('returns stored preferences when schema is valid', () => {
    const stored = {
      ...defaultReaderPreferences,
      theme: 'dark' as const,
      fontFamily: 'sans' as const,
      reducedMotion: true,
    };
    saveReaderPreferences(stored);
    expect(loadReaderPreferences()).toEqual(stored);
  });

  it('falls back to defaults for invalid stored payload', () => {
    window.localStorage.setItem(
      'reader-preferences',
      JSON.stringify({
        version: 999,
        preferences: { theme: 'light' },
      }),
    );
    expect(loadReaderPreferences()).toEqual(defaultReaderPreferences);
  });

  it('upgrades v1 payloads with break reminder and reading style defaults', () => {
    window.localStorage.setItem(
      'reader-preferences',
      JSON.stringify({
        version: 1,
        preferences: {
          ...defaultReaderPreferences,
          breakReminder: undefined,
        },
      }),
    );
    expect(loadReaderPreferences()).toEqual({
      ...defaultReaderPreferences,
      breakReminder: true,
      readingStyle: 'verse',
    });
  });

  it('upgrades v2 payloads with reading style default', () => {
    const v2Preferences = { ...defaultReaderPreferences };
    delete (v2Preferences as { readingStyle?: string }).readingStyle;
    window.localStorage.setItem(
      'reader-preferences',
      JSON.stringify({
        version: 2,
        preferences: v2Preferences,
      }),
    );
    expect(loadReaderPreferences()).toEqual(defaultReaderPreferences);
  });

  it('upgrades v3 payloads with indicator toggle default', () => {
    const v3Preferences = { ...defaultReaderPreferences };
    delete (v3Preferences as { hideTranslationIndicators?: boolean })
      .hideTranslationIndicators;
    window.localStorage.setItem(
      'reader-preferences',
      JSON.stringify({
        version: 3,
        preferences: v3Preferences,
      }),
    );
    expect(loadReaderPreferences()).toEqual(defaultReaderPreferences);
  });

  it('resets persisted preferences', () => {
    saveReaderPreferences({
      ...defaultReaderPreferences,
      theme: 'dark',
    });
    const reset = resetReaderPreferences();
    expect(reset).toEqual(defaultReaderPreferences);
    expect(loadReaderPreferences()).toEqual(defaultReaderPreferences);
  });

  it('persists and loads local reader bookmark', () => {
    saveReaderBookmark({
      book: 'John',
      chapter: 3,
      verse: 16,
      translation: 'KJV',
      scrollOffset: 120,
    });
    expect(loadReaderBookmark()).toEqual({
      book: 'John',
      chapter: 3,
      verse: 16,
      translation: 'KJV',
      scrollOffset: 120,
    });
  });

  it('clears local reader bookmark', () => {
    saveReaderBookmark({
      book: 'John',
      chapter: 3,
      verse: 16,
      translation: 'KJV',
      scrollOffset: 120,
    });
    resetReaderBookmark();
    expect(loadReaderBookmark()).toBeNull();
  });
});
