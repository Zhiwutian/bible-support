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

type SavedScriptureItem = {
  savedId: number;
  deviceId: string | null;
  ownerUserId?: string | null;
  label: string | null;
  saveGroupId?: string | null;
  note?: string | null;
  translation: string;
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  reference: string;
  sourceMode: string;
  queryText: string | null;
  createdAt: string;
};

const emotions: Emotion[] = [
  { emotionId: 1, slug: 'fear', name: 'Fear', description: null },
  { emotionId: 2, slug: 'anger', name: 'Anger', description: null },
  { emotionId: 3, slug: 'sadness', name: 'Sadness', description: null },
  { emotionId: 4, slug: 'anxiety', name: 'Anxiety', description: null },
  { emotionId: 5, slug: 'loneliness', name: 'Loneliness', description: null },
  { emotionId: 6, slug: 'stress', name: 'Stress', description: null },
  { emotionId: 7, slug: 'guilt', name: 'Guilt', description: null },
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
const savedItems: SavedScriptureItem[] = [
  {
    savedId: 101,
    deviceId: 'device-12345678',
    label: null,
    saveGroupId: null,
    note: null,
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
];

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
        enabledSocialProviders: ['google'],
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
  http.get('/api/scriptures/search', ({ request }) => {
    const url = new URL(request.url);
    const translation = (
      url.searchParams.get('translation') || 'KJV'
    ).toUpperCase();
    const query = (url.searchParams.get('q') || '').trim();
    const verses = [
      {
        translation,
        book: 'John',
        chapter: 3,
        verse: 16,
        reference: 'John 3:16',
        verseText: 'For God so loved the world...',
      },
      {
        translation,
        book: 'John',
        chapter: 3,
        verse: 17,
        reference: 'John 3:17',
        verseText:
          'For God sent not his Son into the world to condemn the world...',
      },
    ].filter(
      (verse) =>
        !query || verse.reference.toLowerCase().includes(query.toLowerCase()),
    );
    return HttpResponse.json({
      data: {
        mode: url.searchParams.get('mode') || 'reference',
        source: 'local',
        queryText: query,
        total: verses.length,
        verses,
      },
    });
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
  http.get('/api/reader/chapter', ({ request }) => {
    const url = new URL(request.url);
    const book = url.searchParams.get('book') || 'John';
    const chapter = Number(url.searchParams.get('chapter') || '3');
    const translation = url.searchParams.get('translation') || 'KJV';
    return HttpResponse.json({
      data: {
        translation,
        book,
        chapter,
        verses: [
          {
            translation,
            book,
            chapter,
            verse: 16,
            reference: `${book} ${chapter}:16`,
            verseText: 'For God so loved the world...',
          },
        ],
        displayText: `${book} ${chapter}:16 For God so loved the world...`,
        hasPrevious: chapter > 1,
        hasNext: true,
        previousChapter: chapter > 1 ? { book, chapter: chapter - 1 } : null,
        nextChapter: { book, chapter: chapter + 1 },
      },
    });
  }),
  http.get('/api/saved-scriptures', () => {
    return HttpResponse.json({ data: savedItems });
  }),
  http.get('/api/saved-scriptures/grouped', () => {
    return HttpResponse.json({
      data: {
        groups: [
          {
            groupId: 'legacy:101',
            saveGroupId: null,
            createdAt: savedItems[0].createdAt,
            displayText: 'John 3:16 (KJV)\nFor God so loved the world...',
            isLegacyUngrouped: true,
            items: [
              {
                ...savedItems[0],
                displayText: 'John 3:16 (KJV)\nFor God so loved the world...',
              },
            ],
          },
        ],
      },
    });
  }),
  http.patch(
    '/api/saved-scriptures/:savedId/note',
    async ({ params, request }) => {
      const savedId = Number(params.savedId);
      const body = (await request.json().catch(() => ({}))) as {
        note?: string | null;
      };
      const row = savedItems.find((item) => item.savedId === savedId);
      if (!row) {
        return HttpResponse.json(
          {
            error: {
              code: 'client_error',
              message: 'saved scripture not found',
            },
          },
          { status: 404 },
        );
      }
      row.note = body.note ?? null;
      return HttpResponse.json({ data: row });
    },
  ),
  http.post('/api/saved-scriptures/batch', async ({ request }) => {
    const body = (await request.json()) as {
      items?: Array<{
        reference: string;
        translation: string;
        book: string;
        chapter: number;
        verseStart: number;
        verseEnd: number;
        sourceMode: string;
        queryText?: string;
      }>;
    };
    const now = new Date().toISOString();
    const saveGroupId = 'batch-group-1';
    const rows = (body.items ?? []).map((item, index) => ({
      savedId: 1000 + index,
      deviceId: 'device-12345678',
      label: null,
      saveGroupId,
      note: null,
      translation: item.translation,
      book: item.book,
      chapter: item.chapter,
      verseStart: item.verseStart,
      verseEnd: item.verseEnd,
      reference: item.reference,
      sourceMode: item.sourceMode,
      queryText: item.queryText ?? null,
      createdAt: now,
    }));
    savedItems.unshift(...rows);
    return HttpResponse.json(
      {
        data: {
          saveGroupId,
          items: rows,
          displayText: rows
            .map((row) => `${row.reference} (${row.translation})`)
            .join('\n'),
        },
      },
      { status: 201 },
    );
  }),
];
