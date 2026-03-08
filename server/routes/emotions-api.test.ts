import request from 'supertest';
import { Express } from 'express';
import { beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('@server/services/emotion-service.js', () => ({
  readEmotions: vi.fn(async () => [
    { emotionId: 1, slug: 'fear', name: 'Fear', description: null },
    { emotionId: 2, slug: 'anger', name: 'Anger', description: null },
  ]),
  readEmotionScripturesBySlug: vi.fn(async () => ({
    emotion: { emotionId: 1, slug: 'fear', name: 'Fear', description: null },
    scriptures: [
      {
        scriptureId: 1,
        emotionId: 1,
        reference: 'Psalm 23:4',
        verseText: 'Even though I walk through the darkest valley...',
        translation: 'NIV',
        displayOrder: 1,
      },
      {
        scriptureId: 2,
        emotionId: 1,
        reference: 'Isaiah 41:10',
        verseText: 'So do not fear, for I am with you...',
        translation: 'NIV',
        displayOrder: 2,
      },
    ],
  })),
  readRandomEmotionScriptureBySlug: vi.fn(async () => ({
    emotion: { emotionId: 1, slug: 'fear', name: 'Fear', description: null },
    scripture: {
      scriptureId: 2,
      emotionId: 1,
      reference: 'Isaiah 41:10',
      verseText: 'So do not fear, for I am with you...',
      translation: 'NIV',
      displayOrder: 2,
    },
  })),
}));

describe('emotions api routes', () => {
  let app: Express;

  beforeAll(async () => {
    process.env.TOKEN_SECRET = process.env.TOKEN_SECRET ?? 'test-token-secret';
    const { createApp } = await import('@server/app.js');
    app = createApp();
  });

  it('returns emotion tiles from /api/emotions', async () => {
    const res = await request(app).get('/api/emotions').expect(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].slug).toBe('fear');
  });

  it('returns ordered scriptures from /api/emotions/:slug/scriptures', async () => {
    const res = await request(app)
      .get('/api/emotions/fear/scriptures')
      .expect(200);
    expect(res.body.data.emotion.slug).toBe('fear');
    expect(res.body.data.scriptures[0].reference).toBe('Psalm 23:4');
    expect(res.body.data.scriptures[1].reference).toBe('Isaiah 41:10');
  });

  it('returns random scripture from /api/emotions/:slug/scriptures/random', async () => {
    const res = await request(app)
      .get('/api/emotions/fear/scriptures/random')
      .expect(200);
    expect(res.body.data.emotion.slug).toBe('fear');
    expect(res.body.data.scripture.reference).toBe('Isaiah 41:10');
  });
});
