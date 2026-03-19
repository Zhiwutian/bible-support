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

## Phase 4 — Observability & security _(complete)_

- **`docs/styleguide/backend-observability-security.md`**: logging redaction, rate-limit tuning, health/ready, security checklist.
- **`backend-patterns.md`**: links to observability doc; rate-limit env tunables called out.
- Route test: invalid **`sourceMode`** on POST saved scriptures → **`validation_error`**.

## Phase 5 — Documentation & hygiene _(complete)_

- Styleguides and **`CHANGELOG.md`** maintained alongside backend waves; optimization-run triggers in **`backend-patterns.md`**.

## Phase 6 — Platform, CI, ops & supply chain _(complete)_

- **CI parity table** in **`docs/development-workflow.md`** (lint/tsc/test/build vs `ci.yml`).
- **`.github/workflows/audit-scheduled.yml`**: weekly + `workflow_dispatch`, **`pnpm audit --audit-level high`** (advisory).
- **Transactions** note in development workflow (batch save + device migration).
- **Pool/timeouts**, **ops/health**, **seeds**: covered in **`development-workflow.md`** and **`backend-observability-security.md`**.

## Suggested execution order

1. Phase 0 + inventory (no behavior change).
2. Phase 1 validation modules + controller consistency.
3. Phase 2 services (driven by gap list).
4. Phase 3 DB (if drift or index gaps).
5. Phases 4–5 docs/tests/changelog.
6. Phase 6 in parallel after Phase 0 (CI/pool/runbook) or after Phase 3 for seed alignment.

## Out of scope (unless inventory proves otherwise)

- Replacing Drizzle or auth model, large API versioning.
