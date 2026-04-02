import { describe, expect, it } from 'vitest';
import {
  buildReaderChapterQuery,
  buildReaderChapterSearchParams,
  resolveReaderChapterLocation,
  translationForReaderChapter,
} from './build-reader-chapter-url';

describe('build-reader-chapter-url', () => {
  it('resolveReaderChapterLocation parses John 3:16', () => {
    expect(
      resolveReaderChapterLocation({
        reference: 'John 3:16',
        translation: 'KJV',
      }),
    ).toEqual({ book: 'John', chapter: 3, verse: 16 });
  });

  it('resolveReaderChapterLocation uses explicit verse when provided', () => {
    expect(
      resolveReaderChapterLocation({
        reference: 'John 3:16-18',
        verse: 17,
        translation: 'KJV',
      }),
    ).toEqual({ book: 'John', chapter: 3, verse: 17 });
  });

  it('resolveReaderChapterLocation maps Psalm to Psalms', () => {
    expect(
      resolveReaderChapterLocation({
        reference: 'Psalm 23:1',
        translation: 'KJV',
      }),
    ).toEqual({ book: 'Psalms', chapter: 23, verse: 1 });
  });

  it('buildReaderChapterSearchParams includes emotion and scripture id', () => {
    const params = buildReaderChapterSearchParams({
      reference: 'Romans 8:28',
      translation: 'KJV',
      emotionSlug: 'hope',
      scriptureId: 42,
      fromTranslation: 'KJV',
    });
    expect(params).not.toBeNull();
    expect(params!.get('book')).toBe('Romans');
    expect(params!.get('chapter')).toBe('8');
    expect(params!.get('verse')).toBe('28');
    expect(params!.get('translation')).toBe('KJV');
    expect(params!.get('fromEmotion')).toBe('hope');
    expect(params!.get('fromScriptureId')).toBe('42');
    expect(params!.get('fromTranslation')).toBe('KJV');
  });

  it('buildReaderChapterSearchParams falls back to KJV for unsupported translation codes', () => {
    const params = buildReaderChapterSearchParams({
      reference: 'Genesis 1:1',
      translation: 'NIV',
    });
    expect(params).not.toBeNull();
    expect(params!.get('translation')).toBe('KJV');
  });

  it('translationForReaderChapter keeps KJV ASV WEB and flags others', () => {
    expect(translationForReaderChapter('KJV')).toEqual({
      translation: 'KJV',
      usedFallback: false,
      requestedLabel: 'KJV',
    });
    expect(translationForReaderChapter('asv')).toEqual({
      translation: 'ASV',
      usedFallback: false,
      requestedLabel: 'ASV',
    });
    expect(translationForReaderChapter('web')).toEqual({
      translation: 'WEB',
      usedFallback: false,
      requestedLabel: 'WEB',
    });
    expect(translationForReaderChapter('NIV')).toEqual({
      translation: 'KJV',
      usedFallback: true,
      requestedLabel: 'NIV',
    });
    expect(translationForReaderChapter('')).toEqual({
      translation: 'KJV',
      usedFallback: false,
      requestedLabel: '—',
    });
    expect(translationForReaderChapter(null)).toEqual({
      translation: 'KJV',
      usedFallback: false,
      requestedLabel: '—',
    });
  });

  it('buildReaderChapterQuery exposes usedTranslationFallback for unsupported codes', () => {
    const q = buildReaderChapterQuery({
      reference: 'John 3:16',
      translation: 'NIV',
    });
    expect(q).not.toBeNull();
    expect(q!.searchParams.get('translation')).toBe('KJV');
    expect(q!.effectiveTranslation).toBe('KJV');
    expect(q!.usedTranslationFallback).toBe(true);
  });

  it('buildReaderChapterQuery does not set usedTranslationFallback for WEB', () => {
    const q = buildReaderChapterQuery({
      reference: 'John 3:16',
      translation: 'WEB',
    });
    expect(q).not.toBeNull();
    expect(q!.searchParams.get('translation')).toBe('WEB');
    expect(q!.usedTranslationFallback).toBe(false);
  });
});
