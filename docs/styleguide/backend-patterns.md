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

## Auth Patterns

- Session auth context via `req.authUserId` set by `attachUserSession`.
- Admin session checks via `requireAdminSession` (DB role check each request).
- Bearer-token auth middleware exists for specific admin token routes.
- Auth controller/service responsibilities:
  - controller for flow handling and response semantics
  - service for OIDC exchange and account linkage

## Rate-Limit Pattern

- Read/write split on `/api`.
- Additional stricter write limiter on `/api/admin`.
- Keying precedence:
  - session user
  - explicit session header
  - device header
  - IP fallback

## Adding New API Endpoint (Checklist)

1. Define contract in `shared/`.
2. Add service function.
3. Add controller handler.
4. Wire in `server/routes/api.ts` with correct middleware.
5. Add route tests (`supertest`) and error-path assertions.
6. Update docs/changelog.
