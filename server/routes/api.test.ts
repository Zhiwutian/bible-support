import request from 'supertest';
import { Express } from 'express';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

describe('api routes', () => {
  let app: Express;
  const originalDatabaseUrl = process.env.DATABASE_URL;
  const originalTokenSecret = process.env.TOKEN_SECRET;

  beforeAll(async () => {
    process.env.TOKEN_SECRET = process.env.TOKEN_SECRET ?? 'test-token-secret';
    const { createApp } = await import('@server/app.js');
    app = createApp();
  });

  afterEach(() => {
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  afterAll(() => {
    process.env.TOKEN_SECRET = originalTokenSecret;
  });

  it('returns hello message from /api/hello', async () => {
    const res = await request(app).get('/api/hello').expect(200);
    expect(res.body.data).toEqual({ message: 'Hello, World!' });
    expect(res.body.meta).toEqual(
      expect.objectContaining({ requestId: expect.any(String) }),
    );
  });

  it('returns not_configured from /api/health when DATABASE_URL is missing', async () => {
    delete process.env.DATABASE_URL;

    const res = await request(app).get('/api/health').expect(200);
    expect(res.body.data.api).toBe('ok');
    expect(res.body.data.database).toBe('not_configured');
    expect(typeof res.body.data.checkedAt).toBe('string');
  });

  it('returns 503 from /api/ready when DATABASE_URL is missing', async () => {
    delete process.env.DATABASE_URL;

    const res = await request(app).get('/api/ready').expect(503);
    expect(res.body.data.database).toBe('not_configured');
  });

  it('returns 503 from /api/todos when DATABASE_URL is missing', async () => {
    delete process.env.DATABASE_URL;

    const res = await request(app).get('/api/todos').expect(503);
    expect(res.body.error).toEqual(
      expect.objectContaining({
        code: 'client_error',
        message: expect.stringContaining('database is not configured'),
      }),
    );
  });
});
