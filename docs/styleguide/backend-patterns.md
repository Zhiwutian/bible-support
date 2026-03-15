# Backend Patterns

## Route/Controller/Service Split

- Routes (`server/routes/*`): endpoint registration + middleware only.
- Controllers (`server/controllers/*`): parse params/body/query, validate input, map output.
- Services (`server/services/*`): business logic and DB interactions.

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
  - keep canonical book alias handling and translation-code normalization centralized in `server/lib/scripture-normalization.ts`.
  - avoid duplicating per-service alias maps or translation fallback parsing in scripture/reader/emotion services.

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
