process.env.NODE_ENV = 'test';
process.env.TOKEN_SECRET = process.env.TOKEN_SECRET ?? 'test-token-secret';
process.env.PORT = process.env.PORT ?? '8080';
process.env.DATABASE_URL = '';
// Keep server tests deterministic even when CI exports auth env vars.
process.env.AUTH_ENABLED = 'false';
