import { describe, expect, it } from 'vitest';
import {
  buildBibleComPassageUrl,
  buildBibleGatewayPassageUrl,
} from './study-links';

describe('study-links', () => {
  it('buildBibleComPassageUrl returns USFM-based URL', () => {
    expect(
      buildBibleComPassageUrl({
        book: 'Psalms',
        chapter: 23,
        verse: 4,
        translation: 'KJV',
      }),
    ).toBe('https://www.bible.com/bible/1/PSA.23.4');
  });

  it('buildBibleComPassageUrl returns null when book cannot map', () => {
    expect(
      buildBibleComPassageUrl({
        book: 'Nope',
        chapter: 1,
        verse: 1,
        translation: 'KJV',
      }),
    ).toBeNull();
  });

  it('buildBibleGatewayPassageUrl encodes reference and version', () => {
    const url = buildBibleGatewayPassageUrl({
      reference: 'John 3:16',
      translation: 'KJV',
    });
    expect(url).toContain('biblegateway.com');
    expect(url).toContain('version=KJV');
    expect(url).toContain(encodeURIComponent('John 3:16'));
  });
});
