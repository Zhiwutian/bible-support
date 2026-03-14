import { and, asc, eq, gte, lte, sql } from 'drizzle-orm';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { emotions, scriptures, scriptureVerses } from '@server/db/schema.js';
import { SUPPORTED_SCRIPTURE_TRANSLATIONS } from '@shared/scripture-search-contracts.js';
import { BIBLE_BOOKS } from '@shared/bible-books.js';
import { ClientError } from '@server/lib/client-error.js';
import { logger } from '@server/lib/logger.js';
import { requireDb } from './require-db.js';

export type EmotionRecord = typeof emotions.$inferSelect;

export type ScriptureRecord = typeof scriptures.$inferSelect;
type SupportedTranslation = (typeof SUPPORTED_SCRIPTURE_TRANSLATIONS)[number];
type ResolvedScriptureRecord = ScriptureRecord & {
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  isTranslationFallback: boolean;
};

const translationFallbackOrder: SupportedTranslation[] = ['KJV', 'ASV', 'WEB'];
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const canonicalBookMap = new Map(
  BIBLE_BOOKS.map((book) => [book.toLowerCase(), book]),
);
canonicalBookMap.set('psalm', 'Psalms');
canonicalBookMap.set('song of songs', 'Song of Solomon');
const localVerseMapCache = new Map<string, Record<string, string>>();

type ParsedScriptureReference = {
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
};

/** Parse references like "John 3:16" or "John 3:16-18". */
function parseScriptureReference(
  reference: string,
): ParsedScriptureReference | null {
  const normalized = reference.trim().replace(/\s+/g, ' ');
  const match = normalized.match(/^(.+?)\s+(\d+):(\d+)(?:\s*-\s*(\d+))?$/);
  if (!match) return null;
  const [, book, chapterPart, startPart, endPart] = match;
  const chapter = Number(chapterPart);
  const verseStart = Number(startPart);
  const verseEnd = endPart ? Number(endPart) : verseStart;
  if (
    !Number.isInteger(chapter) ||
    !Number.isInteger(verseStart) ||
    !Number.isInteger(verseEnd) ||
    chapter <= 0 ||
    verseStart <= 0 ||
    verseEnd <= 0 ||
    verseStart > verseEnd
  ) {
    return null;
  }
  return {
    book: canonicalBookMap.get(book.trim().toLowerCase()) ?? book.trim(),
    chapter,
    verseStart,
    verseEnd,
  };
}

/** Normalize request translation to supported canonical code. */
function normalizeTranslation(
  translation: string | undefined,
): SupportedTranslation {
  const normalized = translation?.trim().toUpperCase();
  if (
    normalized &&
    SUPPORTED_SCRIPTURE_TRANSLATIONS.includes(
      normalized as SupportedTranslation,
    )
  ) {
    return normalized as SupportedTranslation;
  }
  return 'KJV';
}

/** Load normalized local verse map from bundled translation JSON. */
async function readLocalVerseMap(
  translation: SupportedTranslation,
): Promise<Record<string, string>> {
  const key = translation.toLowerCase();
  const cached = localVerseMapCache.get(key);
  if (cached) return cached;
  const localPath = path.resolve(__dirname, `../data/bible/${key}.json`);
  const content = await readFile(localPath, 'utf8');
  const parsed = JSON.parse(content) as Record<string, string>;
  localVerseMapCache.set(key, parsed);
  return parsed;
}

/** Resolve an exact verse range from local translation JSON. */
async function resolveVerseRangeFromLocalJson(input: {
  translation: SupportedTranslation;
  parsed: ParsedScriptureReference;
}): Promise<string | null> {
  const verseMap = await readLocalVerseMap(input.translation);
  const verses: string[] = [];
  for (
    let verse = input.parsed.verseStart;
    verse <= input.parsed.verseEnd;
    verse += 1
  ) {
    const key = `${input.parsed.book} ${input.parsed.chapter}:${verse}`;
    const text = verseMap[key]?.trim();
    if (!text) {
      return null;
    }
    verses.push(text);
  }
  return verses.join(' ').trim() || null;
}

