import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { SUPPORTED_SCRIPTURE_TRANSLATIONS } from '@shared/scripture-search-contracts.js';
import { sendSuccess } from '@server/lib/http-response.js';
import { ClientError } from '@server/lib/client-error.js';
import {
  createSavedScripture,
  readSavedScriptures,
  removeSavedScripture,
  updateSavedScriptureTranslation,
} from '@server/services/saved-scripture-service.js';

const deviceHeaderSchema = z.object({
  'x-device-id': z.string().trim().min(8).max(128),
});

const savedScriptureBodySchema = z
  .object({
    label: z.string().trim().max(120).optional(),
    translation: z.enum(SUPPORTED_SCRIPTURE_TRANSLATIONS),
    book: z.string().trim().min(1).max(64),
    chapter: z.number().int().positive(),
    verseStart: z.number().int().positive(),
    verseEnd: z.number().int().positive(),
    reference: z.string().trim().min(1).max(120),
    sourceMode: z.string().trim().min(1).max(16).default('local'),
    queryText: z.string().trim().max(160).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.verseStart > value.verseEnd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['verseEnd'],
        message: 'verseEnd must be greater than or equal to verseStart',
      });
    }
  });

const savedIdParamsSchema = z.object({
  savedId: z.coerce.number().int().positive(),
});
const updateSavedScriptureBodySchema = z.object({
  translation: z.enum(SUPPORTED_SCRIPTURE_TRANSLATIONS),
});

/** Read normalized device identifier from request headers. */
function requireDeviceId(req: Request): string {
  const parsed = deviceHeaderSchema.safeParse(req.headers);
  if (!parsed.success) {
    throw new ClientError(
      400,
      'missing x-device-id header; frontend should send a stable device id',
    );
  }
  return parsed.data['x-device-id'];
}

/** Handle `GET /api/saved-scriptures`. */
export async function getSavedScriptures(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const deviceId = requireDeviceId(req);
    const payload = await readSavedScriptures(deviceId);
    sendSuccess(res, payload);
  } catch (err) {
    next(err);
  }
}

/** Handle `POST /api/saved-scriptures`. */
export async function postSavedScripture(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const deviceId = requireDeviceId(req);
    const body = savedScriptureBodySchema.parse(req.body);
    const payload = await createSavedScripture({
      deviceId,
      ...body,
    });
    sendSuccess(res, payload, 201);
  } catch (err) {
    next(err);
  }
}

/** Handle `DELETE /api/saved-scriptures/:savedId`. */
export async function deleteSavedScripture(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const deviceId = requireDeviceId(req);
    const params = savedIdParamsSchema.parse(req.params);
    await removeSavedScripture(params.savedId, deviceId);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
}

/** Handle `PATCH /api/saved-scriptures/:savedId`. */
export async function patchSavedScripture(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const deviceId = requireDeviceId(req);
    const params = savedIdParamsSchema.parse(req.params);
    const body = updateSavedScriptureBodySchema.parse(req.body);
    const payload = await updateSavedScriptureTranslation(
      params.savedId,
      deviceId,
      body.translation,
    );
    sendSuccess(res, payload);
  } catch (err) {
    next(err);
  }
}
