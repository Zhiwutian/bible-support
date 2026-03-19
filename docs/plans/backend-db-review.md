# Backend & database hardening plan

Mirrors the active Cursor plan for backend/DB work. Update this file when phases complete or scope changes.

## Goals

- **Align server with shipped behavior**: every route in `server/routes/api.ts` maps to real client usage; dead paths are removed or explicitly marked.
- **DRY + consistency**: one style for validation, auth/scope resolution, and scripture coordinates across reader, saved scriptures, search, and context.
- **Safer DB evolution**: Drizzle schema, SQL migrations, and runtime stay in sync; constraints and indexes match query patterns.
- **Docs**: extend `docs/styleguide/backend-patterns.md` with post-merge optimization triggers (aligned with the frontend styleguide).

## Phase 0 — Inventory (read-only baseline)

- **API surface map**: method + path → controller → service(s) → primary tables.
- **Client ↔ server contract audit**: client fetch usage vs `shared/*-contracts.ts` and error envelopes (`server/lib/error-middleware.ts`, `server/lib/http-response.ts`).
- **Config/env review**: `server/config/env.ts` vs deployment (CORS, rate limits, secrets, DB URL).

**Exit criteria:** gap list in `docs/plans/backend-db-review-inventory.md`.

## Phase 1 — Validation & controller ergonomics

- Unify on **Zod `parse()`** with **`asyncHandler`** (or explicit **`try/catch` + `next(err)`**) so `ZodError` flows through `error-middleware` with consistent `details` (`issues`).
- **`asyncHandler`**: `server/lib/async-handler.ts` (re-exported from `server/lib/index.ts`); used by admin, saved-scripture, emotion, and reader-state controllers.
- Central Zod helpers under `server/lib/validation/` (device id, admin pagination; future scripture coords).

**Guardrail:** shared types stay in `shared/`; HTTP-only parsing stays in `server/`.

## Phase 2 — Service layer & domain boundaries _(complete)_

- Reader vs reader-state services: shared bookmark/normalization via `server/lib/scripture-normalization.ts` (`parsePersistedScriptureTranslation`, `normalizeReaderBookmarkFields`, book canonicalization on read/write).
- Saved scriptures: canonical book on create + chapter reads; translation via `normalizeScriptureTranslationCode`.
- Emotion service: translation fallback list stays in sync with `SUPPORTED_SCRIPTURE_TRANSLATIONS`.
- Auth audit: `shared/auth-audit-contracts.ts` is the single vocabulary for `eventType` / `outcome`; Drizzle schema check documented to match; `auth-audit-service` and `admin-contracts` consume it.
- Scripture verse rows: `server/lib/scripture-verse-row.ts` (`mapScriptureVerseRow`) shared by reader chapter + scripture search (local DB results).

## Phase 3 — Database & migrations _(complete)_

- `reader_state` bookmark translation check documented to match `SUPPORTED_SCRIPTURE_TRANSLATIONS`; `0015` validates prior `NOT VALID` checks.
- Zod `sourceMode` aligned with DB (`z.enum(['local','remote'])`); parity table in `docs/styleguide/database-constraints.md`.
- Partial indexes on `saved_scripture_items` for chapter-scoped lists (`0016`); `scripture_verses` index/query notes documented.
- Playbook: `docs/development-workflow.md` (schema change subsection) + `database-constraints.md` + `database-patterns.md` cross-link.

## Phase 4 — Observability & security (lightweight)

- Logging: no note bodies / tokens (styleguide).
- Rate limits: document when to raise write caps for new features.
- Route tests for changed validation paths.

## Phase 5 — Documentation & hygiene

- `docs/styleguide/backend-patterns.md`: validation strategy, validation module locations, DB enum alignment rule, backend optimization-run triggers.
- `CHANGELOG.md` for the wave.

## Phase 6 — Platform, CI, ops & supply chain

- **CI parity**: root scripts match `.github/workflows/ci.yml` (lint, tsc, test, build); migration policy job for schema edits.
- **Transaction boundaries**: document multi-step mutations; use transactions where user-visible partial failure matters (batch save and device→user migration are already transactional).
- **Pool & timeouts**: `server/db/pool.ts` + optional `PG_POOL_MAX` (see `server/.env.example` and `docs/development-workflow.md`).
- **Seeds/scripts**: keep `server/scripts/seed*.ts` aligned with `server/db/schema.ts`.
- **Ops runbook**: health/ready endpoints, migrations, incident first steps (`docs/development-workflow.md`).
- **Security checklist**: Helmet/CORS/sessions, admin auth, logging rules.
- **Supply chain**: periodic `pnpm audit`; review majors on auth/DB PRs.

## Suggested execution order

1. Phase 0 + inventory (no behavior change).
2. Phase 1 validation modules + controller consistency.
3. Phase 2 services (driven by gap list).
4. Phase 3 DB (if drift or index gaps).
5. Phases 4–5 docs/tests/changelog.
6. Phase 6 in parallel after Phase 0 (CI/pool/runbook) or after Phase 3 for seed alignment.

## Out of scope (unless inventory proves otherwise)

- Replacing Drizzle or auth model, large API versioning.
