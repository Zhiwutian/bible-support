# Development Workflow

## Local Development Loop

1. Pull latest changes.
2. If not using the devcontainer, run `nvm use` (Node 22 from `.nvmrc`).
3. Run `corepack enable` once per machine/session if needed.
4. Run `pnpm install` if dependencies changed.
5. Ensure PostgreSQL is running (`sudo service postgresql start`).
6. Run `pnpm run dev` for client + server watchers.
   - If you hit stale port/process issues, run `pnpm run dev:fresh` instead.
7. Make incremental changes.
8. Before commit, run:
   - `pnpm run lint`
   - `pnpm run tsc`
   - `pnpm run test`
   - `pnpm run build`
9. Optionally run `pnpm run test:coverage` to inspect coverage trends.
10. For quick feedback during active work, run `pnpm run test:changed`.

## Database Workflow

- Modify `database/schema.sql` for schema changes.
- Define/update typed Drizzle schema in `server/db/schema.ts`.
- Generate migrations with `pnpm run db:generate`.
- Commit generated migration files under `database/migrations/` with the schema change.
- Include a short rationale in your PR for why the schema change is needed.
- If a new/changed query pattern is introduced, evaluate indexes and note index decisions in the PR.
- Apply migrations with `pnpm run db:migrate`.
- Seed starter data with `pnpm run db:seed` (transactional + upsert-based; safe to rerun and can repair partial seed state).
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

## Deployment Workflow

- Primary lightweight path is Render + Neon (see `docs/deployment-render-neon.md`).
- Optional better-UX free-tier path is split hosting (see `docs/deployment-vercel-render.md`).
- Existing EC2 workflow remains branch-driven through pushes to `pub`.
- Root deploy script for EC2 path:

```sh
pnpm run deploy
```

This pushes `main` to `pub`, triggering `/.github/workflows/main.yml`.

Hosted DB safety:

- Use `pnpm run db:migrate` and `pnpm run db:seed` in hosted environments.
- Do not run `pnpm run db:import` on shared/staging/production databases.

Production verification:

```sh
DEPLOY_URL=https://your-service-url pnpm run smoke:deploy
```

## Recommended Branching

- Create short-lived feature branches from `main`.
- Keep PRs focused on one area (UI/API/data/docs).
- Require CI to pass before merge.
- Update docs in `/docs` when behavior, scripts, or architecture change.
