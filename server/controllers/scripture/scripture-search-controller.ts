import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { BIBLE_BOOKS } from '@shared/bible-books.js';
import { SUPPORTED_SCRIPTURE_TRANSLATIONS } from '@shared/scripture-search-contracts.js';
import { sendSuccess } from '@server/lib/http-response.js';
import { searchScriptureVerses } from '@server/services/scripture-search-service.js';

const searchQuerySchema = z
  .object({
    mode: z.enum(['guided', 'reference', 'keyword']).default('reference'),
    q: z.string().trim().default(''),
    translation: z.enum(SUPPORTED_SCRIPTURE_TRANSLATIONS).default('KJV'),
    book: z
      .string()
      .trim()
      .optional()
      .refine((value) => !value || BIBLE_BOOKS.includes(value as never), {
        message: 'book must be a valid Bible book',
      }),
    chapter: z.coerce.number().int().positive().optional(),
    verseStart: z.coerce.number().int().positive().optional(),
    verseEnd: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).default(40),
  })
  .superRefine((value, ctx) => {
    if (value.mode === 'guided' && (!value.book || !value.chapter)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['book'],
        message: 'guided mode requires book and chapter',
      });
    }
    if (
      value.verseStart &&
      value.verseEnd &&
      value.verseStart > value.verseEnd
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['verseEnd'],
        message: 'verseEnd must be greater than or equal to verseStart',
      });
    }
    if (value.mode !== 'guided' && !value.q) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['q'],
        message: 'query is required for reference and keyword modes',
      });
    }
  });

/** Handle `GET /api/scriptures/search`. */
export async function getScriptureSearch(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = searchQuerySchema.parse(req.query);
    const payload = await searchScriptureVerses({
      mode: query.mode,
      queryText: query.q,
      translation: query.translation,
      book: query.book,
      chapter: query.chapter,
      verseStart: query.verseStart,
      verseEnd: query.verseEnd,
      limit: query.limit,
    });
    sendSuccess(res, payload);
  } catch (err) {
    next(err);
  }
}
