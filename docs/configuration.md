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

1. Install dependencies. The root **`postinstall`** script runs **`pnpm run install:env`**, which creates **`server/.env`** from `server/.env.example` when it does not exist yet.

2. Frontend template (create **`client/.env.local`** when you need `VITE_*` overrides, for example split hosting):

```sh
test -f client/.env.local || cp client/.env.example client/.env.local
```

3. Edit backend values in `server/.env`:

- `DATABASE_URL`
- `TOKEN_SECRET`
- `CORS_ORIGIN`
- Optional auth values (`AUTH_*`, `SESSION_*`)
  - `AUTH_SOCIAL_FACEBOOK_ENABLED` controls whether Facebook appears as a login option (default `false`)

4. Edit frontend values in `client/.env.local`:

- `VITE_API_BASE_URL` (for split hosting or non-default API origin)

If `VITE_API_BASE_URL` is empty locally, client requests use same-origin paths.

## Validation

There is no root **`validate:env`** script. Ensure required keys from `server/.env.example` are set before `pnpm run dev`; missing database or auth configuration surfaces as startup or request-time errors.

## Deployment Mapping

These files are local source-of-truth templates. Hosted environments still need platform env vars:

- Render API service: set keys from `server/.env.example`
- Vercel frontend project: set keys from `client/.env.example` (`VITE_*` only)

For split-host auth cookies in production, use:

- `SESSION_COOKIE_SAME_SITE=none`
- Optional auth callback tuning:
  - `AUTH_LOGIN_STATE_TTL_SECONDS` controls short-lived OIDC state-cookie lifetime (default `600`, min `60`, max `3600`).

## Safety Notes

- Never place backend secrets in client env files.
- Anything under `VITE_*` is bundled into frontend code and visible to end users.
- Email is intentionally not persisted in local auth tables.
- Auth audit logs are designed to exclude token/cookie/secret values.
