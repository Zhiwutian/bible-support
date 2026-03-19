# Backend / DB review — Phase 0 inventory

Living document: update as phases complete. Last reviewed: backend hardening wave start.

## API surface (server → primary persistence)

| Method                | Path                                           | Controller                         | Service(s)                      | Tables / notes                                |
| --------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------- | --------------------------------------------- |
| GET                   | `/api/hello`                                   | `hello-controller`                 | —                               | None                                          |
| GET                   | `/api/health`                                  | `health-controller`                | `health-service`                | DB probe if configured                        |
| GET                   | `/api/ready`                                   | `health-controller`                | `health-service`                | Readiness                                     |
| GET                   | `/api/auth/login`                              | `auth-controller`                  | `auth-service`                  | Redirect / OIDC                               |
| GET                   | `/api/auth/callback`                           | `auth-controller`                  | `auth-service`                  | `users`, `auth_accounts`, `auth_audit_events` |
| GET/POST              | `/api/auth/logout`                             | `auth-controller`                  | `auth-service`                  | Session clear                                 |
| GET/PATCH             | `/api/auth/me`                                 | `auth-controller`                  | `auth-service`                  | `users`                                       |
| GET                   | `/api/admin/scripture-sources`                 | `scripture-diagnostics-controller` | `scripture-diagnostics-service` | `scripture_verses` stats                      |
| GET/PATCH             | `/api/admin/users`, `/api/admin/auth-events`   | `admin-controller`                 | `admin-service`                 | `users`, `auth_audit_events`                  |
| GET                   | `/api/emotions`                                | `emotion-controller`               | `emotion-service`               | `emotions`                                    |
| GET                   | `/api/emotions/:slug/scriptures` (+ `/random`) | `emotion-controller`               | `emotion-service`               | `scriptures`                                  |
| GET                   | `/api/scripture-context`                       | `scripture-context-controller`     | `scripture-context-service`     | `scripture_verses`                            |
| GET                   | `/api/scriptures/search`                       | `scripture-search-controller`      | `scripture-search-service`      | `scripture_verses` (FTS)                      |
| GET                   | `/api/reader/chapter`                          | `reader-controller`                | `reader-service`                | `scripture_verses`                            |
| GET/PATCH/DELETE      | `/api/reader/state`                            | `reader-state-controller`          | `reader-state-service`          | `reader_state`                                |
| GET/POST/PATCH/DELETE | `/api/saved-scriptures/*`                      | `saved-scripture-controller`       | `saved-scripture-service`       | `saved_scripture_items`                       |

## Client usage vs API (SPA)

The React app calls (via `fetchJson` / `fetchNoContent` and MSW handlers):

- `/api/auth/*` (me, login URL, logout, patch profile)
- `/api/emotions`, `/api/emotions/:slug/scriptures`, `/api/emotions/:slug/scriptures/random`
- `/api/scripture-context`, `/api/scriptures/search`
- `/api/reader/chapter`, `/api/reader/state` (GET/PATCH/DELETE)
- `/api/saved-scriptures` (list, grouped, chapter, POST, batch, PATCH translation, PATCH note, DELETE)
- `/api/admin/*` (admin UI)

**Not referenced from client bundles (by path grep):**

- `/api/hello` — useful smoke/debug; keep or document as non-essential.
- `/api/health`, `/api/ready` — infra/load balancers; expected.

## Gap list (initial)

1. **Validation style**: `reader-state-controller` uses `parse()` + `asyncHandler` so `ZodError` flows through error middleware (`issues`).
2. **Repeated patterns**: `x-device-id` → `server/lib/validation/device-id.ts`. Admin pagination query → `server/lib/validation/pagination.ts` with `normalizeAdminPaginationQuery`.
3. **Async ergonomics**: `asyncHandler` in `server/lib/async-handler.ts` wraps async controllers (saved scriptures, emotions, reader state, admin) so `next(err)` is consistent.
4. **Reader bookmark translations**: `SUPPORTED_SCRIPTURE_TRANSLATIONS` in `shared/scripture-search-contracts.ts` is `KJV | ASV | WEB`, matching the DB check on `reader_state.bookmarkTranslation` — **no enum drift** at time of inventory.
5. **Transactions**: `createSavedScriptureBatch` and `migrateDeviceSavedScripturesToUser` already use `db.transaction()`. Document partial-failure semantics for clients (retries) in styleguide/workflow.
6. **CI parity**: `.github/workflows/ci.yml` `quality` job runs `pnpm run lint`, `pnpm run tsc`, `pnpm run test`, `pnpm run build` — matches root `package.json` and `docs/development-workflow.md`.
7. **Connection pool**: previously default `pg.Pool` only; optional `PG_POOL_MAX` + documented idle/connection timeouts added in Phase 6 slice.

## Phase 3 progress _(complete)_

- Migrations **`0015_validate_reader_saved_check_constraints`** (VALIDATE prior NOT VALID checks) and **`0016_saved_scripture_chapter_scope_indexes`** (partial indexes for chapter listing).
- **`docs/styleguide/database-constraints.md`**: parity matrix + `scripture_verses` query/index notes.
- **`docs/development-workflow.md`**: schema change playbook subsection.
- **`database/schema.sql`** and **`server/db/schema.ts`** updated for new indexes and comments.
- Shared **`SavedScriptureSourceMode`**; Zod + client `toSavePayload` aligned.

## Phases 4–6 _(complete)_

- Observability/security styleguide, CI parity table, scheduled audit workflow, saved-scripture `sourceMode` validation route test.

## Follow-ups (optional)

- Expand route tests when new Zod surfaces ship; tune audit job severity if noise is too high or low.

## Phase 2 progress _(complete)_

- Reader state: bookmarks use `parsePersistedScriptureTranslation` + `canonicalizeBibleBookName` on read; `normalizeReaderBookmarkFields` on patch (400 on invalid book).
- Saved scriptures: create + chapter listing use canonical book + `normalizeScriptureTranslationCode`.
- Emotion service: `translationFallbackOrder` copies `SUPPORTED_SCRIPTURE_TRANSLATIONS`.
- Auth audit: `shared/auth-audit-contracts.ts` + schema comment; admin list typing uses shared `AuthAuditEventType` / `AuthAuditOutcome`.
- Reader + search: `mapScriptureVerseRow` in `server/lib/scripture-verse-row.ts` for local `scripture_verses` rows.
