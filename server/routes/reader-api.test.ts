import request from 'supertest';
import { Express } from 'express';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { ClientError } from '@server/lib/client-error.js';

const readReaderChapterMock = vi.fn();

vi.mock('@server/services/reader-service.js', () => ({
  readReaderChapter: (...args: unknown[]): unknown =>
    readReaderChapterMock(...args),
}));

describe('reader api routes', () => {
  let app: Express;

  beforeAll(async () => {
    process.env.TOKEN_SECRET = process.env.TOKEN_SECRET ?? 'test-token-secret';
    const { createApp } = await import('@server/app.js');
    app = createApp();
  });

  it('returns chapter payload from /api/reader/chapter', async () => {
    readReaderChapterMock.mockResolvedValue({
      translation: 'KJV',
      book: 'John',
      chapter: 3,
      verses: [
        {
          translation: 'KJV',
          book: 'John',
          chapter: 3,
          verse: 16,
          reference: 'John 3:16',
          verseText: 'For God so loved the world...',
        },
      ],
      displayText: 'John 3:16 For God so loved the world...',
      hasPrevious: true,
      hasNext: true,
      previousChapter: { book: 'John', chapter: 2 },
      nextChapter: { book: 'John', chapter: 4 },
    });
    const res = await request(app)
      .get('/api/reader/chapter')
      .query({ book: 'John', chapter: 3, translation: 'KJV' })
      .expect(200);
    expect(res.body.data).toEqual(
      expect.objectContaining({
        book: 'John',
        chapter: 3,
        hasPrevious: true,
        hasNext: true,
      }),
    );
  });

  it('returns validation error for missing required reader query', async () => {
    const res = await request(app).get('/api/reader/chapter').expect(400);
    expect(res.body.error.code).toBe('validation_error');
  });

  it('returns 400 when chapter is out of bounds', async () => {
    readReaderChapterMock.mockRejectedValue(
      new ClientError(400, 'chapter must be between 1 and 50 for Genesis'),
    );
    const res = await request(app)
      .get('/api/reader/chapter')
      .query({ book: 'Genesis', chapter: 99, translation: 'KJV' })
      .expect(400);
    expect(res.body.error.message).toContain('chapter must be between');
  });
});
