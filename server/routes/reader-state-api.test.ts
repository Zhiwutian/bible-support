import jwt from 'jsonwebtoken';
import request from 'supertest';
import { type Express } from 'express';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const readReaderStateByUserIdMock = vi.fn();
const patchReaderStateByUserIdMock = vi.fn();
const clearReaderStateByUserIdMock = vi.fn();

vi.mock('@server/services/reader-state-service.js', () => ({
  readReaderStateByUserId: (...args: unknown[]): unknown =>
    readReaderStateByUserIdMock(...args),
  patchReaderStateByUserId: (...args: unknown[]): unknown =>
    patchReaderStateByUserIdMock(...args),
  clearReaderStateByUserId: (...args: unknown[]): unknown =>
    clearReaderStateByUserIdMock(...args),
}));

describe('reader state api routes', () => {
  let app: Express;
  let sessionCookie: string;

  beforeAll(async () => {
    process.env.TOKEN_SECRET = process.env.TOKEN_SECRET ?? 'test-token-secret';
    process.env.SESSION_SECRET =
      process.env.SESSION_SECRET ?? 'test-session-secret';
    const { createApp } = await import('@server/app.js');
    app = createApp();
    const sessionToken = jwt.sign(
      { sid: 'reader-state-sid', userId: 'reader-user-1' },
      process.env.SESSION_SECRET,
    );
    sessionCookie = `app_session=${sessionToken}`;
  });

  beforeEach(() => {
    readReaderStateByUserIdMock.mockReset();
    patchReaderStateByUserIdMock.mockReset();
    clearReaderStateByUserIdMock.mockReset();
  });

  it('returns 401 for unauthenticated GET /api/reader/state', async () => {
    const res = await request(app).get('/api/reader/state').expect(401);
    expect(res.body.error.message).toContain('authentication required');
  });

  it('returns current reader state for authenticated GET /api/reader/state', async () => {
    readReaderStateByUserIdMock.mockResolvedValue({
      preferences: {
        theme: 'sepia',
        fontFamily: 'serif',
        fontSize: 'md',
        lineHeight: 'relaxed',
        paragraphSpacing: 'normal',
        contentWidth: 'balanced',
        reducedMotion: false,
        breakReminder: true,
        readingStyle: 'verse',
        hideTranslationIndicators: false,
      },
      bookmark: {
        book: 'John',
        chapter: 3,
        verse: 16,
        translation: 'KJV',
        scrollOffset: 120,
      },
      updatedAt: new Date().toISOString(),
    });

    const res = await request(app)
      .get('/api/reader/state')
      .set('cookie', sessionCookie)
      .expect(200);
    expect(res.body.data.preferences.readingStyle).toBe('verse');
    expect(res.body.data.bookmark.verse).toBe(16);
  });

  it('returns 400 for empty PATCH /api/reader/state payload', async () => {
    const res = await request(app)
      .patch('/api/reader/state')
      .set('cookie', sessionCookie)
      .send({})
      .expect(400);
    expect(res.body.error.code).toBe('validation_error');
  });

  it('patches reader state for authenticated user', async () => {
    patchReaderStateByUserIdMock.mockResolvedValue({
      preferences: {
        theme: 'dark',
        fontFamily: 'sans',
        fontSize: 'lg',
        lineHeight: 'relaxed',
        paragraphSpacing: 'normal',
        contentWidth: 'wide',
        reducedMotion: true,
        breakReminder: true,
        readingStyle: 'standard',
        hideTranslationIndicators: true,
      },
      bookmark: null,
      updatedAt: new Date().toISOString(),
    });

    const res = await request(app)
      .patch('/api/reader/state')
      .set('cookie', sessionCookie)
      .send({
        preferences: {
          theme: 'dark',
          fontFamily: 'sans',
          fontSize: 'lg',
          lineHeight: 'relaxed',
          paragraphSpacing: 'normal',
          contentWidth: 'wide',
          reducedMotion: true,
          breakReminder: true,
          readingStyle: 'standard',
          hideTranslationIndicators: true,
        },
      })
      .expect(200);
    expect(res.body.data.preferences.theme).toBe('dark');
    expect(patchReaderStateByUserIdMock).toHaveBeenCalledTimes(1);
  });

  it('clears reader state for authenticated user', async () => {
    clearReaderStateByUserIdMock.mockResolvedValue(undefined);
    await request(app)
      .delete('/api/reader/state')
      .set('cookie', sessionCookie)
      .expect(204);
    expect(clearReaderStateByUserIdMock).toHaveBeenCalledTimes(1);
  });
});
