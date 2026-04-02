/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { DrizzleQueryError } from 'drizzle-orm';
import { ZodError } from 'zod';
import { env } from '@server/config/env.js';
import { type ApiErrorCode } from '@shared/api-contracts';
import { ClientError } from './client-error.js';
import { sendError } from './http-response.js';
import { logger } from './logger.js';

/** Postgres / pg driver `code` when present on thrown errors. */
function postgresErrorCode(err: unknown): string | undefined {
  if (!err || typeof err !== 'object') return undefined;
  const o = err as { code?: unknown; cause?: unknown };
  if (typeof o.code === 'string') return o.code;
  const c = o.cause;
  if (
    c &&
    typeof c === 'object' &&
    typeof (c as { code?: unknown }).code === 'string'
  ) {
    return (c as { code: string }).code;
  }
  return undefined;
}

/** Centralized Express error handler. */
export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const toErrorCode = (code: ApiErrorCode): ApiErrorCode => code;

  if (err instanceof ClientError) {
    sendError(res, err.status, {
      code: toErrorCode('client_error'),
      message: err.message,
    });
  } else if (err instanceof ZodError) {
    sendError(res, 400, {
      code: toErrorCode('validation_error'),
      message: 'request validation failed',
      details: err.issues,
    });
  } else if (err instanceof jwt.JsonWebTokenError) {
    sendError(res, 401, {
      code: toErrorCode('invalid_token'),
      message: 'invalid access token',
    });
  } else if (err instanceof DrizzleQueryError) {
    const pgCode = postgresErrorCode(err);
    if (pgCode === '3D000') {
      logger.warn(
        { err, pgCode },
        'Database in DATABASE_URL does not exist or is unreachable',
      );
      sendError(res, 503, {
        code: toErrorCode('client_error'),
        message:
          'database is not ready. create the database named in DATABASE_URL (e.g. createdb your_db), then run pnpm run db:migrate and pnpm run db:seed from the repo root.',
      });
    } else if (pgCode === '42P01') {
      logger.warn(
        { err, pgCode },
        'Referenced database relation is missing (migrations not applied?)',
      );
      sendError(res, 503, {
        code: toErrorCode('client_error'),
        message:
          'database schema is missing. run pnpm run db:migrate (and pnpm run db:seed) from the repo root.',
      });
    } else if (pgCode?.startsWith('08')) {
      logger.warn({ err, pgCode }, 'PostgreSQL connection error');
      sendError(res, 503, {
        code: toErrorCode('client_error'),
        message:
          'could not reach the database. check DATABASE_URL, DB_SSL settings, and that PostgreSQL is running.',
      });
    } else {
      logger.error({ err, pgCode }, 'Unhandled Drizzle query error');
      sendError(res, 500, {
        code: toErrorCode('internal_error'),
        message: 'an unexpected error occurred',
        details:
          env.NODE_ENV === 'development' && err instanceof Error
            ? { message: err.message }
            : undefined,
      });
    }
  } else {
    logger.error({ err }, 'Unhandled server error');
    sendError(res, 500, {
      code: toErrorCode('internal_error'),
      message: 'an unexpected error occurred',
      details:
        env.NODE_ENV === 'development' && err instanceof Error
          ? { message: err.message }
          : undefined,
    });
  }
}
