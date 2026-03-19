import type { Request, Response } from 'express';
import { z } from 'zod';
import { SUPPORTED_SCRIPTURE_TRANSLATIONS } from '@shared/scripture-search-contracts.js';
import { asyncHandler, sendSuccess } from '@server/lib/index.js';
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
export const getEmotions = asyncHandler(
  async (_req: Request, res: Response) => {
    const emotionRows = await readEmotions();
    sendSuccess(res, emotionRows);
  },
);

/** Handle `GET /api/emotions/:slug/scriptures`. */
export const getEmotionScriptures = asyncHandler(
  async (req: Request, res: Response) => {
    const params = emotionSlugParamsSchema.parse(req.params);
    const query = scriptureQuerySchema.parse(req.query);
    const payload = await readEmotionScripturesBySlug(
      params.slug,
      query.translation,
    );
    sendSuccess(res, payload);
  },
);

/** Handle `GET /api/emotions/:slug/scriptures/random`. */
export const getRandomEmotionScripture = asyncHandler(
  async (req: Request, res: Response) => {
    const params = emotionSlugParamsSchema.parse(req.params);
    const query = scriptureQuerySchema.parse(req.query);
    const payload = await readRandomEmotionScriptureBySlug(
      params.slug,
      query.translation,
    );
    sendSuccess(res, payload);
  },
);
