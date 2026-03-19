import type { Request, RequestHandler, Response } from 'express';

type AsyncRouteHandler = (req: Request, res: Response) => Promise<void>;

export type AsyncHandlerOptions = {
  /** Runs before `next(err)` (e.g. structured warn logs). */
  onError?: (err: unknown, req: Request) => void;
};

/**
 * Wrap an async route handler so rejections and thrown errors reach Express
 * `error-middleware` via `next(err)`.
 */
export function asyncHandler(
  handler: AsyncRouteHandler,
  options?: AsyncHandlerOptions,
): RequestHandler {
  return (req, res, next) => {
    handler(req, res).then(
      () => {
        /* response completed without throwing */
      },
      (err: unknown) => {
        options?.onError?.(err, req);
        next(err);
      },
    );
  };
}
