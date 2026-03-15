# Development Workflow

## Local Development Loop

1. Pull latest changes.
2. If not using the devcontainer, run `nvm use` (Node 22 from `.nvmrc`).
3. Run `corepack enable` once per machine/session if needed.
4. Run `pnpm install` if dependencies changed.
5. Ensure PostgreSQL is running (`sudo service postgresql start`).
6. Run `pnpm run dev` for client + server watchers.
   - `pnpm run dev` now validates `server/.env` and `client/.env.local` first.
   - If you hit stale port/process issues, run `pnpm run dev:fresh` instead.
7. Make incremental changes.
8. Before commit, run:
   - `pnpm run lint`
   - `pnpm run tsc`
   - `pnpm run test`
   - `pnpm run build`
9. Optionally run `pnpm run test:coverage` to inspect coverage trends.
10. For quick feedback during active work, run `pnpm run test:changed`.

## Configuration Workflow

- Keep backend values in `server/.env` (copy from `server/.env.example`).
- Keep frontend values in `client/.env.local` (copy from `client/.env.example`).
- Do not commit local env files; only commit example templates.
- For split hosting, set `client/.env.local` with `VITE_API_BASE_URL` in local dev as needed.
- For hosted environments, mirror values into platform env dashboards:
  - Render uses server keys.
  - Vercel uses frontend `VITE_*` keys.
- Reference: `docs/configuration.md`.

## Database Workflow

- Modify `database/schema.sql` for schema changes.
- Define/update typed Drizzle schema in `server/db/schema.ts`.
- Generate migrations with `pnpm run db:generate`.
- Commit generated migration files under `database/migrations/` with the schema change.
- Include a short rationale in your PR for why the schema change is needed.
- If a new/changed query pattern is introduced, evaluate indexes and note index decisions in the PR.
- Apply migrations with `pnpm run db:migrate`.
- Seed starter app data with `pnpm run db:seed` (transactional + upsert-based; safe to rerun and can repair partial seed state).
- Sync local public-domain translation JSON files with `pnpm run db:sync:bible-sources`.
- Import canonical scripture corpus translations with `pnpm run db:import:bible-translations`.
- Optionally add/update sample data in `database/data.sql`.
- Rebuild local DB state with:

```sh
pnpm run db:import
```

Important:

- `db:import` is intentionally destructive for local rebuild workflows (drops and recreates schema).
- Do not run `db:import` against shared/staging/production databases.

## CI Workflow

PRs trigger `/.github/workflows/ci.yml`:

1. Install dependencies (`pnpm install --frozen-lockfile`)
2. Policy checks:
   - docs updates for app/config changes
   - DB migration updates for schema file changes
3. Lint (`pnpm run lint`)
4. Typecheck (`pnpm run tsc`)
5. Test (`pnpm run test`)
6. Build (`pnpm run build`)

This catches most integration issues before merge.

## PR Documentation Checklist

Before opening or merging a PR, verify:

- If code/config behavior changed, update at least one of:
  - `README.md`
  - relevant file(s) under `docs/`
- If scripts changed, update:
  - `README.md` scripts section
  - `docs/development-workflow.md` when workflow expectations changed
- If deployment/auth/config behavior changed, update relevant runbooks:
  - `docs/deployment/README.md`
  - `docs/deployment/auth0-setup.md`
  - `docs/configuration.md`
- Add/update `CHANGELOG.md` under `## [Unreleased]`.
- Append new session milestones to `docs/conversation-running-log.md` when this running-log process is active.

CI enforcement note:

- `/.github/workflows/ci.yml` includes a docs-policy gate that fails PRs if app/config files changed without updates to `README.md` or `docs/`.
- Keep these CI gates as hard blockers for merge readiness:
  - `docs-policy`
  - `db-migration-policy`
  - quality checks (`lint`, `tsc`, `test`, `build`)

## Deployment Workflow

- Primary lightweight path is Render + Neon (see `docs/deployment-render-neon.md`).
- Optional better-UX free-tier path is split hosting (see `docs/deployment-vercel-render.md`).
- Existing EC2 workflow remains branch-driven through pushes to `pub`.
- Reader comfort rollout can be staged with frontend flag:
  - `VITE_READER_COMFORT_ENABLED=true|false`
- Root deploy script for EC2 path:

```sh
pnpm run deploy
```

This pushes `main` to `pub`, triggering `/.github/workflows/main.yml`.

Hosted DB safety:

- Use `pnpm run db:migrate` and `pnpm run db:seed` in hosted environments for schema + starter app data.
- Run `pnpm run db:import:bible-translations` when corpus translations need initial load/refresh.
- Do not run `pnpm run db:import` on shared/staging/production databases.

Production verification:

```sh
DEPLOY_URL=https://your-service-url pnpm run smoke:deploy
```

Optional corpus diagnostics check:

```sh
curl -H "Authorization: Bearer <admin-token>" \
  https://your-service-url/api/admin/scripture-sources
```

### Reader Comfort Rollout Checklist

1. Deploy with `VITE_READER_COMFORT_ENABLED=false` (dark launch).
2. Validate telemetry event integrity locally/in-preview:
   - `reader_preference_changed`
   - `reader_preferences_reset`
   - `reader_break_tip_dismissed`
3. Confirm telemetry payloads are privacy-safe (no verse text or note content).
4. Enable `VITE_READER_COMFORT_ENABLED=true` in a controlled release window.
5. Run post-enable smoke checks:
   - Reader chapter load and chapter navigation
   - Settings persistence + reset
   - Return-to-support flow still works
6. Rollback path:
   - set `VITE_READER_COMFORT_ENABLED=false`
   - redeploy frontend
   - verify Reader route continues functioning with default experience

## Recommended Branching

- Create short-lived feature branches from `main`.
- Keep PRs focused on one area (UI/API/data/docs).
- Require CI to pass before merge.
- Update docs in `/docs` when behavior, scripts, or architecture change.
