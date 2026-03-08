# Application Architecture

## Overview

This template is a two-tier web application:

- Frontend: React + Vite + Tailwind CSS in `client`
- Backend: Express + PostgreSQL in `server`

At runtime, the browser loads static assets from the server and calls API routes under `/api/*`.

## Runtime Components

- **Browser Client**
  - Executes React UI.
  - Uses React Router for route-level pages (`/`, `/emotions/:slug`, `/emotions/:slug/context`, `/about`).
  - Uses `react-hook-form` + `zod` for client-side form handling/validation.
  - Uses Context + reducer (`AppStateProvider`) for lean global UI state.
  - Calls backend endpoints for emotion and scripture data.
- **Express Server**
  - Serves API routes.
  - Organizes handlers by `routes/`, `controllers/`, and `services/`.
  - Applies baseline security middleware (`helmet`, controlled `cors`, API rate limiting).
  - Serves built frontend assets from `client/dist`.
  - Falls back to `index.html` for non-API routes to support SPA routing.
- **PostgreSQL**
  - Stores relational data.
  - Accessed through Drizzle ORM on top of the `pg` pool.
  - Core emotion feature uses:
    - `emotions` table (one row per emotion tile)
    - `scriptures` table (many scriptures per emotion with fixed `displayOrder`)

## Request Flow

1. Browser requests page.
2. Express serves static bundle from `client/dist`.
3. React app initializes and fetches API data from `/api/*`.
4. Express route handlers validate input, execute business logic, and optionally query PostgreSQL.
5. Server returns JSON response.
6. React updates UI state.

Example server paths in this template:

- `GET /api/health` -> `routes/api.ts` -> `controllers/health-controller.ts` -> `services/health-service.ts` -> `db/drizzle.ts`
- `GET /api/ready` -> `routes/api.ts` -> `controllers/health-controller.ts` -> `services/health-service.ts` -> `db/drizzle.ts`
- `GET /api/emotions` -> `routes/api.ts` -> `controllers/emotion-controller.ts` -> `services/emotion-service.ts` -> `db/drizzle.ts` -> `db/schema.ts`
- `GET /api/emotions/:slug/scriptures` -> `routes/api.ts` -> `controllers/emotion-controller.ts` -> `services/emotion-service.ts` -> `db/drizzle.ts` -> `db/schema.ts`
- `GET /api/scripture-context?scriptureId=...` -> `routes/api.ts` -> `controllers/scripture-context-controller.ts` -> `services/scripture-context-service.ts` -> `db/drizzle.ts` -> `db/schema.ts`
- `GET /api/todos` -> `routes/api.ts` -> `controllers/todo-controller.ts` -> `services/todo-service.ts` -> `db/drizzle.ts` -> `db/schema.ts`

## Error Handling

- Server uses centralized error middleware (`server/lib/error-middleware.ts`).
- `ClientError` is used for expected HTTP-level errors.
- JWT auth failures are normalized to `401` responses.
- API responses are normalized to envelope shape (`data`/`error` + `meta.requestId`).
- Delete endpoints may intentionally return `204 No Content` for successful deletions.
- Envelope and error code contracts are shared across client/server via `shared/api-contracts.ts`.

## Reliability Endpoints

- `/api/health` is a liveness-style endpoint and returns `200` when the app is running.
- `/api/ready` is a stricter readiness endpoint and returns `503` when database dependencies are not ready.

## Frontend State Model

- **Local component state (`useState`)**
  - For short-lived view state owned by one component.
- **Context + reducer (global UI state)**
  - For app-level UI state shared by multiple components (for example, todo list filters).
- **Server state**
  - Data loaded from `/api/*` remains request-driven through feature API modules and hooks (for example, `emotion-api.ts` + `useEmotionScriptures`).

## Environment and Configuration

- Devcontainer sets Node 22 and mounts project files to `/workspace`.
- `.nvmrc` and `package.json` engines pin local runtime expectations.
- Server env values are managed in `server/.env`.
- `DATABASE_URL` controls DB connectivity.
- `TOKEN_SECRET` is required for auth middleware.
- `DB_SSL` and `DB_SSL_REJECT_UNAUTHORIZED` control PostgreSQL TLS behavior.
- Environment variables are validated at startup in `server/config/env.ts`.

## Logging

- Application logs use structured JSON logging via `pino`.
- HTTP request logging is handled by `pino-http` middleware with request IDs (`x-request-id`).

## Build and Deploy Shape

- `pnpm run build` builds the frontend bundle.
- `pnpm run start` runs the server in production mode.
- Deploy can run as a single Node web service (for example Render) with external Postgres (for example Neon).
- Legacy workflow also supports EC2-based deployment via GitHub Actions.
