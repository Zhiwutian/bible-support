# Changelog

All notable changes to this template are documented in this file.

The format is inspired by Keep a Changelog and uses semantic-style version sections for template milestones.

## [Unreleased]

### Added

- Added dedicated styleguide documentation directory `docs/styleguide/` with deeper implementation guides:
  - `docs/styleguide/ui-styleguide.md`
  - `docs/styleguide/code-patterns.md`
  - `docs/styleguide/frontend-patterns.md`
  - `docs/styleguide/backend-patterns.md`
  - `docs/styleguide/database-patterns.md`
- Added auth/admin expansion foundation:
  - `users` role/profile columns (`role`, `displayName`, `avatarUrl`) with constraints
  - `auth_audit_events` table with event/outcome checks and operability indexes
  - migration `database/migrations/0010_auth_roles_profiles_audit.sql`
- Added admin APIs and contracts:
  - `GET /api/admin/users`
  - `PATCH /api/admin/users/:userId/role`
  - `GET /api/admin/auth-events`
  - `shared/admin-contracts.ts`
- Added minimal admin UI route/page (`/admin`) with user-role management and recent auth event visibility.
- Added admin/session route tests in `server/routes/admin-api.test.ts`.
- Added focused Cursor rule files and rule tracking docs:
  - `.cursor/rules/style-enforcement-frontend.mdc`
  - `.cursor/rules/backend-api-boundaries.mdc`
  - `docs/rules-usage-guide.md`
  - `docs/rules-registry.md` updates for new rule entries
- Added split env-file workflow tooling for local setup:
  - `pnpm run setup:env`
  - `pnpm run setup:env:force`
  - `pnpm run validate:env`
  - `scripts/validate-env-files.mjs` for required key checks and auth-gated validation.
- Added configuration/style documentation:
  - `docs/configuration.md`
  - `docs/styleguide/ui-styleguide.md`
- Added Auth0 troubleshooting guidance for issuer discovery and application-authentication mode in:
  - `docs/deployment/auth0-setup.md`
  - `docs/deployment/README.md`
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
- Added unauthenticated landing experience with explicit entry options:
  - `Continue with Google`
  - `Continue as Guest`
- Added authenticated profile editing surface (`/profile`) with live avatar preview and field-level validation.
- Added lightweight client telemetry event hook utility at `client/src/lib/telemetry.ts`.
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

- Updated social login flow to modal-driven provider selection from the app shell.
- Updated app-shell navigation for desktop with left-side patterns:
  - overlay drawer on `md`/`lg`
  - pinned collapsible sidebar on `xl+`
- Updated global text scaling baseline so prior larger sizing maps to the new `Small` floor, with `Medium`/`Large`/`XL` scaled upward.
- Updated shell branding/title usage to `Scripture & Solace`.
- Updated auth login flow to preserve an optional route intent (`next`) through callback redirect markers.
- Updated auth API surface with `PATCH /api/auth/me` for editable profile metadata.
- Updated auth provider behavior to env-gated Facebook enablement via `AUTH_SOCIAL_FACEBOOK_ENABLED` (default `false`) while keeping Google enabled.
- Updated `/api/auth/me` to include `enabledSocialProviders` for client-side provider rendering.
- Updated styleguide references from single-file path (`docs/styleguide.md`) to directory-based docs under `docs/styleguide/`.
- Updated client document title and favicon to Bible Support branding, including new glowing Bible logo asset.
- Updated social login selector to support env-gated Facebook enablement via `AUTH_SOCIAL_FACEBOOK_ENABLED` (default `false`); Google remains enabled by default.
- Updated auth callback/account linkage to support `user_wins` profile metadata population (set provider `displayName`/`avatarUrl` only when local fields are null).
- Updated `/api/auth/me` payload contract to include role and optional profile metadata.
- Updated rate-limit identity keying to prefer authenticated user id with stable session/device/ip fallback and stricter admin-write throttling.
- Updated admin role enforcement to evaluate current DB role per request (immediate role-change propagation).
- Updated deployment/auth docs with first-admin grant, rollback, verify, and break-glass SQL runbook guidance.
- Updated Cursor rules activation strategy to keep only pre-commit/release gates always-on and scope domain-specific rules via file globs.
- Updated rules/process docs to explicitly defer pre-commit/release check execution while in planning mode, with checks run only in execution mode.
- Updated client lint policy to enforce alias-first cross-folder imports using `@/` (disallow deep parent-relative import patterns).
- Updated development workflow docs to treat CI docs/migration/quality jobs as hard merge gates.
- Updated auth login endpoint to return explicit endpoint-level auth failures (`sendAuthFailure`) instead of generic middleware error responses.
- Updated environment boolean parsing to correctly handle string values like `false`/`0` for `AUTH_ENABLED`, `DB_SSL`, and `DB_SSL_REJECT_UNAUTHORIZED`.
- Updated Express proxy trust configuration to one-hop mode (`trust proxy = 1`) for Render compatibility and correct callback protocol handling.
- Updated scripture search fallback normalization to keep canonical translation codes (`KJV`/`ASV`/`WEB`) across local and remote results.
- Updated accessibility controls to `Small`/`Medium`/`Large`/`XL`, plus mobile display-settings modal cancel rollback semantics for both text-size and high-contrast values.
- Updated admin diagnostics route protection so `/api/admin/scripture-sources` now requires bearer authentication.
- Updated route-level test coverage for scripture search/saved CRUD + translation patch + diagnostics authorization.
- Updated DB schema parity by aligning Drizzle schema checks/indexes with SQL/migration constraints and adding saved-items listing sort index support.
- Updated modal implementation consistency by introducing shared UI modal shell primitives and reusing them across display/translation/confirm dialogs.
- Updated auth callback semantics to return endpoint-level JSON errors for API clients while preserving browser redirect UX markers (`auth`, `reason`, `message`).
- Updated provider-declined callback handling to preserve existing app session (clear login-state cookie only).
- Updated logout UX to keep signed-in state when logout API fails and surface explicit error toast feedback.
- Added dedicated Auth0 setup guide and expanded deployment docs with auth environment variables, including `AUTH_LOGIN_REDIRECT_URI`.
- Updated saved-scripture uniqueness semantics so anonymous saves are constrained by device only when `ownerUserId is null`, while authenticated saves remain constrained by owner scope.
- Updated save-route ownership resolution so authenticated requests can operate without `x-device-id`, and migration bridge now runs consistently across read/create/update/delete flows when device id is present.
- Updated callback request logging to avoid leaking auth query payload on `/api/auth/callback`.
- Updated auth routes to include `GET /api/auth/logout` for browser redirect flows using `AUTH_LOGOUT_REDIRECT_URI`.
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
