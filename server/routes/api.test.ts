import request from 'supertest';
import { Express } from 'express';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { getDrizzleDb } from '@server/db/drizzle.js';

vi.mock('@server/db/drizzle.js', () => ({
  getDrizzleDb: vi.fn(),
}));

describe('api routes', () => {
  let app: Express;
  const getDrizzleDbMock = vi.mocked(getDrizzleDb);

  beforeAll(async () => {
    process.env.TOKEN_SECRET = process.env.TOKEN_SECRET ?? 'test-token-secret';
    process.env.SESSION_SECRET =
      process.env.SESSION_SECRET ?? 'test-session-secret';
    const { createApp } = await import('@server/app.js');
    app = createApp();
  });

  beforeEach(() => {
    getDrizzleDbMock.mockReset();
  });

  it('returns hello message from /api/hello', async () => {
    const res = await request(app).get('/api/hello').expect(200);
    expect(res.body.data).toEqual({ message: 'Hello, World!' });
    expect(res.body.meta).toEqual(
      expect.objectContaining({ requestId: expect.any(String) }),
    );
  });

  it('returns not_configured from /api/health when database is unavailable', async () => {
    getDrizzleDbMock.mockReturnValue(null);

    const res = await request(app).get('/api/health').expect(200);
    expect(res.body.data.api).toBe('ok');
    expect(res.body.data.database).toBe('not_configured');
    expect(typeof res.body.data.checkedAt).toBe('string');
  });

  it('returns 503 from /api/ready when database is unavailable', async () => {
    getDrizzleDbMock.mockReturnValue(null);

    const res = await request(app).get('/api/ready').expect(503);
    expect(res.body.data.database).toBe('not_configured');
  });

  it('returns 503 from /api/todos when database is unavailable', async () => {
    getDrizzleDbMock.mockReturnValue(null);

    const res = await request(app).get('/api/todos').expect(503);
    expect(res.body.error).toEqual(
      expect.objectContaining({
        code: 'client_error',
        message: expect.stringContaining('database is not configured'),
      }),
    );
  });

  it('returns 503 from /api/emotions when database is unavailable', async () => {
    getDrizzleDbMock.mockReturnValue(null);

    const res = await request(app).get('/api/emotions').expect(503);
    expect(res.body.error).toEqual(
      expect.objectContaining({
        code: 'client_error',
        message: expect.stringContaining('database is not configured'),
      }),
    );
  });

  it('returns 401 from /api/admin/scripture-sources without auth token', async () => {
    const res = await request(app)
      .get('/api/admin/scripture-sources')
      .expect(401);
    expect(res.body.error).toEqual(
      expect.objectContaining({
        code: 'client_error',
        message: expect.stringContaining('authentication required'),
      }),
    );
  });

  it('returns unauthenticated payload from /api/auth/me without session', async () => {
    const res = await request(app).get('/api/auth/me').expect(200);
    expect(res.body.data).toEqual({
      isAuthenticated: false,
      userId: null,
      role: null,
      displayName: null,
      avatarUrl: null,
      enabledSocialProviders: ['google'],
    });
  });

  it('returns 503 from /api/auth/login when auth is disabled', async () => {
    const res = await request(app).get('/api/auth/login').expect(503);
    expect(res.body.error).toEqual(
      expect.objectContaining({
        code: 'client_error',
        message: expect.stringContaining('not enabled'),
      }),
    );
  });

  it('returns 204 from /api/auth/logout', async () => {
    await request(app).post('/api/auth/logout').expect(204);
  });

  it('returns endpoint error from /api/auth/callback when auth is disabled', async () => {
    const res = await request(app).get('/api/auth/callback').expect(503);
    expect(res.body.error).toEqual(
      expect.objectContaining({
        code: 'client_error',
        message: expect.stringContaining('not enabled'),
        details: expect.objectContaining({
          reason: 'auth_not_enabled',
        }),
      }),
    );
  });

  it('redirects callback failures for browser-style accept header', async () => {
    const res = await request(app)
      .get('/api/auth/callback')
      .set('accept', 'text/html')
      .expect(302);
    expect(res.headers.location).toContain('auth=error');
    expect(res.headers.location).toContain('reason=auth_not_enabled');
  });

  it('returns JSON payload from /api/auth/logout for API clients', async () => {
    const res = await request(app)
      .get('/api/auth/logout')
      .set('accept', 'application/json')
      .expect(200);
    expect(res.body.data).toEqual({ loggedOut: true });
  });
});
