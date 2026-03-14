# Code Patterns (Deep Scan)

This guide documents current architecture and coding patterns used across the project.

## Cross-Stack Conventions

- Shared API/domain contracts belong in `shared/*-contracts.ts`.
- API responses use envelope semantics:
  - success: `{ data, meta }`
  - failure: `{ error, meta }`
- Keep feature behavior test-backed when API/schema behavior changes.
- Use alias imports:
  - client: `@/`
  - server: `@server/`
  - shared: `@shared/`
- When auth/session payloads change, update both:
  - shared contracts (`shared/auth-contracts.ts`)
  - client bootstrap handling (`client/src/App.tsx`)

## Layering Rules

- Routes are registration-only (`server/routes/api.ts`).
- Controllers parse/validate request and map response.
- Services hold business rules + DB calls.
- DB schema and migration concerns live in:
  - `server/db/schema.ts`
  - `database/migrations/*`
  - `database/schema.sql`

## Extension Checklist

When adding a new endpoint:

1. Add/update shared contract in `shared/`.
2. Implement service logic in `server/services/`.
3. Add controller in `server/controllers/`.
4. Wire route in `server/routes/api.ts`.
5. Add/adjust route tests in `server/routes/*.test.ts`.
6. Update docs + changelog in the same PR.

When changing DB shape:

1. Update `server/db/schema.ts`.
2. Add migration SQL in `database/migrations/`.
3. Keep `database/schema.sql` in parity.
4. Update impacted services/contracts/tests/docs.

## Anti-Patterns To Avoid

- Do not put business logic in route files.
- Do not bypass `sendSuccess`/`sendError` envelope helpers.
- Do not bypass shared contracts with ad-hoc response shapes.
- Do not skip migration + schema parity for DB changes.
- Do not put server-only secrets in client env files (`VITE_*`).

## Feature Placement Guidance

- Route-level screens -> `client/src/pages/`
- Domain logic + API calls -> `client/src/features/<domain>/`
- Reusable primitives -> `client/src/components/ui/`
- App-shell reusable presentation blocks (brand lockups, menu header rows) -> `client/src/components/app/`
- Global UI state only -> `client/src/state/`
- Cross-cutting utilities -> `client/src/lib/`
- Backend domain services -> `server/services/`
- App-shell entry routes and nav orchestration -> `client/src/App.tsx`
- Authenticated profile UX -> `client/src/pages/ProfilePage.tsx` + `client/src/features/auth/auth-api.ts`
- Overlay menu grouping/label consistency -> `client/src/App.tsx` (`Navigation`, `Account`, `Display`; prefer `Support` terminology)
