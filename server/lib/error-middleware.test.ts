import type { NextFunction, Request, Response } from 'express';
import { DrizzleQueryError } from 'drizzle-orm';
import { describe, expect, it, vi } from 'vitest';
import { errorMiddleware } from './error-middleware.js';

function mockResponse(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    getHeader: vi.fn().mockReturnValue(undefined),
  };
  return res as unknown as Response;
}

describe('errorMiddleware', () => {
  it('returns 503 for DrizzleQueryError when Postgres reports missing database (3D000)', () => {
    const res = mockResponse();
    const cause = Object.assign(new Error('database "x" does not exist'), {
      code: '3D000',
    });
    const err = new DrizzleQueryError('select 1', [], cause);
    errorMiddleware(err, {} as Request, res, vi.fn() as NextFunction);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: 'client_error',
          message: expect.stringContaining('create the database'),
        }),
      }),
    );
  });

  it('returns 503 for DrizzleQueryError when relation is missing (42P01)', () => {
    const res = mockResponse();
    const cause = Object.assign(
      new Error('relation "emotions" does not exist'),
      {
        code: '42P01',
      },
    );
    const err = new DrizzleQueryError('select * from emotions', [], cause);
    errorMiddleware(err, {} as Request, res, vi.fn() as NextFunction);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: 'client_error',
          message: expect.stringContaining('db:migrate'),
        }),
      }),
    );
  });
});
