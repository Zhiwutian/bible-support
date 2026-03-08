# Render Account Setup

Follow these steps to create a Render account and host the API service.

## 1) Create account

1. Go to [Render](https://render.com/).
2. Click **Get Started**.
3. Sign in with GitHub (recommended).
4. Authorize access to your repository.
5. Start with a Personal workspace and free plan.

## 2) Create API web service

Use either:

- Blueprint deploy (if `render.yaml` is present), or
- Manual Web Service creation.

For manual setup, use repository root with:

- Build command: `corepack enable && pnpm install --frozen-lockfile && pnpm run build`
- Pre-deploy command: `corepack enable && pnpm run db:migrate && pnpm run db:seed`
- Start command: `corepack enable && pnpm run start`
- Health check path: `/api/health`
- Node version: `22`

## 3) Configure environment variables

Set these in Render service settings:

- `NODE_ENV=production`
- `TOKEN_SECRET=<long-random-secret>`
- `DATABASE_URL=<neon-connection-string>`
- `DB_SSL=true`
- `DB_SSL_REJECT_UNAUTHORIZED=true`
- `CORS_ORIGIN=<vercel-frontend-origin>`
- `RATE_LIMIT_WINDOW_MS=900000`
- `RATE_LIMIT_MAX=200`
- `RATE_LIMIT_WRITE_MAX=60`

## 4) Deploy and check

1. Trigger deploy.
2. Open `https://<your-render-host>/api/health`.
3. Confirm you get a healthy response payload.

## 5) Free-tier behavior

- Free services may sleep when idle.
- First request after idle can cold start.
