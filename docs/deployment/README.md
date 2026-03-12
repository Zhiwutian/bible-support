# Deployment Guide (Main)

This is the main deployment guide for this project.

It is designed for lightweight/free-tier hosting with split architecture:

- Frontend: Vercel static hosting
- API: Render web service
- Database: Neon Postgres

## Account Setup Guides

Create each service account first:

- [Neon account setup](./neon-account-setup.md)
- [Render account setup](./render-account-setup.md)
- [Vercel account setup](./vercel-account-setup.md)
- [Auth0 setup (OIDC)](./auth0-setup.md)

## Recommended Deployment Flow

1. Create Neon database and copy connection string.
2. Create Render API service and configure environment variables.
3. Deploy frontend on Vercel from `client` with `VITE_API_BASE_URL`.
4. Align backend `CORS_ORIGIN` with Vercel domain.
5. Bootstrap/refresh scripture corpus translations.
6. Run smoke checks.

## Copy/Paste Checklist

Fill these values once, then copy into host dashboards.

### Your values

```txt
NEON_DATABASE_URL=postgresql://<user>:<password>@<host>/<db>?sslmode=require
RENDER_API_URL=https://<your-render-api>.onrender.com
VERCEL_FRONTEND_URL=https://<your-frontend>.vercel.app
TOKEN_SECRET=<long-random-secret>
```

### Render service settings (copy/paste)

```txt
Build Command:
corepack enable && pnpm install --frozen-lockfile && pnpm run build

Pre-Deploy Command:
corepack enable && pnpm run db:migrate && pnpm run db:seed

Start Command:
corepack enable && pnpm run start

Health Check Path:
/api/health

Node Version:
22
```

### Render environment variables (copy/paste)

```txt
NODE_ENV=production
TOKEN_SECRET=<long-random-secret>
DATABASE_URL=postgresql://<user>:<password>@<host>/<db>?sslmode=require
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true
CORS_ORIGIN=https://<your-frontend>.vercel.app
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=200
RATE_LIMIT_WRITE_MAX=60
AUTH_ENABLED=true
AUTH_PROVIDER=auth0
AUTH_ISSUER=https://<tenant>.auth0.com/
AUTH_CLIENT_ID=<client-id>
AUTH_CLIENT_SECRET=<client-secret>
AUTH_REDIRECT_URI=https://<api-host>/api/auth/callback
AUTH_LOGIN_REDIRECT_URI=https://<frontend-host>/
AUTH_LOGOUT_REDIRECT_URI=https://<frontend-host>/
SESSION_SECRET=<long-random-secret>
SESSION_TTL_SECONDS=604800
SESSION_COOKIE_SAME_SITE=none
```

For split-host deployments (`<frontend-host>` and `<api-host>` on different domains), use `SESSION_COOKIE_SAME_SITE=none` so browser session cookies are sent on cross-site API requests.

If you have multiple frontend domains:

```txt
CORS_ORIGIN=https://<prod-domain>,https://<preview-domain>
```

### Vercel project settings (copy/paste)

```txt
Root Directory: client
Framework Preset: Vite
Build Command: pnpm run build
Output Directory: dist
Environment Variable:
VITE_API_BASE_URL=https://<your-render-api>.onrender.com
```

### Verify commands (copy/paste)

```sh
DEPLOY_URL=https://<your-render-api>.onrender.com pnpm run smoke:deploy
pnpm run db:sync:bible-sources
pnpm run db:import:bible-translations
```

## Step-by-Step Deployment

### 1) Neon database

- Create a project in Neon.
- Use a recent stable Postgres version (16 or 17).
- Copy pooled connection string.
- Keep SSL enabled (`sslmode=require`).

### 2) Render API service

Create a web service from this repository root:

- Build command: `corepack enable && pnpm install --frozen-lockfile && pnpm run build`
- Pre-deploy command: `corepack enable && pnpm run db:migrate && pnpm run db:seed`
- Start command: `corepack enable && pnpm run start`
- Health check path: `/api/health`
- Node version: `22`

Set environment variables:

- `NODE_ENV=production`
- `TOKEN_SECRET=<long-random-secret>`
- `DATABASE_URL=<neon-connection-string>`
- `DB_SSL=true`
- `DB_SSL_REJECT_UNAUTHORIZED=true`
- `CORS_ORIGIN=<vercel-frontend-origin>`
- `RATE_LIMIT_WINDOW_MS=900000`
- `RATE_LIMIT_MAX=200`
- `RATE_LIMIT_WRITE_MAX=60`

### 3) Vercel frontend

Create Vercel project using repository settings:

- Root directory: `client`
- Framework preset: Vite
- Build command: `pnpm run build`
- Output directory: `dist`

Set environment variable:

- `VITE_API_BASE_URL=https://<your-render-api-host>`

This project already includes `client/vercel.json` for SPA route rewrites.

### 4) Verify

- API health: `https://<render-host>/api/health`
- Scripture diagnostics (authorized): `https://<render-host>/api/admin/scripture-sources`
- Admin users API (authenticated admin session): `https://<render-host>/api/admin/users`
- Auth bootstrap: `https://<render-host>/api/auth/login` should not return `auth_not_enabled` or generic `server_error`
- Frontend route load: `https://<vercel-host>/`
- Frontend data flow: open emotion tiles and scripture/context pages

Run smoke script against API:

```sh
DEPLOY_URL=https://<render-host> pnpm run smoke:deploy
```

Refresh local JSON + DB scripture corpus when needed:

```sh
pnpm run db:sync:bible-sources
pnpm run db:import:bible-translations
```

Auth issuer sanity check:

```sh
curl -i "${AUTH_ISSUER%.}/.well-known/openid-configuration"
```

Expected `200` JSON. If `404`, issuer domain is incorrect (often Auth0 regional domain mismatch).

## Admin Role Runbook

Use this after first successful auth login in production.

Grant first admin:

```sql
update "users"
set "role" = 'admin', "updatedAt" = now()
where "userId" = '<target-user-id>';
```

Verify admins:

```sql
select "userId", "role", "createdAt"
from "users"
where "role" = 'admin'
order by "createdAt" asc;
```

Rollback role:

```sql
update "users"
set "role" = 'user', "updatedAt" = now()
where "userId" = '<target-user-id>';
```

Break-glass recovery (promote earliest known auth account):

```sql
with candidate as (
  select "userId"
  from "auth_accounts"
  order by "createdAt" asc
  limit 1
)
update "users" u
set "role" = 'admin', "updatedAt" = now()
from candidate
where u."userId" = candidate."userId";
```

## Related Reference Docs

- Legacy API+DB deployment detail: `docs/deployment-render-neon.md`
- Split-hosting detail: `docs/deployment-vercel-render.md`
