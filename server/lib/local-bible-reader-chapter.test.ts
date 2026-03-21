import { access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it } from 'vitest';
import { ClientError } from '@server/lib/client-error.js';
import {
  __clearLocalBibleVerseMapCacheForTests,
  readReaderChapterFromLocalBibleJson,
} from './local-bible-reader-chapter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const kjvPath = path.resolve(__dirname, '../data/bible/kjv.json');

describe('readReaderChapterFromLocalBibleJson', () => {
  beforeEach(() => {
    __clearLocalBibleVerseMapCacheForTests();
  });

  it('returns Genesis 1 from bundled kjv.json when the file exists', async () => {
    try {
      await access(kjvPath);
    } catch {
      // Skip in environments without committed corpus (should not happen in CI).
      return;
    }

    const chapter = await readReaderChapterFromLocalBibleJson({
      translation: 'KJV',
      book: 'Genesis',
      chapter: 1,
    });

    expect(chapter).not.toBeNull();
    expect(chapter!.book).toBe('Genesis');
    expect(chapter!.chapter).toBe(1);
    expect(chapter!.verses.length).toBeGreaterThan(10);
    expect(chapter!.verses[0].verse).toBe(1);
    expect(chapter!.verses[0].reference).toMatch(/^Genesis 1:1$/);
  });

  it('throws ClientError 400 when chapter is beyond bundled book length', async () => {
    try {
      await access(kjvPath);
    } catch {
      return;
    }

    try {
      await readReaderChapterFromLocalBibleJson({
        translation: 'KJV',
        book: 'Genesis',
        chapter: 9999,
      });
      expect.fail('expected ClientError');
    } catch (err) {
      expect(err).toBeInstanceOf(ClientError);
      expect((err as ClientError).status).toBe(400);
    }
  });
});
