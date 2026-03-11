# Changelog

All notable changes to this template are documented in this file.

The format is inspired by Keep a Changelog and uses semantic-style version sections for template milestones.

## [Unreleased]

### Added

- Added full-bible JSON import script:
  - `pnpm run db:import:bible-json` (defaults to public-domain KJV JSON source)
  - `server/scripts/import-bible-json.ts` with URL/file override support and idempotent translation refresh.
- Added verse search and save feature foundation:
  - three-mode search support (`guided`, `reference`, `keyword`) with a new Search page
  - anonymous device-scoped saved scripture collection with a new Saved page
  - global accessibility controls for larger text and high-contrast mode
- Added backend scripture search/saved APIs:
  - `GET /api/scriptures/search`
  - `GET /api/saved-scriptures`
  - `POST /api/saved-scriptures`
  - `PATCH /api/saved-scriptures/:savedId`
  - `DELETE /api/saved-scriptures/:savedId`
- Added scripture source diagnostics endpoint:
  - `GET /api/admin/scripture-sources` for DB/local translation status and fallback readiness.
- Added new DB entities and migration for searchable verse corpus + saved references:
  - `scripture_verses`
  - `saved_scripture_items`
  - `database/migrations/0005_brisk_search_and_saved_scriptures.sql`
- Added shared contracts/utilities:
  - `shared/scripture-search-contracts.ts`
  - `shared/bible-books.ts`
- Added implementation documentation: `docs/verse-search-save.md`.
- Added deployment documentation hub `docs/deployment/README.md` with links to per-service account setup guides.
- Added service onboarding guides:
  - `docs/deployment/neon-account-setup.md`
  - `docs/deployment/render-account-setup.md`
  - `docs/deployment/vercel-account-setup.md`
- Added split-hosting guide `docs/deployment-vercel-render.md` for Vercel frontend + Render API + Neon DB deployment.
- Added frontend `VITE_API_BASE_URL` support via `client/src/lib/api-base-url.ts` to enable separate frontend/backend hosts without endpoint rewrites.
- Added `client/vercel.json` SPA rewrite config and `client/.env.example` for frontend deployment environment setup.
- Added Render Blueprint config at `render.yaml` for low-friction Node 22 web service deployment on free tier.
- Added Render+Neon deployment runbook at `docs/deployment-render-neon.md` with env, bootstrap, and smoke-test guidance.
- Added deployment smoke-test script `pnpm run smoke:deploy` (`scripts/smoke-deploy.mjs`) for `/`, `/api/health`, emotion/scripture, and context checks against a deployed URL.
- Added full emotion-scripture application baseline as default template experience:
  - emotion tile landing page
  - scripture viewer with fixed-order looping navigation
  - full-context route and chapter-reading actions
- Added shared frontend API client utilities in `client/src/lib/api-client.ts` to reduce duplicate fetch/error-envelope handling.
- Added scripture link helper module in `client/src/features/emotions/scripture-links.ts` for shared chapter parsing + BibleGateway URL building.
- Added backend graceful shutdown handling in `server/server.ts` with HTTP server close + DB pool close sequence.
- Added DB safety constraints/indexes:
  - lowercase slug check on `emotions.slug`
  - positive display-order check on `scriptures.displayOrder`
  - index on `scriptures.reference`
- Added transactional, advisory-lock protected seed behavior with upsert semantics in `server/scripts/seed.ts`.
- Added scripture-context API support for stable `scriptureId` lookup, with legacy `reference` compatibility.
- Added conversation running log at `docs/conversation-running-log.md`.
- Established backend layering with concrete examples:
  - `server/app.ts` for app composition
  - `server/routes/api.ts` for route modules
  - `server/controllers/system/hello-controller.ts`
  - `server/controllers/health/health-controller.ts`
  - `server/services/health-service.ts`
  - `server/db/pool.ts`
- Added `GET /api/health` endpoint demonstrating route -> controller -> service -> db flow.
- Added project documentation set under `docs/`:
  - `docs/README.md`
  - `docs/architecture.md`
  - `docs/project-structure.md`
  - `docs/development-workflow.md`
  - `docs/templates/feature-doc-template.md`
- Added CI workflow `/.github/workflows/ci.yml` for pull requests and manual runs.
- Added PR template `/.github/pull_request_template.md` with testing + documentation checklists.
- Added docs-policy CI gate requiring docs updates when application/config files change.
- Added pnpm workspace file: `pnpm-workspace.yaml`.
- Added pnpm lockfile: `pnpm-lock.yaml`.
- Added full test scaffolding with Vitest across frontend and backend.
- Added frontend unit test setup (`client/src/test/setup.ts`) and sample component test (`client/src/App.test.tsx`).
- Added MSW-based frontend API mock pattern (`client/src/test/handlers.ts`, `client/src/test/server.ts`).
- Added backend sample tests:
  - `server/services/health-service.test.ts` (service unit tests with mocked db layer)
  - `server/routes/api.test.ts` (API route tests via Supertest)
