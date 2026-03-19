# Backend Patterns

## Route/Controller/Service Split

- Routes (`server/routes/*`): endpoint registration + middleware only.
- Controllers (`server/controllers/*`): parse params/body/query, validate input, map output.
- Services (`server/services/*`): business logic and DB interactions.

## Request validation (Zod)

- Prefer **`schema.parse()`** inside **`try/catch`** with **`next(err)`** so `ZodError` is normalized by `error-middleware` into `validation_error` with **`details` as `issues`** (stable across endpoints).
- Avoid mixing **`safeParse` + manual `sendError`** unless you need a custom error code/message; if you do, keep `details` shape aligned with Zod `issues` for client consistency.
- Shared HTTP parsing helpers and small Zod building blocks live under `server/lib/validation/` (for example `readOptionalDeviceId` for `x-device-id`, **`adminPaginationQuerySchema` + `normalizeAdminPaginationQuery`** for admin list query params).

## Async route handlers

- Use **`asyncHandler`** from `server/lib/async-handler.ts` (re-exported in `server/lib/index.ts`) to wrap `(req, res) => Promise<void>` handlers so rejections and thrown errors always reach **`next(err)`** without repeating `try/catch` per route.
- Optional **`onError`** hook for structured logging on failure paths (see saved-scripture batch / note handlers).

## Database constraints & index parity

- Maintain alignment between **Postgres checks**, **Drizzle schema**, **Zod**, and **`shared/*` contracts**. See **`docs/styleguide/database-constraints.md`** for the living matrix (translations, saved items, `scripture_verses`, auth audit, NOT VALID workflow).

## Post-merge optimization run (backend-heavy PRs)

After merges that touch several API layers, run a short pass (adjust thresholds to team taste):

- **Trigger examples**: 3+ files under `server/controllers/` or `server/services/`; any `database/migrations/*` or `server/db/schema.ts` change; auth/session changes.
- **Checklist**: grep for duplicate Zod fragments; confirm new mutations use transactions where needed; confirm `shared/*-contracts` + route tests updated; `pnpm run lint` / `pnpm run test:server` (or root `pnpm run test`); optional `pnpm audit` on dependency-heavy PRs.

**Planning artifact:** `docs/plans/backend-db-review.md` and living inventory `docs/plans/backend-db-review-inventory.md`.

## Request/Response Contracts

- Use `sendSuccess`/`sendError` from `server/lib/http-response.ts`.
- Throw `ClientError` for expected HTTP errors.
- Let error middleware normalize unknown/internal errors.
- Keep shared response shapes in `shared/*-contracts.ts`.
- For scripture surfaces, prefer returning both structured coordinates and backend-generated `displayText` so clients can render quickly while retaining precise data.

## Auth Patterns

- Session auth context via `req.authUserId` set by `attachUserSession`.
- Admin session checks via `requireAdminSession` (DB role check each request).
- Bearer-token auth middleware exists for specific admin token routes.
- Auth controller/service responsibilities:
  - controller for flow handling and response semantics
  - service for OIDC exchange and account linkage
- Auth audit vocabulary is defined once in `shared/auth-audit-contracts.ts` (`AUTH_AUDIT_EVENT_TYPES`, `AuthAuditEventType`, `AuthAuditOutcome`). The Postgres check on `auth_audit_events.eventType` must stay aligned (comment in `server/db/schema.ts` points to the shared module).
- Auth endpoint expectations:
  - `GET /api/auth/login` accepts optional `next` for safe return-path routing
  - `GET /api/auth/callback` keeps browser redirect semantics while preserving endpoint-level JSON errors for API clients
  - `PATCH /api/auth/me` is authenticated-session only and handles profile metadata updates (`displayName`, `avatarUrl`)
- Keep return-path normalization strict (root-relative, non-protocol, bounded length).
- Reader-state endpoint expectations:
  - `GET /api/reader/state`, `PATCH /api/reader/state`, `DELETE /api/reader/state` require authenticated session scope.
  - normalize partial/legacy stored preference payloads defensively instead of failing reads.
  - keep reader-preferences validation/normalization centralized in `server/lib/reader-state-preferences.ts` so controller/service layers stay in sync.
- Scripture normalization expectations:
  - keep canonical book alias handling and translation-code normalization centralized in `server/lib/scripture-normalization.ts` (including **`parsePersistedScriptureTranslation`**, **`normalizeReaderBookmarkFields`** for reader state bookmarks).
  - avoid duplicating per-service alias maps or translation fallback parsing in scripture/reader/emotion services.
  - persisted saved-scripture rows should store **canonical** book names from `canonicalizeBibleBookName` on write; chapter queries use the same normalization.
  - emotion translation fallback order should derive from **`SUPPORTED_SCRIPTURE_TRANSLATIONS`** so new translations stay aligned.
  - map `scripture_verses` rows to API payloads with **`mapScriptureVerseRow`** in `server/lib/scripture-verse-row.ts` (reader chapter + scripture search local DB path).

## Rate-Limit Pattern

- Read/write split on `/api`.
- Additional stricter write limiter on `/api/admin`.
- Keying precedence:
  - session user
  - explicit session header
  - device header
  - IP fallback

## Reader + Saved Observability Pattern

- Time high-latency read endpoints in controllers (for example, chapter-reader responses).
- Emit lightweight structured logs for:
  - batch save size + ownership scope context,
  - reader success/failure + `durationMs`,
  - note patch failures.
- For frequent UI write patterns (bookmark/scroll updates), protect APIs with debounce-friendly idempotent updates and unchanged-payload short-circuiting in service/controller layers where practical.
- Never log sensitive request bodies (for example, full note text, auth tokens).

## Adding New API Endpoint (Checklist)

1. Define contract in `shared/`.
2. Add service function.
3. Add controller handler.
4. Wire in `server/routes/api.ts` with correct middleware.
5. Add route tests (`supertest`) and error-path assertions.
6. Add basic observability events on critical mutation/read paths.
7. Update docs/changelog.
