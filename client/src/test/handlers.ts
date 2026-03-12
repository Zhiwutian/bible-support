import { http, HttpResponse } from 'msw';

type Emotion = {
  emotionId: number;
  slug: string;
  name: string;
  description: string | null;
};

type Scripture = {
  scriptureId: number;
  emotionId: number;
  reference: string;
  verseText: string;
  translation: string;
  displayOrder: number;
};

const emotions: Emotion[] = [
  { emotionId: 1, slug: 'fear', name: 'Fear', description: null },
  { emotionId: 2, slug: 'anger', name: 'Anger', description: null },
  { emotionId: 3, slug: 'sadness', name: 'Sadness', description: null },
  { emotionId: 4, slug: 'anxiety', name: 'Anxiety', description: null },
  { emotionId: 5, slug: 'loneliness', name: 'Loneliness', description: null },
  { emotionId: 6, slug: 'joy', name: 'Joy', description: null },
  { emotionId: 7, slug: 'peace', name: 'Peace', description: null },
  { emotionId: 8, slug: 'grief', name: 'Grief', description: null },
];

const scripturesByEmotionSlug: Record<string, Scripture[]> = {
  fear: [
    {
      scriptureId: 1,
      emotionId: 1,
      reference: 'Psalm 23:4',
      verseText:
        'Even though I walk through the darkest valley, I will fear no evil.',
      translation: 'NIV',
      displayOrder: 1,
    },
    {
      scriptureId: 2,
      emotionId: 1,
      reference: 'Isaiah 41:10',
      verseText: 'So do not fear, for I am with you.',
      translation: 'NIV',
      displayOrder: 2,
    },
  ],
  anger: [
    {
      scriptureId: 3,
      emotionId: 2,
      reference: 'James 1:19-20',
      verseText: 'Everyone should be quick to listen, slow to speak.',
      translation: 'NIV',
      displayOrder: 1,
    },
  ],
};

const scripturesById = Object.values(scripturesByEmotionSlug)
  .flat()
  .reduce<Record<number, Scripture>>((acc, scripture) => {
    acc[scripture.scriptureId] = scripture;
    return acc;
  }, {});

/** Reset in-memory API state between tests to avoid cross-test coupling. */
export function resetApiMockState() {
  // No-op for now: handlers return deterministic seeded payloads.
}

export const handlers = [
  http.get('/api/auth/me', () => {
    return HttpResponse.json({
      data: {
        isAuthenticated: false,
        userId: null,
        role: null,
        displayName: null,
        avatarUrl: null,
      },
    });
  }),
  http.get('/api/emotions', () => {
    return HttpResponse.json({ data: emotions });
  }),
  http.get('/api/emotions/:slug/scriptures', ({ params }) => {
    const slug = String(params.slug);
    const emotion = emotions.find((item) => item.slug === slug);
    if (!emotion) {
      return HttpResponse.json(
        {
          error: {
            code: 'client_error',
            message: 'emotion not found',
          },
        },
        { status: 404 },
      );
    }
    const scriptures = scripturesByEmotionSlug[slug] ?? [];
    return HttpResponse.json({ data: { emotion, scriptures } });
  }),
  http.get('/api/emotions/:slug/scriptures/random', ({ params }) => {
    const slug = String(params.slug);
    const emotion = emotions.find((item) => item.slug === slug);
    if (!emotion) {
      return HttpResponse.json(
        {
          error: {
            code: 'client_error',
            message: 'emotion not found',
          },
        },
        { status: 404 },
      );
    }
    const scriptures = scripturesByEmotionSlug[slug] ?? [];
    const randomScripture = scriptures[scriptures.length - 1];
    if (!randomScripture) {
      return HttpResponse.json(
        {
          error: {
            code: 'client_error',
            message: 'no scriptures found for emotion',
          },
        },
        { status: 404 },
      );
    }
    return HttpResponse.json({ data: { emotion, scripture: randomScripture } });
  }),
  http.get('/api/scripture-context', ({ request }) => {
    const url = new URL(request.url);
    const scriptureId = Number(url.searchParams.get('scriptureId') ?? '');
    const scriptureFromId =
      Number.isInteger(scriptureId) && scriptureId > 0
        ? scripturesById[scriptureId]
        : undefined;
    const reference =
      scriptureFromId?.reference || url.searchParams.get('reference') || '';
    return HttpResponse.json({
      data: {
        reference,
        chapterReference: reference.split(':')[0] ?? reference,
        summary:
          'This chapter expands the message around the selected verse and provides broader context for interpretation.',
        fullContext:
          'This chapter expands the message around the selected verse and provides broader context for interpretation.\n\nThis is a longer paragraph-style context block that can be expanded in the UI.',
        sourceName: 'Seeded Study Context',
        sourceUrl: '',
        isFallback: false,
      },
    });
  }),
];
