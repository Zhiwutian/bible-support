import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { SUPPORTED_SCRIPTURE_TRANSLATIONS } from '@shared/scripture-search-contracts.js';
import type {
  CreateSavedScriptureRequest,
  UpdateSavedScriptureTranslationRequest,
} from '@shared/saved-scripture-contracts.js';
import { getSessionUserId } from '@server/lib/auth-context.js';
import { sendSuccess } from '@server/lib/http-response.js';
import { ClientError } from '@server/lib/client-error.js';
import {
  createSavedScripture,
  migrateDeviceSavedScripturesToUser,
  readSavedScriptures,
  removeSavedScripture,
  type SavedScriptureOwnerScope,
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

/** Read optional normalized device identifier from request headers. */
function readDeviceId(req: Request): string | null {
  const raw = req.get('x-device-id');
  if (!raw) return null;
  const parsed = deviceHeaderSchema.safeParse({ 'x-device-id': raw });
  if (!parsed.success) return null;
  return parsed.data['x-device-id'];
}

/** Resolve owner scope from auth session + device header. */
function resolveScope(req: Request): SavedScriptureOwnerScope {
  const ownerUserId = getSessionUserId(req);
  const deviceId = readDeviceId(req);
  if (!ownerUserId && !deviceId) {
    throw new ClientError(
      400,
      'missing x-device-id header; frontend should send a stable device id',
    );
  }
  return {
    deviceId,
    ownerUserId,
  };
}

/** Handle `GET /api/saved-scriptures`. */
export async function getSavedScriptures(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const scope = resolveScope(req);
    if (scope.ownerUserId && scope.deviceId) {
      await migrateDeviceSavedScripturesToUser(
        scope.deviceId,
        scope.ownerUserId,
      );
    }
    const payload = await readSavedScriptures(scope);
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
    const scope = resolveScope(req);
    if (scope.ownerUserId && scope.deviceId) {
      await migrateDeviceSavedScripturesToUser(
        scope.deviceId,
        scope.ownerUserId,
      );
    }
    const body = savedScriptureBodySchema.parse(
      req.body,
    ) as CreateSavedScriptureRequest;
    const payload = await createSavedScripture({
      scope,
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
    const scope = resolveScope(req);
    if (scope.ownerUserId && scope.deviceId) {
      await migrateDeviceSavedScripturesToUser(
        scope.deviceId,
        scope.ownerUserId,
      );
    }
    const params = savedIdParamsSchema.parse(req.params);
    await removeSavedScripture(params.savedId, scope);
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
    const scope = resolveScope(req);
    if (scope.ownerUserId && scope.deviceId) {
      await migrateDeviceSavedScripturesToUser(
        scope.deviceId,
        scope.ownerUserId,
      );
    }
    const params = savedIdParamsSchema.parse(req.params);
    const body = updateSavedScriptureBodySchema.parse(
      req.body,
    ) as UpdateSavedScriptureTranslationRequest;
    const payload = await updateSavedScriptureTranslation(
      params.savedId,
      scope,
      body.translation,
    );
    sendSuccess(res, payload);
  } catch (err) {
    next(err);
  }
}
