import jwt from 'jsonwebtoken';
import request from 'supertest';
import { Express } from 'express';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { ClientError } from '@server/lib/client-error.js';

const searchScriptureVersesMock = vi.fn();
const readSavedScripturesMock = vi.fn();
const createSavedScriptureMock = vi.fn();
const updateSavedScriptureTranslationMock = vi.fn();
const removeSavedScriptureMock = vi.fn();
const migrateDeviceSavedScripturesToUserMock = vi.fn();
const readScriptureSourcesDiagnosticsMock = vi.fn();

vi.mock('@server/services/scripture-search-service.js', () => ({
  searchScriptureVerses: (...args: unknown[]): unknown =>
    searchScriptureVersesMock(...args),
}));

vi.mock('@server/services/saved-scripture-service.js', () => ({
  readSavedScriptures: (...args: unknown[]): unknown =>
    readSavedScripturesMock(...args),
  createSavedScripture: (...args: unknown[]): unknown =>
    createSavedScriptureMock(...args),
  migrateDeviceSavedScripturesToUser: (...args: unknown[]): unknown =>
    migrateDeviceSavedScripturesToUserMock(...args),
  updateSavedScriptureTranslation: (...args: unknown[]): unknown =>
    updateSavedScriptureTranslationMock(...args),
  removeSavedScripture: (...args: unknown[]): unknown =>
    removeSavedScriptureMock(...args),
}));

vi.mock('@server/services/scripture-diagnostics-service.js', () => ({
  readScriptureSourcesDiagnostics: (...args: unknown[]): unknown =>
    readScriptureSourcesDiagnosticsMock(...args),
}));

