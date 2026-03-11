import { Request, Response } from 'express';
import { sendSuccess } from '@server/lib/http-response.js';

/** Handle `GET /api/hello`. */
export function readHello(_req: Request, res: Response): void {
  sendSuccess(res, { message: 'Hello, World!' });
}