/** Resolve verse text from local corpus with translation fallback. */
async function resolveScriptureVerseText(input: {
  translation: SupportedTranslation;
  reference: string;
  fallbackVerseText: string;
}): Promise<{
  translation: SupportedTranslation;
  verseText: string;
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  isTranslationFallback: boolean;
}> {
  const parsed = parseScriptureReference(input.reference);
  if (!parsed) {
    return {
      translation: input.translation,
      verseText: input.fallbackVerseText,
      book: '',
      chapter: 0,
      verseStart: 0,
      verseEnd: 0,
      isTranslationFallback: false,
    };
  }
  let db: ReturnType<typeof requireDb> | null = null;
  try {
    db = requireDb();
  } catch (err) {
    logger.warn(
      { err },
      'Emotion scripture DB unavailable; using local JSON fallback',
    );
  }
  const orderedTranslations: SupportedTranslation[] = [
    input.translation,
    ...translationFallbackOrder.filter((code) => code !== input.translation),
  ];
  for (const translation of orderedTranslations) {
    let verseText = '';
    if (db) {
      try {
        const rows = await db
          .select({
            verse: scriptureVerses.verse,
            verseText: scriptureVerses.verseText,
          })
          .from(scriptureVerses)
          .where(
            and(
              eq(scriptureVerses.translation, translation),
              eq(scriptureVerses.book, parsed.book),
              eq(scriptureVerses.chapter, parsed.chapter),
              gte(scriptureVerses.verse, parsed.verseStart),
              lte(scriptureVerses.verse, parsed.verseEnd),
            ),
          )
          .orderBy(asc(scriptureVerses.verse));
        const expectedVerseCount = parsed.verseEnd - parsed.verseStart + 1;
        if (rows.length === expectedVerseCount) {
          verseText = rows.map((row) => row.verseText.trim()).join(' ');
        }
      } catch (err) {
        logger.warn(
          { err, translation, reference: input.reference },
          'Emotion scripture DB query failed; trying local JSON fallback',
        );
      }
    }
    if (!verseText) {
      verseText =
        (await resolveVerseRangeFromLocalJson({ translation, parsed }).catch(
          () => null,
        )) ?? '';
    }
    if (!verseText) continue;
    return {
      translation,
      verseText: verseText || input.fallbackVerseText,
      book: parsed.book,
      chapter: parsed.chapter,
      verseStart: parsed.verseStart,
      verseEnd: parsed.verseEnd,
      isTranslationFallback: translation !== input.translation,
    };
  }
  return {
    translation: input.translation,
    verseText: input.fallbackVerseText,
    book: parsed.book,
    chapter: parsed.chapter,
    verseStart: parsed.verseStart,
    verseEnd: parsed.verseEnd,
    isTranslationFallback: false,
  };
}

/** Return all emotion tiles ordered alphabetically by name. */
export async function readEmotions(): Promise<EmotionRecord[]> {
  const db = requireDb();
  return db.select().from(emotions).orderBy(asc(emotions.name));
}

/** Return all scriptures for an emotion slug in fixed display order. */
export async function readEmotionScripturesBySlug(
  slug: string,
  translation?: string,
): Promise<{ emotion: EmotionRecord; scriptures: ResolvedScriptureRecord[] }> {
  const db = requireDb();
  const selectedTranslation = normalizeTranslation(translation);
  const [emotion] = await db
    .select()
    .from(emotions)
    .where(eq(emotions.slug, slug))
    .limit(1);
  if (!emotion) {
    throw new ClientError(404, 'emotion not found');
  }

  const scriptureRows = await db
    .select()
    .from(scriptures)
    .where(eq(scriptures.emotionId, emotion.emotionId))
    .orderBy(asc(scriptures.displayOrder));

  const resolvedScriptures = await Promise.all(
    scriptureRows.map(async (row) => {
      const resolved = await resolveScriptureVerseText({
        translation: selectedTranslation,
        reference: row.reference,
        fallbackVerseText: row.verseText,
      });
      return {
        ...row,
        translation: resolved.translation,
        verseText: resolved.verseText,
        book: resolved.book,
        chapter: resolved.chapter,
        verseStart: resolved.verseStart,
        verseEnd: resolved.verseEnd,
        isTranslationFallback: resolved.isTranslationFallback,
      };
    }),
  );

  return { emotion, scriptures: resolvedScriptures };
}

/** Return a random scripture for an emotion slug. */
export async function readRandomEmotionScriptureBySlug(
  slug: string,
  translation?: string,
): Promise<{
  emotion: EmotionRecord;
  scripture: ResolvedScriptureRecord;
}> {
  const db = requireDb();
  const [emotion] = await db
    .select()
    .from(emotions)
    .where(eq(emotions.slug, slug))
    .limit(1);
  if (!emotion) {
    throw new ClientError(404, 'emotion not found');
  }

  const [scripture] = await db
    .select()
    .from(scriptures)
    .where(and(eq(scriptures.emotionId, emotion.emotionId)))
    .orderBy(sql`RANDOM()`)
    .limit(1);

  if (!scripture) {
    throw new ClientError(404, 'no scriptures found for emotion');
  }

  const selectedTranslation = normalizeTranslation(translation);
  const resolved = await resolveScriptureVerseText({
    translation: selectedTranslation,
    reference: scripture.reference,
    fallbackVerseText: scripture.verseText,
  });

  return {
    emotion,
    scripture: {
      ...scripture,
      translation: resolved.translation,
      verseText: resolved.verseText,
      book: resolved.book,
      chapter: resolved.chapter,
      verseStart: resolved.verseStart,
      verseEnd: resolved.verseEnd,
      isTranslationFallback: resolved.isTranslationFallback,
    },
  };
}
