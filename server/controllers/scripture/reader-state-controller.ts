import type { Request, Response } from 'express';
import { z } from 'zod';
import {
  SUPPORTED_SCRIPTURE_TRANSLATIONS,
  type UpdateReaderStateRequest,
} from '@shared/scripture-search-contracts.js';
import { readerPreferencesSchema } from '@server/lib/reader-state-preferences.js';
import {
  clearReaderStateByUserId,
  patchReaderStateByUserId,
  readReaderStateByUserId,
} from '@server/services/reader-state-service.js';
import {
  requireSessionUserId,
  sendError,
  sendSuccess,
} from '@server/lib/index.js';

const readerBookmarkSchema = z.object({
  book: z.string().trim().min(1).max(120),
  chapter: z.number().int().positive(),
  verse: z.number().int().positive(),
  translation: z.enum(SUPPORTED_SCRIPTURE_TRANSLATIONS),
  scrollOffset: z.number().int().nonnegative(),
});

const patchReaderStateSchema = z
  .object({
    preferences: readerPreferencesSchema.optional(),
    bookmark: readerBookmarkSchema.nullable().optional(),
  })
  .refine(
    (value) => value.preferences !== undefined || value.bookmark !== undefined,
    'at least one of preferences or bookmark is required',
  );

/** Handle `GET /api/reader/state` for authenticated users. */
export async function getReaderState(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = requireSessionUserId(req);
  const payload = await readReaderStateByUserId(userId);
  sendSuccess(res, payload);
}

/** Handle `PATCH /api/reader/state` for authenticated users. */
export async function patchReaderState(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = requireSessionUserId(req);
  const parsed = patchReaderStateSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 400, {
      code: 'validation_error',
      message: 'invalid reader state payload',
      details: parsed.error.flatten(),
    });
    return;
  }
  const input = parsed.data as UpdateReaderStateRequest;
  const payload = await patchReaderStateByUserId(userId, input);
  sendSuccess(res, payload);
}

/** Handle `DELETE /api/reader/state` for authenticated users. */
export async function deleteReaderState(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = requireSessionUserId(req);
  await clearReaderStateByUserId(userId);
  res.sendStatus(204);
}
