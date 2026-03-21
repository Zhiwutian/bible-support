import { afterEach, describe, expect, it } from 'vitest';
import {
  readRouteState,
  savedBookDetailRoutePath,
  savedBookDetailRouteStateSchema,
  searchPageRouteStateSchema,
  writeRouteState,
} from './route-session-state';

describe('route-session-state', () => {
  afterEach(() => {
    try {
      window.sessionStorage.clear();
    } catch {
      // ignore
    }
  });

  it('round-trips search page snapshot shape', () => {
    const path = '/search';
    const payload = {
      version: 1 as const,
      mode: 'guided' as const,
      translation: 'KJV',
      book: 'John',
      chapter: 3,
      verseStart: null,
      verseEnd: null,
      queryText: 'hope',
      source: 'local' as const,
      selectedVerseKeys: [] as string[],
      scrollY: 120,
    };
    writeRouteState(path, payload);
    expect(readRouteState(path, searchPageRouteStateSchema)).toEqual(payload);
  });

  it('round-trips saved book detail scroll', () => {
    const path = savedBookDetailRoutePath(encodeURIComponent('1 Samuel'));
    writeRouteState(path, { version: 1, scrollY: 88 });
    expect(readRouteState(path, savedBookDetailRouteStateSchema)).toEqual({
      version: 1,
      scrollY: 88,
    });
  });

  it('removes corrupt entries on read', () => {
    const path = '/search';
    window.sessionStorage.setItem(
      `routeState:v1:${path}`,
      '{"version":1,"invalid":true}',
    );
    expect(readRouteState(path, searchPageRouteStateSchema)).toBeNull();
    expect(window.sessionStorage.getItem(`routeState:v1:${path}`)).toBeNull();
  });
});
