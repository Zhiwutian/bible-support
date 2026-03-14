import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { SUPPORTED_SCRIPTURE_TRANSLATIONS } from '@shared/scripture-search-contracts.js';
import { sendSuccess } from '@server/lib/http-response.js';
import { logger } from '@server/lib/logger.js';
import { readReaderChapter } from '@server/services/reader-service.js';

const readerChapterQuerySchema = z.object({
  book: z.string().trim().min(1),
  chapter: z.coerce.number().int().positive(),
  translation: z.enum(SUPPORTED_SCRIPTURE_TRANSLATIONS).default('KJV'),
});

/** Handle `GET /api/reader/chapter`. */
export async function getReaderChapter(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const startedAt = Date.now();
  try {
    const query = readerChapterQuerySchema.parse(req.query);
    const payload = await readReaderChapter({
      book: query.book,
      chapter: query.chapter,
      translation: query.translation,
    });
    logger.info(
      {
        book: payload.book,
        chapter: payload.chapter,
        translation: payload.translation,
        verseCount: payload.verses.length,
        durationMs: Date.now() - startedAt,
      },
      'reader chapter fetched',
    );
    sendSuccess(res, payload);
  } catch (err) {
    logger.warn(
      {
        err,
        durationMs: Date.now() - startedAt,
      },
      'reader chapter fetch failed',
    );
    next(err);
  }
}
