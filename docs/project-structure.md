# Project Structure

## Root

- `package.json`
  - Orchestrates cross-project scripts (`dev`, `lint`, `tsc`, `build`).
- `pnpm-workspace.yaml`
  - Declares workspace packages (`client`, `server`).
- `pnpm-lock.yaml`
  - Locks all workspace dependency versions for reproducible installs.
- `.devcontainer/`
  - Defines reproducible development container setup.
- `.github/workflows/`
  - CI and deployment automation.
- `shared/`
  - Shared frontend/backend TypeScript contracts (for example, API envelope and error code types).
- `database/`
  - SQL schema, seed data, and import script.
- `docs/`
  - Project documentation and architecture notes.

## Frontend (`client`)

- `src/`
  - React application source.
  - `App.tsx` provides app shell layout and route definitions.
  - `pages/` contains route-level screens (for example, `EmotionsPage`, `EmotionScripturePage`, `AboutPage`).
  - `components/app/` contains app-level cross-cutting UI components/providers (error boundary, toasts, nav link button wrapper).
  - `components/ui/` contains reusable Tailwind-based UI primitives (`Button`, `Input`, `Card`, `Badge`, `EmptyState`, `SectionHeader`) and a barrel export at `components/ui/index.ts`.
  - `features/emotions/` contains emotion/scripture API module, scripture link helpers, and scripture-view state hook orchestration.
  - `features/todos/` contains legacy Todo form/API/hook example code.
  - `state/` contains app-level Context + reducer state (`AppStateProvider` and hooks).
  - `lib/index.ts` exposes shared frontend utilities through a barrel export (for example, API client helpers).
  - Recommended growth pattern:
    - `components/` for reusable UI pieces
    - `pages/` for route-level screens
    - `features/` for domain-driven UI + state + API hooks
    - `lib/` for utilities and shared client services
- `vite.config.ts`
  - Vite config, Tailwind CSS plugin registration, `@` alias resolution, and API proxy for local development.
- `tsconfig.json`
  - TypeScript config for client code, including `@/*` path alias mapping to `src/*`.
- `src/index.css`
  - Tailwind CSS entrypoint (`@import 'tailwindcss'`) and shared global styles.
- `package.json`
  - Frontend runtime and build-time dependencies.

## Backend (`server`)

- `server.ts`
  - Process bootstrap and HTTP server startup.
- `app.ts`
  - Express app composition (middleware, route registration, static hosting, error handling).
- `routes/`
  - Express route modules grouped by API surface.
- `controllers/`
  - Route handlers that format request/response behavior.
- `services/`
  - Business logic independent of Express request/response types.
  - Includes shared DB guard helper (`services/require-db.ts`) to keep DB-availability behavior consistent.
- `db/`
  - Database access setup, Drizzle schema, and query helpers.
  - Includes pool lifecycle helpers for startup/shutdown safety.
- `scripts/`
  - Server-side utility scripts (for example, idempotent seed scripts).
- `drizzle.config.ts`
  - Drizzle Kit migration config for schema generation and migration output.
- `tsconfig.json`
  - Server TypeScript config, including `@server/*` alias mapping to simplify imports.
- `lib/`
  - Shared backend utilities and middleware (errors, auth, request typing, response envelopes).
- `public/`
  - Server-hosted static files (uploads or other direct-served assets).
- Current example path:
  - `GET /api/health` -> route -> controller -> service -> Drizzle db client
  - `GET /api/emotions` -> route -> controller -> service -> Drizzle db client
  - `GET /api/emotions/:slug/scriptures` -> route -> controller -> service -> Drizzle db client
  - `GET /api/scripture-context?scriptureId=...` -> route -> controller -> service -> Drizzle db client
  - `GET /api/todos` -> route -> controller -> service -> Drizzle db client

## Data Layer (`database`)

- `schema.sql` - canonical schema definition
- `data.sql` - optional seed content (includes emotion/scripture starter rows)
- `import.sh` - deterministic database rebuild/import script
- `migrations/` - Drizzle-generated migration SQL files

## Ownership Guidance

- UI changes: start in `client/src`.
- API changes: add route + service in `server`.
- DB changes: update `database/schema.sql` and corresponding server queries.
- Cross-cutting behavior changes: update docs in this folder in the same PR.