describe('scripture search + saved routes', () => {
  let app: Express;
  let authHeader: { authorization: string };
  let sessionCookie: string;

  beforeAll(async () => {
    process.env.TOKEN_SECRET = process.env.TOKEN_SECRET ?? 'test-token-secret';
    process.env.SESSION_SECRET =
      process.env.SESSION_SECRET ?? 'test-session-secret';
    const { createApp } = await import('@server/app.js');
    app = createApp();
    const token = jwt.sign({ role: 'admin' }, process.env.TOKEN_SECRET);
    authHeader = { authorization: `Bearer ${token}` };
    const sessionToken = jwt.sign(
      { sid: 'test-sid', userId: 'user-test-1' },
      process.env.SESSION_SECRET,
    );
    sessionCookie = `app_session=${sessionToken}`;
  });

  beforeEach(() => {
    searchScriptureVersesMock.mockReset();
    readSavedScripturesMock.mockReset();
    createSavedScriptureMock.mockReset();
    migrateDeviceSavedScripturesToUserMock.mockReset();
    updateSavedScriptureTranslationMock.mockReset();
    removeSavedScriptureMock.mockReset();
    readScriptureSourcesDiagnosticsMock.mockReset();
  });

  it('returns scripture search payload from /api/scriptures/search', async () => {
    searchScriptureVersesMock.mockResolvedValue({
      mode: 'reference',
      source: 'local',
      queryText: 'John 3:16',
      total: 1,
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
    });

    const res = await request(app)
      .get('/api/scriptures/search')
      .query({ mode: 'reference', translation: 'KJV', q: 'John 3:16' })
      .expect(200);
    expect(res.body.data).toEqual(
      expect.objectContaining({
        mode: 'reference',
        total: 1,
      }),
    );
  });

  it('returns 400 for /api/saved-scriptures when x-device-id is missing', async () => {
    const res = await request(app).get('/api/saved-scriptures').expect(400);
    expect(res.body.error).toEqual(
      expect.objectContaining({
        code: 'client_error',
      }),
    );
  });

  it('returns saved rows for /api/saved-scriptures with x-device-id', async () => {
    readSavedScripturesMock.mockResolvedValue([
      {
        savedId: 1,
        deviceId: 'device-12345678',
        label: null,
        translation: 'KJV',
        book: 'John',
        chapter: 3,
        verseStart: 16,
        verseEnd: 16,
        reference: 'John 3:16',
        sourceMode: 'local',
        queryText: null,
        createdAt: new Date().toISOString(),
      },
    ]);

    const res = await request(app)
      .get('/api/saved-scriptures')
      .set('x-device-id', 'device-12345678')
      .expect(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].reference).toBe('John 3:16');
  });

  it('returns saved rows for authenticated /api/saved-scriptures without x-device-id', async () => {
    readSavedScripturesMock.mockResolvedValue([
      {
        savedId: 11,
        deviceId: 'device-12345678',
        ownerUserId: 'user-test-1',
        label: null,
        translation: 'KJV',
        book: 'John',
        chapter: 3,
        verseStart: 16,
        verseEnd: 16,
        reference: 'John 3:16',
        sourceMode: 'local',
        queryText: null,
        createdAt: new Date().toISOString(),
      },
    ]);

    const res = await request(app)
      .get('/api/saved-scriptures')
      .set('cookie', sessionCookie)
      .expect(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].ownerUserId).toBe('user-test-1');
  });

  it('creates saved row for POST /api/saved-scriptures', async () => {
    createSavedScriptureMock.mockResolvedValue({
      savedId: 5,
      deviceId: 'device-12345678',
      label: null,
      translation: 'ASV',
      book: 'John',
      chapter: 3,
      verseStart: 16,
      verseEnd: 16,
      reference: 'John 3:16',
      sourceMode: 'local',
      queryText: null,
      createdAt: new Date().toISOString(),
    });

    const res = await request(app)
      .post('/api/saved-scriptures')
      .set('x-device-id', 'device-12345678')
      .send({
        translation: 'ASV',
        book: 'John',
        chapter: 3,
        verseStart: 16,
        verseEnd: 16,
        reference: 'John 3:16',
        sourceMode: 'local',
      })
      .expect(201);
    expect(res.body.data.savedId).toBe(5);
    expect(res.body.data.translation).toBe('ASV');
  });

  it('patches translation for PATCH /api/saved-scriptures/:savedId', async () => {
    updateSavedScriptureTranslationMock.mockResolvedValue({
      savedId: 5,
      deviceId: 'device-12345678',
      label: null,
      translation: 'WEB',
      book: 'John',
      chapter: 3,
      verseStart: 16,
      verseEnd: 16,
      reference: 'John 3:16',
      sourceMode: 'local',
      queryText: null,
      createdAt: new Date().toISOString(),
    });

    const res = await request(app)
      .patch('/api/saved-scriptures/5')
      .set('x-device-id', 'device-12345678')
      .send({ translation: 'WEB' })
      .expect(200);
    expect(res.body.data.translation).toBe('WEB');
  });

  it('returns 409 conflict when patch translation would duplicate entry', async () => {
    updateSavedScriptureTranslationMock.mockRejectedValue(
      new ClientError(
        409,
        'this verse range is already saved in the selected translation',
      ),
    );

    const res = await request(app)
      .patch('/api/saved-scriptures/5')
      .set('x-device-id', 'device-12345678')
      .send({ translation: 'WEB' })
      .expect(409);
    expect(res.body.error.message).toContain('already saved');
  });

  it('returns 204 for DELETE /api/saved-scriptures/:savedId', async () => {
    removeSavedScriptureMock.mockResolvedValue(undefined);
    await request(app)
      .delete('/api/saved-scriptures/5')
      .set('x-device-id', 'device-12345678')
      .expect(204);
  });

  it('returns diagnostics report for authorized admin request', async () => {
    readScriptureSourcesDiagnosticsMock.mockResolvedValue({
      checkedAt: new Date().toISOString(),
      database: { status: 'ok', translationCounts: [] },
      localFiles: { directory: 'server/data/bible', translations: [] },
      fallbackReadiness: 'ready',
    });

    const res = await request(app)
      .get('/api/admin/scripture-sources')
      .set(authHeader)
      .expect(200);
    expect(res.body.data).toEqual(
      expect.objectContaining({
        fallbackReadiness: 'ready',
      }),
    );
  });
});
