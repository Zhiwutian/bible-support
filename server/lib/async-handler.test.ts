import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { asyncHandler } from './async-handler.js';

function createMockRes(): Response {
  return {} as Response;
}

describe('asyncHandler', () => {
  it('forwards rejections to next', async () => {
    const err = new Error('boom');
    const handler = asyncHandler(async () => {
      throw err;
    });
    const next = vi.fn() as NextFunction;
    const req = {} as Request;
    const res = createMockRes();

    handler(req, res, next);

    await vi.waitFor(() => {
      expect(next).toHaveBeenCalledWith(err);
    });
  });

  it('runs onError before next when provided', async () => {
    const err = new Error('fail');
    const onError = vi.fn();
    const handler = asyncHandler(
      async () => {
        throw err;
      },
      { onError },
    );
    const next = vi.fn() as NextFunction;
    const req = { path: '/x' } as Request;
    const res = createMockRes();

    handler(req, res, next);

    await vi.waitFor(() => {
      expect(onError).toHaveBeenCalledWith(err, req);
      expect(next).toHaveBeenCalledWith(err);
    });
  });
});