- Added `pnpm run test:changed` for fast local feedback by running only tests related to changed files.
- Added runtime pinning with `.nvmrc` and `engines` in root `package.json`.
- Added server environment validation module (`server/config/env.ts`) using `zod`.
- Added structured logging via `pino` and request logging via `pino-http`.
- Added Drizzle ORM + Drizzle Kit integration with schema/migration scaffolding.
- Added example Drizzle-backed CRUD endpoints for todos (`/api/todos`).
- Added idempotent database seed flow (`pnpm run db:seed`) and starter todo data.

### Changed

- Updated scripture search fallback normalization to keep canonical translation codes (`KJV`/`ASV`/`WEB`) across local and remote results.
- Updated accessibility controls to `Small`/`Medium`/`Large`/`XL`, plus mobile display-settings modal cancel rollback semantics for both text-size and high-contrast values.
- Updated admin diagnostics route protection so `/api/admin/scripture-sources` now requires bearer authentication.
- Updated route-level test coverage for scripture search/saved CRUD + translation patch + diagnostics authorization.
- Updated DB schema parity by aligning Drizzle schema checks/indexes with SQL/migration constraints and adding saved-items listing sort index support.
- Updated modal implementation consistency by introducing shared UI modal shell primitives and reusing them across display/translation/confirm dialogs.
- Updated seed behavior to avoid writing seeded emotion verses into `scripture_verses`, preventing corpus translation drift.
- Updated search UI translation options to include `ASV` and use shared supported-translation constants.
- Updated saved-verse dedupe behavior in search UI to match backend uniqueness tuple semantics (translation/book/chapter/range).
- Updated shared contracts with canonical scripture translation constants and shared diagnostics response types.
- Updated docs/runbooks to include translation sync/import workflow and scripture diagnostics verification steps.
- Updated deployment docs to include split-hosting CORS guidance for separate frontend and API origins.
- Updated EC2 deploy workflow to run non-destructive hosted DB bootstrap (`pnpm run db:migrate` + `pnpm run db:seed`) instead of `db:import`.
- Updated README and docs workflow/structure content to include lightweight free-tier deployment guidance and post-deploy verification.
- Updated frontend scripture/context flow to use a single scripture list request and `scriptureId` for context fetches.
- Updated frontend async data-loading patterns with cancellation guards to avoid stale state writes after route changes.
- Updated emotion-page retry action to in-page refetch instead of full-page reload.
- Updated Toast provider lifecycle to clear pending timers on unmount.
- Updated server auth middleware to strict bearer-token parsing behavior.
- Updated read/write rate-limit middleware behavior to avoid write requests consuming read budget.
- Updated DB pool SSL configuration to environment-driven toggles (`DB_SSL`, `DB_SSL_REJECT_UNAUTHORIZED`).
- Updated docs to reflect preferred `scriptureId` context contract, transactional seed semantics, and DB workflow safety notes.
- Upgraded development environment:
  - Devcontainer uses Node 22 via feature (`ghcr.io/devcontainers/features/node:1`).
  - Devcontainer uses persistent bind mount to `/workspace` from local folder.
- Migrated package management from npm to pnpm:
  - Added `packageManager` in root `package.json`.
  - Converted root scripts to `pnpm` commands.
  - Updated Husky pre-commit to `pnpm exec lint-staged`.
  - Updated CI and deploy workflows to use pnpm setup/install/run.
  - Updated docs and README commands from npm to pnpm.
- Hardened CI/CD and project workflow:
  - Deploy workflow updated to `actions/checkout@v4`.
  - Deploy script changed from force push to normal push (`git push origin main:pub`).
  - Added docs-policy + quality checks in CI pipeline.
- Upgraded major runtime/tooling stacks:
  - React 19 + Vite 7 (`client`)
  - Express 5 (`server`)
  - Node 22 (devcontainer/CI)
  - TypeScript/ESLint ecosystem refresh across root + client
  - Husky v9-compatible prepare/hook behavior
- Refactored server startup into bootstrap/app composition split:
  - `server.ts` now focuses on process startup.
  - `app.ts` handles middleware/routes/static/error wiring.
- Updated Express fallback route for Express 5 compatibility:
  - from `*` to `/{*path}`.
- Updated README to match current stack, setup, CI, docs-policy, and pnpm workflows.
- Updated CI to run tests (`pnpm run test`) alongside lint, typecheck, and build.
- Added minimum coverage thresholds in Vitest configs for frontend and backend.

### Fixed

- Resolved empty workspace issue in devcontainer by introducing explicit workspace bind mount.
- Fixed GitHub Actions failure (`Unable to locate executable file: pnpm`) by adding `pnpm/action-setup` before `actions/setup-node`.
- Removed Husky deprecation warning source by deleting deprecated `/.husky/_/husky.sh` and modernizing hook usage.

### Removed

- Removed npm lockfiles:
  - `package-lock.json`
  - `client/package-lock.json`
  - `server/package-lock.json`

## [2.0.0] - Template Baseline

### Added

- Initial full-stack TypeScript template structure with:
  - React client (`client`)
  - Express server (`server`)
  - PostgreSQL scripts (`database`)
  - deployment workflow scaffold
