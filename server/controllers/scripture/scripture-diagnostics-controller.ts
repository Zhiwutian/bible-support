import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '@server/lib/http-response.js';
import { readScriptureSourcesDiagnostics } from '@server/services/scripture-diagnostics-service.js';

/** Handle `GET /api/admin/scripture-sources`. */
export async function getScriptureSourcesDiagnostics(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const report = await readScriptureSourcesDiagnostics();
    sendSuccess(res, report, 200);
  } catch (err) {
    next(err);
  }
}
