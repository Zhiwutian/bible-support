import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { SUPPORTED_SCRIPTURE_TRANSLATIONS } from '@shared/scripture-search-contracts.js';
import { sendSuccess } from '@server/lib/http-response.js';
import {
  readEmotionScripturesBySlug,
  readEmotions,
  readRandomEmotionScriptureBySlug,
} from '@server/services/emotion-service.js';

const emotionSlugParamsSchema = z.object({
  slug: z.string().trim().min(1),
});
const scriptureQuerySchema = z.object({
  translation: z.enum(SUPPORTED_SCRIPTURE_TRANSLATIONS).optional(),
});

/** Handle `GET /api/emotions`. */
export async function getEmotions(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const emotionRows = await readEmotions();
    sendSuccess(res, emotionRows);
  } catch (err) {
    next(err);
  }
}

/** Handle `GET /api/emotions/:slug/scriptures`. */
export async function getEmotionScriptures(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const params = emotionSlugParamsSchema.parse(req.params);
    const query = scriptureQuerySchema.parse(req.query);
    const payload = await readEmotionScripturesBySlug(
      params.slug,
      query.translation,
    );
    sendSuccess(res, payload);
  } catch (err) {
    next(err);
  }
}

/** Handle `GET /api/emotions/:slug/scriptures/random`. */
export async function getRandomEmotionScripture(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const params = emotionSlugParamsSchema.parse(req.params);
    const query = scriptureQuerySchema.parse(req.query);
    const payload = await readRandomEmotionScriptureBySlug(
      params.slug,
      query.translation,
    );
    sendSuccess(res, payload);
  } catch (err) {
    next(err);
  }
}
