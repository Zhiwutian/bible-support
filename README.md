# full-stack-project

A full stack TypeScript template with React, Express, and PostgreSQL.

## Tech Stack

- Node.js 22 (devcontainer-managed)
- pnpm 10 (via Corepack)
- React 19 + Vite 7 + Tailwind CSS 4 (`client`)
- React Router (`client` route-level pages)
- React Hook Form + Zod (`client` forms)
- React Context + reducer (`client` global UI state)
- Express 5 + PostgreSQL (`server`)
- Helmet + CORS + rate limiting (`server` security basics)
- TypeScript, ESLint, Prettier, Husky, lint-staged
- Vitest + Testing Library + Supertest for testing
- Zod env validation + Pino structured logging (`server`)

## Getting Started

### 1) Create your repository

1. Click `Use this template` on GitHub and create your new repository.
2. Name it after your project (not `full-stack-project`).

### 2) Open in Cursor Dev Container (persistent)

1. Clone to your local machine:

   ```sh
   git clone <your-repo-ssh-url>
   cd <your-repo-name>
   ```

2. Open that folder in Cursor.
3. Run `Dev Containers: Rebuild and Reopen in Container`.

This template bind-mounts your local folder to `/workspace`, so files persist across rebuilds.
Outside devcontainers, this repo also includes `.nvmrc` and engine constraints in `package.json`.

### 3) Install and configure env

1. Install dependencies:

   ```sh
   corepack enable
   pnpm install
   ```

2. Configure environment:
   - Update `server/.env` with your database name in `DATABASE_URL`.
   - Set `TOKEN_SECRET` in `server/.env`.
   - Set `CORS_ORIGIN` to your allowed frontend origin(s) (comma-separated exact origins, for example `http://localhost:5173,http://localhost:4173`).
   - Tune `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX` (read), and `RATE_LIMIT_WRITE_MAX` (mutations) as needed.
   - Configure database TLS behavior with:
     - `DB_SSL` (`true`/`false`)
     - `DB_SSL_REJECT_UNAUTHORIZED` (`true`/`false`, only used when `DB_SSL=true`)
   - Mirror non-secret env updates in `server/.env.example`.

### 4) Create your database

```sh
sudo service postgresql start
createdb <name-of-database>
```

Then run:

```sh
pnpm run db:import
```

If you are using Drizzle migrations instead of SQL import:

```sh
pnpm run db:migrate
pnpm run db:seed
```

### 5) Start local development

Make sure PostgreSQL is running before starting the app:

```sh
sudo service postgresql start
```

```sh
pnpm run dev
```

Open the app and confirm the home page renders the 8 emotion tiles.

## MVP Definition (Current Freeze)

Included in the current MVP baseline:

- Emotion selection landing page with 8 themed emotion tiles.
- Scripture viewer for each emotion with fixed-order looping navigation.
- Mobile swipe navigation and desktop button navigation.
- Context summary panel and dedicated full-context route with back navigation.
- Full chapter external link integration.
- Database-backed emotion/scripture/context data with seeded default content.
- Standardized API envelope responses and core server hardening (security middleware, rate limiting, error handling).

Out of scope for this MVP baseline:

- User accounts/auth flows for end users.
- Personalized saved state/history across sessions.
- Remote context providers as required runtime dependencies.

## Accessibility Controls

- Global text-size control with persisted preferences: `Small`, `Medium`, `Large`, `XL`
- Global high-contrast mode with persisted preference
- Mobile display settings modal supports live preview and full rollback on `Cancel` (text size + high contrast)

## Example API Endpoints

Responses use an API envelope:

- Success: `{ "data": ..., "meta": { "requestId": "..." } }`
- Error: `{ "error": { "code": "...", "message": "..." }, "meta": { "requestId": "..." } }`
- Exception: `DELETE /api/todos/:todoId` returns `204 No Content` on success (no response body).

- `GET /api/hello` - basic connectivity check
- `GET /api/health` - API + database health report
- `GET /api/ready` - readiness check (returns `503` if DB is unavailable/not configured)
- `GET /api/admin/scripture-sources` - diagnostics for DB/local scripture-source readiness (admin bearer token required)
- `GET /api/emotions` - list all emotion tiles
- `GET /api/emotions/:slug/scriptures` - list fixed-order scriptures for one emotion
- `GET /api/emotions/:slug/scriptures/random` - fetch one random scripture for one emotion
- `GET /api/scripture-context?scriptureId=<id>` - preferred context lookup for one scripture row (`404` if scripture id does not exist)
- `GET /api/scripture-context?reference=<ref>` - legacy context lookup (backward compatibility)
- `GET /api/scriptures/search` - search verses by guided picker, reference, or keyword mode
- `GET /api/saved-scriptures` - list saved verses for the current device (`x-device-id` required)
- `POST /api/saved-scriptures` - save a verse/range for the current device (`x-device-id` required)
- `PATCH /api/saved-scriptures/:savedId` - update saved verse translation (`x-device-id` required)
- `DELETE /api/saved-scriptures/:savedId` - remove one saved verse (`x-device-id` required)
- `GET /api/todos` - legacy todo demo endpoint (still available)
- `POST /api/todos` - create todo with `{ "task": "..." }`
- `PATCH /api/todos/:todoId` - update completion with `{ "isCompleted": true|false }`
- `DELETE /api/todos/:todoId` - remove todo
- Exception: `DELETE /api/saved-scriptures/:savedId` returns `204 No Content` on success (no response body).

