# Render + Neon Deployment (Free-Tier First)

This guide deploys the existing monolith shape (Express API + static SPA) with minimal changes:

- Web app/API: Render free Web Service
- Database: Neon free Postgres

## Why this path

- Fits the current runtime without splitting frontend/backend.
- Uses existing production commands:
  - build: `pnpm run build`
  - start: `pnpm run start`
- Keeps hosted DB bootstrap safe by using migrations and seed scripts.

## Current free-tier checkpoints

Always confirm provider limits before go-live. As of this documentation update:

- Render free web services:
  - include monthly free instance hours
  - sleep after inactivity
  - use an ephemeral filesystem
- Neon free Postgres:
  - has strict storage/compute quotas suitable for MVP/small traffic

Treat these as operational constraints: cold starts are expected on free web tiers, and DB size must stay lean.

## 1) Provision Neon

1. Create a Neon project and database.
2. Copy the connection string.
3. Use the pooled connection string when available.
4. Keep SSL enabled.

## 2) Provision Render

### Option A: Blueprint (recommended)

1. In Render, create a new Blueprint service from this repo.
2. Render picks up `render.yaml` from repository root.
3. Set unresolved secret values in the Render dashboard:
   - `DATABASE_URL`
   - `CORS_ORIGIN`
4. Blueprint includes a pre-deploy bootstrap command:
   - `pnpm run db:migrate && pnpm run db:seed`

### Option B: Manual service setup

- Environment: Node
- Plan: Free
- Build command: `corepack enable && pnpm install --frozen-lockfile && pnpm run build`
- Start command: `corepack enable && pnpm run start`
- Health check path: `/api/health`
- Node version: `22`

## 3) Configure environment variables

Set these on the Render service:

- `NODE_ENV=production`
- `TOKEN_SECRET=<long-random-secret>`
- `DATABASE_URL=<neon-connection-string>`
- `DB_SSL=true`
- `DB_SSL_REJECT_UNAUTHORIZED=true`
- `CORS_ORIGIN=<https://your-render-service-or-custom-domain>`
- `RATE_LIMIT_WINDOW_MS=900000`
- `RATE_LIMIT_MAX=200`
- `RATE_LIMIT_WRITE_MAX=60`

## 4) Bootstrap database safely

For hosted environments, do not use `db:import` because it is destructive.

If not using the Blueprint pre-deploy command, run one-time bootstrap commands in a shell with production env loaded:

```sh
pnpm run db:migrate
pnpm run db:seed
```

## 5) Run smoke tests

Use the included smoke script against the deployed URL:

```sh
DEPLOY_URL=https://your-service.onrender.com pnpm run smoke:deploy
```

This verifies:

- app page load (`/`)
- API liveness (`/api/health`)
- emotion list + scripture flow (`/api/emotions`, `/api/emotions/:slug/scriptures`)
- scripture context lookup (`/api/scripture-context?scriptureId=...`)

## Notes

- Free web services can cold start after inactivity.
- If you need zero cold starts later, upgrade web compute first.
- Keep Neon free tier until data or throughput justifies paid scaling.
- If frontend and API are split across hosts, set `CORS_ORIGIN` to the exact frontend origin(s) (comma-separated).
