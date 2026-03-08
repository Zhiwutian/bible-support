import request from 'supertest';
import { Express } from 'express';
import { beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('@server/services/scripture-context-service.js', () => ({
  readScriptureContextFromScriptureId: vi.fn(async (scriptureId: number) => ({
    reference: scriptureId === 2 ? 'Isaiah 41:10' : 'Psalm 37:8',
    chapterReference: 'Psalm 37',
    summary: 'A short contextual summary for the chapter.',
    sourceName: 'Seeded Study Context',
    sourceUrl: '',
    isFallback: false,
  })),
  readScriptureContextFromReference: vi.fn(async (reference: string) => ({
    reference,
    chapterReference: 'Psalm 37',
    summary: 'A short contextual summary for the chapter.',
    sourceName: 'Seeded Study Context',
    sourceUrl: '',
    isFallback: false,
  })),
}));

describe('scripture context api routes', () => {
  let app: Express;

  beforeAll(async () => {
    process.env.TOKEN_SECRET = process.env.TOKEN_SECRET ?? 'test-token-secret';
    const { createApp } = await import('@server/app.js');
    app = createApp();
  });

  it('returns scripture context for a valid scriptureId', async () => {
    const res = await request(app)
      .get('/api/scripture-context')
      .query({ scriptureId: 2 })
      .expect(200);

    expect(res.body.data).toEqual(
      expect.objectContaining({
        reference: 'Isaiah 41:10',
        chapterReference: 'Psalm 37',
        summary: expect.any(String),
      }),
    );
  });

  it('supports legacy reference query for backward compatibility', async () => {
    const res = await request(app)
      .get('/api/scripture-context')
      .query({ reference: 'Psalm 37:8' })
      .expect(200);
    expect(res.body.data.reference).toBe('Psalm 37:8');
  });

  it('returns validation error when both scriptureId and reference are missing', async () => {
    const res = await request(app).get('/api/scripture-context').expect(400);
    expect(res.body.error).toEqual(
      expect.objectContaining({
        code: 'validation_error',
      }),
    );
  });
});
