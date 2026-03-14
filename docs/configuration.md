# Configuration

This project uses separate configuration files for frontend and backend.

## Config Boundaries

- Backend runtime config lives in `server/.env`
- Frontend build/runtime config lives in `client/.env.local`
- Templates are committed as:
  - `server/.env.example`
  - `client/.env.example`

Do not commit real secrets. Local env files are gitignored.

## Local Setup

1. Copy templates:

```sh
pnpm run setup:env
```

To intentionally reset both local env files from templates:

```sh
pnpm run setup:env:force
```

2. Edit backend values in `server/.env`:

- `DATABASE_URL`
- `TOKEN_SECRET`
- `CORS_ORIGIN`
- Optional auth values (`AUTH_*`, `SESSION_*`)
  - `AUTH_SOCIAL_FACEBOOK_ENABLED` controls whether Facebook appears as a login option (default `false`)

3. Edit frontend values in `client/.env.local`:

- `VITE_API_BASE_URL` (for split hosting or non-default API origin)

If `VITE_API_BASE_URL` is empty locally, client requests use same-origin paths.

## Validation

Run configuration validation manually:

```sh
pnpm run validate:env
```

`pnpm run dev` runs this validation automatically before starting watchers.

## Deployment Mapping

These files are local source-of-truth templates. Hosted environments still need platform env vars:

- Render API service: set keys from `server/.env.example`
- Vercel frontend project: set keys from `client/.env.example` (`VITE_*` only)

For split-host auth cookies in production, use:

- `SESSION_COOKIE_SAME_SITE=none`

## Safety Notes

- Never place backend secrets in client env files.
- Anything under `VITE_*` is bundled into frontend code and visible to end users.
- Email is intentionally not persisted in local auth tables.
- Auth audit logs are designed to exclude token/cookie/secret values.