## Scripts

- `pnpm run dev` - runs both client and server watchers
- `pnpm run dev:clean` - stops stale listeners on dev ports (`5173`, `8080`)
- `pnpm run dev:fresh` - cleans stale listeners, then starts dev watchers
- `pnpm run lint` - lints client and server
- `pnpm run tsc` - type checks client and server
- `pnpm run test` - runs frontend and backend unit/integration tests
- `pnpm run test:coverage` - runs test coverage reports for client and server
- `pnpm run test:changed` - runs related tests for changed files (fast local PR feedback)
- `pnpm run smoke:deploy` - smoke tests a deployed URL (`DEPLOY_URL=...`)
- `pnpm run build` - builds the client for production
- `pnpm run start` - starts production server
- `pnpm run db:import` - resets/imports schema and seed data
- `pnpm run db:generate` - generates Drizzle SQL migrations from schema
- `pnpm run db:migrate` - applies Drizzle migrations
- `pnpm run db:seed` - transactionally upserts starter data (safe to rerun; heals partial seed state)
- `pnpm run db:sync:bible-sources` - downloads and normalizes local public-domain JSON copies (`KJV`, `ASV`, `WEB`) to `server/data/bible`
- `pnpm run db:import:bible-json` - imports full-bible JSON into `scripture_verses` (defaults to public KJV source)
- `pnpm run db:import:bible-translations` - syncs local sources and imports canonical `KJV`, `ASV`, `WEB` into `scripture_verses`
- `pnpm run db:studio` - opens Drizzle Studio
- `pnpm run psql` - opens `psql` using `DATABASE_URL`
- `pnpm run deploy` - pushes `main` to `pub` for deployment workflow

## CI and Deployment

- Pull requests run CI checks in `/.github/workflows/ci.yml`:
  - `docs-policy` (requires docs updates when app/config files change)
  - `db-migration-policy` (requires migration updates when DB schema files change)
  - `lint`
  - `tsc`
  - `test`
  - `build`
- Deployment runs from `/.github/workflows/main.yml` on pushes to `pub`.
- Existing deploy workflow applies `db:migrate` + `db:seed` on host startup (non-destructive).
- Scripture corpus import is separate from seed data; run translation import scripts after deploy bootstrap when corpus refresh is needed.

## Lightweight Free-Tier Deployment

Recommended first deployment path:

- Web/API: Render free Web Service (single Node service)
- Database: Neon free Postgres

Setup:

1. Create Neon database and copy `DATABASE_URL`.
2. Create Render service (or Blueprint via `render.yaml`).
3. Set required environment variables:
   - `NODE_ENV=production`
   - `TOKEN_SECRET=<strong-random-secret>`
   - `DATABASE_URL=<neon-url>`
   - `DB_SSL=true`
   - `DB_SSL_REJECT_UNAUTHORIZED=true`
   - `CORS_ORIGIN=<your-deployed-origin>`
4. Bootstrap hosted DB safely:

```sh
pnpm run db:migrate
pnpm run db:seed
```

If you use the provided `render.yaml` Blueprint, these run automatically via `preDeployCommand`.

5. Smoke test deployment:

```sh
DEPLOY_URL=https://your-service-url pnpm run smoke:deploy
```

Detailed guide: `docs/deployment-render-neon.md`.

## Optional Phase 2: Better Free-Tier UX

Split hosting to avoid frontend cold starts:

- Frontend: Vercel static hosting (`client`)
- API: Render free web service (`server` runtime via root scripts)
- Database: Neon

Frontend deployment detail:

- Set Vercel Root Directory to `client`
- Set `VITE_API_BASE_URL` to your Render API origin
- Keep backend `CORS_ORIGIN` aligned with your Vercel origin(s)

Detailed guide: `docs/deployment-vercel-render.md`.
Main deployment hub: `docs/deployment/README.md`.

## Project Docs

Long-form project documentation is in `/docs`:

- `docs/README.md` - documentation index and maintenance guidance
- `docs/architecture.md` - system architecture and request/data flow
- `docs/project-structure.md` - folder-by-folder ownership and purpose
- `docs/development-workflow.md` - local workflow, CI, and deployment process
- `docs/app-startup-walkthrough.md` - startup timeline from dev command to first render/API calls
- `docs/conversation-running-log.md` - running record of prompts and response summaries for this implementation cycle

## Documentation Quality Gates

Every pull request should meet these documentation gates:

- If behavior changed, update docs in `/docs` in the same PR.
- If scripts/workflows changed, update `README.md` and `docs/development-workflow.md`.
- If architecture boundaries changed, update `docs/architecture.md`.
- If code moved or ownership changed, update `docs/project-structure.md`.
- For major features, add a short design/behavior note using `docs/templates/feature-doc-template.md`.

PR authors should complete the documentation checklist in `/.github/pull_request_template.md`.
