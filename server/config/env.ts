import 'dotenv/config';
import { z } from 'zod';

export const SESSION_COOKIE_SAME_SITE_VALUES = [
  'lax',
  'strict',
  'none',
] as const;
export type SessionCookieSameSite =
  (typeof SESSION_COOKIE_SAME_SITE_VALUES)[number];

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(8080),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(200),
  RATE_LIMIT_WRITE_MAX: z.coerce.number().int().positive().default(60),
  DATABASE_URL: z.string().optional().default(''),
  DB_SSL: z.coerce.boolean().default(false),
  DB_SSL_REJECT_UNAUTHORIZED: z.coerce.boolean().default(true),
  TOKEN_SECRET: z.string().min(1, 'TOKEN_SECRET is required'),
  AUTH_ENABLED: z.coerce.boolean().default(false),
  AUTH_PROVIDER: z.string().default('auth0'),
  AUTH_ISSUER: z.string().default(''),
  AUTH_CLIENT_ID: z.string().default(''),
  AUTH_CLIENT_SECRET: z.string().default(''),
  AUTH_REDIRECT_URI: z.string().default(''),
  AUTH_LOGIN_REDIRECT_URI: z.string().default(''),
  AUTH_LOGOUT_REDIRECT_URI: z.string().default(''),
  SESSION_SECRET: z.string().default(''),
  SESSION_TTL_SECONDS: z.coerce.number().int().positive().default(604800),
  SESSION_COOKIE_SAME_SITE: z
    .enum(SESSION_COOKIE_SAME_SITE_VALUES)
    .default('lax'),
});

/** Format zod issues into a single startup error string. */
function formatEnvIssues(issues: z.ZodIssue[]): string {
  return issues
    .map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
    .join('; ');
}

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  const formatted = formatEnvIssues(parsed.error.issues);
  throw new Error(`Invalid environment configuration: ${formatted}`);
}

if (parsed.data.AUTH_ENABLED) {
  const requiredWhenAuthEnabled = [
    ['AUTH_ISSUER', parsed.data.AUTH_ISSUER],
    ['AUTH_CLIENT_ID', parsed.data.AUTH_CLIENT_ID],
    ['AUTH_REDIRECT_URI', parsed.data.AUTH_REDIRECT_URI],
    ['AUTH_LOGIN_REDIRECT_URI', parsed.data.AUTH_LOGIN_REDIRECT_URI],
    ['AUTH_LOGOUT_REDIRECT_URI', parsed.data.AUTH_LOGOUT_REDIRECT_URI],
    ['SESSION_SECRET', parsed.data.SESSION_SECRET],
  ] as const;
  const missing = requiredWhenAuthEnabled
    .filter(([, value]) => !value.trim())
    .map(([key]) => key);
  if (missing.length > 0) {
    throw new Error(
      `Invalid environment configuration: ${missing.join(', ')} required when AUTH_ENABLED=true`,
    );
  }
}

/** Validated, typed runtime environment values. */
export const env = parsed.data;
