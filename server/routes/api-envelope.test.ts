import request from 'supertest';
import { Express } from 'express';
import { beforeAll, describe, expect, it } from 'vitest';

describe('api envelope', () => {
  let app: Express;

  beforeAll(async () => {
    process.env.TOKEN_SECRET = process.env.TOKEN_SECRET ?? 'test-token-secret';
    const { createApp } = await import('@server/app.js');
    app = createApp();
  });

  it('returns success envelope for GET /api/hello', async () => {
    const res = await request(app).get('/api/hello').expect(200);

    expect(res.body.data).toEqual({ message: 'Hello, World!' });
    expect(res.body.meta).toEqual(
      expect.objectContaining({ requestId: expect.any(String) }),
    );
  });

  it('returns validation error envelope for bad /api/scripture-context query', async () => {
    const res = await request(app).get('/api/scripture-context').expect(400);

    expect(res.body.error).toEqual(
      expect.objectContaining({
        code: 'validation_error',
        message: 'request validation failed',
      }),
    );
    expect(res.body.meta).toEqual(
      expect.objectContaining({ requestId: expect.any(String) }),
    );
  });
});
