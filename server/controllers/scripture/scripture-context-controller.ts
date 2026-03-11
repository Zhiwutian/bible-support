import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { sendSuccess } from '@server/lib/http-response.js';
import {
  readScriptureContextFromReference,
  readScriptureContextFromScriptureId,
} from '@server/services/scripture-context-service.js';

const scriptureContextQuerySchema = z
  .object({
    scriptureId: z.coerce.number().int().positive().optional(),
    reference: z.string().trim().min(1).optional(),
  })
  .refine(
    (value) => value.scriptureId !== undefined || value.reference !== undefined,
    {
      message: 'scriptureId or reference is required',
      path: ['scriptureId'],
    },
  );

/** Handle `GET /api/scripture-context?scriptureId=...` (legacy: `reference=...`). */
export async function getScriptureContext(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = scriptureContextQuerySchema.parse(req.query);
    const context =
      query.scriptureId !== undefined
        ? await readScriptureContextFromScriptureId(query.scriptureId)
        : await readScriptureContextFromReference(query.reference ?? '');
    sendSuccess(res, context);
  } catch (err) {
    next(err);
  }
}
