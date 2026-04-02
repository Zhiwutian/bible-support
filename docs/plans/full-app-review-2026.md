# Full application review — progress (2026)

Living document for [docs/proposals/full-application-review.md](../proposals/full-application-review.md). Update as slices complete.

## Slice 1 — Baseline inventory and journey matrix (complete)

**Completed:** baseline API vs client parity, SPA route surface, journey matrix for manual / E2E passes.

### SPA routes (`client/src/App.tsx`, authenticated shell)

| Path                          | Page / purpose                |
| ----------------------------- | ----------------------------- |
| `/`                           | Support home (`EmotionsPage`) |
| `/emotions/:slug`             | Emotion scripture list        |
| `/emotions/:slug/context`     | Full context                  |
| `/search`                     | Bible search                  |
| `/reader`                     | Chapter reader                |
| `/verse`                      | Shared verse detail           |
| `/saved`                      | Saved scriptures index        |
| `/saved/:book`                | Saved by book                 |
| `/prayer-partners`            | Prayer partners hub           |
| `/prayer-partners/:partnerId` | Partner detail                |
| `/prayer-lists`               | Prayer lists hub              |
| `/prayer-lists/:listId`       | List detail                   |
| `/admin`                      | Admin (role-gated)            |
| `/tutorial`                   | Tutorial (MDX)                |
| `/about`                      | About                         |
| `/profile`                    | Profile                       |

Landing / unauthenticated shell also exposes `/verse` and catch-all → `LandingPage` (see `App.tsx` `shouldShowLanding`).

### API parity — server (`server/routes/api.ts`) vs client bundles

**Called from production client code** (feature `*-api.ts` and `scripture-search-api.ts`; excludes tests/MSW-only strings where duplicated):

| Area             | Server routes                                                                                             | Client modules                                                            |
| ---------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Auth             | `GET /auth/login`, `GET /auth/callback`, `GET\|POST /auth/logout`, `GET\|PATCH /auth/me`                  | `auth-api.ts` (me, login resolve, logout, patch me)                       |
| Support          | `GET /emotions`, `GET /emotions/:slug/scriptures`, `GET .../random`                                       | `emotion-api.ts`                                                          |
| Context / search | `GET /scripture-context`, `GET /scriptures/search`                                                        | `emotion-api.ts`, `scripture-search-api.ts`                               |
| Reader           | `GET /reader/chapter`, `GET\|PATCH\|DELETE /reader/state`                                                 | `scripture-search-api.ts`                                                 |
| Saved            | `GET\|POST .../saved-scriptures`, batch, chapter, grouped, `PATCH\|DELETE .../:savedId`, note             | `scripture-search-api.ts`                                                 |
| Prayer           | `GET /prayer/insights`, `PATCH /prayer/settings`; full CRUD under `/prayer-partners/*`, `/prayer-lists/*` | `prayer-insights-api.ts`, `prayer-partners-api.ts`, `prayer-lists-api.ts` |
| Admin            | `GET /admin/users`, `GET /admin/auth-events`, `PATCH /admin/users/:userId/role`                           | `admin-api.ts`                                                            |

**Server-only / non-SPA (expected):**

| Path                                | Purpose                                                   |
| ----------------------------------- | --------------------------------------------------------- |
| `GET /api/hello`                    | Smoke / debug                                             |
| `GET /api/health`, `GET /api/ready` | Infra probes                                              |
| `GET /api/admin/scripture-sources`  | Authenticated diagnostics (not wired in current admin UI) |

**Gap note:** `/api/admin/scripture-sources` is implemented and auth-wrapped but **not** referenced from `client/src` feature code. Optional follow-up: link from admin tools page or document as CLI/ops-only.

### Journey matrix (edge cases to exercise)

| Area        | Happy path                                              | Edge cases                                                                                                                |
| ----------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Auth**    | Login → `/api/auth/me` shows user; profile patch        | Session expiry; logout; unauthenticated access to gated routes (`/admin`, prayer routes); OIDC callback if enabled in env |
| **Support** | `/` → emotion → scriptures → context                    | Empty emotion; missing translation rows; `random` endpoint                                                                |
| **Search**  | Guided / reference / keyword → results → open reader    | Empty query; no results toast; invalid reference string                                                                   |
| **Reader**  | Book / chapter / translation; verse deep link; bookmark | Invalid `book`/`chapter` in URL; back/forward; multi-tab; reader state sync                                               |
| **Saved**   | List → chapter → note / delete / translation change     | Device id boundary; empty saved list; batch save                                                                          |
| **Prayer**  | Partners + lists CRUD, sessions, insights               | Archived filters; reorder members; reminder settings                                                                      |
| **Admin**   | Users list, auth events, role patch                     | Non-admin 403; pagination                                                                                                 |

Cross-cutting: slow/offline network, concurrent tabs, large JSON payloads.

---

## Slice 2 — Security / authz / IDOR (complete)

**Completed:** documented global session model, per-route access class, IDOR-relevant services, and follow-up findings.

### Global request model

- **`attachUserSession`** ([`server/lib/user-session-middleware.ts`](../../server/lib/user-session-middleware.ts)): runs on all `/api/*` traffic; sets `req.authUserId` from **session cookie** when present (no-op for anonymous).
- **Rate limits** ([`server/app.ts`](../../server/app.ts)): read/write limiters; key prefers `user:`, then `x-session-id`, then `x-device-id`, then IP.
- **Router-level middleware** ([`server/routes/api.ts`](../../server/routes/api.ts)):
  - `authMiddleware` (Bearer JWT, **401** if missing): only **`GET /api/admin/scripture-sources`**.
  - `requireAdminSession` (session user + DB role `admin`): **`GET/PATCH` admin users**, auth-events, role patch.

All other routes rely on **controller-level** checks (see below).

### API access class (summary)

| Class                     | Routes (representative)                                                                                                  | Enforcement                                                                                                                                                                                                           |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Public read**           | `GET /emotions*`, `GET /scripture-context`, `GET /scriptures/search`, `GET /reader/chapter`                              | No session required; scripture content only.                                                                                                                                                                          |
| **Auth redirects**        | `GET /auth/login`, `GET /auth/callback`, `GET\|POST /auth/logout`                                                        | OAuth/session flow; see `auth-controller`.                                                                                                                                                                            |
| **Session user**          | `GET\|PATCH /auth/me`, **`GET\|PATCH\|DELETE /reader/state`**, **all `/prayer/*`**, **admin** (except scripture-sources) | `requireSessionUserId` or `requireAdminSession`.                                                                                                                                                                      |
| **Session and/or device** | **Saved scriptures** (`/api/saved-scriptures*`)                                                                          | `getSessionUserId` + `readOptionalDeviceId`; **400** if neither; migrations merge device → user when both present ([`saved-scripture-controller`](../../server/controllers/scripture/saved-scripture-controller.ts)). |
| **Bearer admin (JWT)**    | `GET /api/admin/scripture-sources`                                                                                       | `authMiddleware`; distinct from session admin.                                                                                                                                                                        |

### IDOR and ownership

| Domain               | Assessment                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Saved scriptures** | Deletes/updates use `ownerScopeWhere(scope)` with `savedId` ([`saved-scripture-service`](../../server/services/saved-scripture-service.ts)) → **404** if id not in scope. Cross-user IDOR blocked for same scope type. **Guest/device:** anyone who knows a `x-device-id` can access that device’s rows — intentional; treat device id as a **secret** (document in client/threat model). |
| **Reader state**     | Keyed by **session user id** only; no device fallback ([`reader-state-controller`](../../server/controllers/scripture/reader-state-controller.ts)).                                                                                                                                                                                                                                       |
| **Prayer**           | `requireOwnedPartner` / `requireOwnedList` on nested ids ([`prayer-service`](../../server/services/prayer-service.ts)); controllers always pass `requireSessionUserId`.                                                                                                                                                                                                                   |

### XSS / HTML injection (spot check)

- No `dangerouslySetInnerHTML` in client feature code from path grep; tutorial uses MDX from repo-controlled sources.
- Saved **notes** are user text — confirm rendering path stays escaped (React default text nodes); flag if any rich-text path is added later.

### Cookies / OIDC (pointer)

- Session and OIDC behavior: [`docs/deployment/auth0-setup.md`](../deployment/auth0-setup.md), [`docs/configuration.md`](../configuration.md). No code change in this slice.

---

## Slice 3 — Backend queries / transactions / indexes (complete)

**Completed:** transaction inventory, alignment check with [docs/styleguide/database-constraints.md](../styleguide/database-constraints.md), and documented query-shape follow-ups (no schema changes in this slice).

### Drizzle transactions in use

| Location                                                                      | Purpose                                                                                                                 |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| [`saved-scripture-service`](../../server/services/saved-scripture-service.ts) | Batch create (single `saveGroupId` + rows); **device → user migration** (insert copies + delete device rows in one tx). |
| [`prayer-service`](../../server/services/prayer-service.ts)                   | Session logging and related writes (multiple call sites).                                                               |
| [`admin-service`](../../server/services/admin-service.ts)                     | Admin role change: **admin count / self-demotion safeguards** + `users` update in one transaction.                      |

**Partial-failure semantics:** saved batch returns all-or-nothing inside the transaction; clients should treat **409** / validation errors as non-retry without user action (already noted in prior inventory).

### Index / constraint alignment

- Hot paths for **`scripture_verses`** (reader chapter, search FTS, reference) and **saved scripture chapter scope** indexes match the matrix in [database-constraints.md](../styleguide/database-constraints.md).
- **Prayer** tables: reminder checks documented there; no new index gaps identified without `EXPLAIN` on production-sized data.

### Query patterns (observations)

| Area                                                                                         | Pattern                                                                                                                                             | Note                                                                                                                                                                                             |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Reader chapter** ([`reader-service`](../../server/services/reader-service.ts))             | Bounded set: aggregates for max chapter, verse list, prev/next in-book, optional **sequential** scans across `BIBLE_BOOKS` for cross-book prev/next | Indexed filters use `translation` + `book` + `chapter`; cross-book loops are worst-case O(books) small queries — acceptable at current scale; batch/cached stats would be a future optimization. |
| **Support emotions** ([`emotion-service`](../../server/services/emotion-service.ts))         | `readEmotionScripturesBySlug`: **`Promise.all`** over scripture rows, each may hit DB in `resolveScriptureVerseText`                                | **N DB round-trips per emotion list** (N = number of scriptures). Bounded by editorial content size; consider batched verse fetch if latency becomes visible.                                    |
| **Search** ([`scripture-search-service`](../../server/services/scripture-search-service.ts)) | Single ranked / filtered queries or local JSON path                                                                                                 | Aligns with GIN + btree notes in styleguide.                                                                                                                                                     |
| **Device migration**                                                                         | Per-row insert in loop inside one transaction                                                                                                       | Typical row count small; bulk `insert … select` would be a micro-optimization if migration volume grew.                                                                                          |

---

## Slice 4 — Frontend abstractions / perf (complete)

**Completed:** audited route code-splitting, API client layering, URL/session patterns, and data-loading / cancellation habits (no behavior changes in this slice).

### Routing and bundle

- **`App.tsx`** lazy-loads authenticated feature pages (`React.lazy` + `Suspense`) — Search, Reader, Saved, Prayer, Admin, Tutorial, About, etc.
- **`LandingPage`** and **`ProfilePage`** stay **eager** in the shell (small, always-needed for auth entry and profile).
- **`TutorialPage`** is a lazy **route**, but it **statically imports every MDX section** — the first open of `/tutorial` pulls one chunk containing all sections. Acceptable today; see **F6** if tutorial grows further.

### API and network

- Central **`fetchJson` / `fetchNoContent`** ([`client/src/lib/api-client.ts`](../../client/src/lib/api-client.ts)): `credentials: 'include'`, **`x-device-id`**, JSON envelope parsing, shared error text via [`api-error`](../../client/src/lib/api-error.ts).
- Feature modules ([`emotion-api`](../../client/src/features/emotions/emotion-api.ts), [`scripture-search-api`](../../client/src/features/search/scripture-search-api.ts), prayer/admin/auth APIs) are thin typed wrappers — **no duplicate fetch stacks**.

### State: URL vs local vs session

- Reader: [`useReaderChapterRouteState`](../../client/src/features/reader/useReaderChapterRouteState.ts) — URL is source of truth for deep links / back-forward; functional updates avoid sync loops (recent hardening).
- Search: [`route-session-state.ts`](../../client/src/lib/route-session-state.ts) + Zod schema for **sessionStorage** restore of mode/fields.

### Data loading and races

- No repo-wide **`useAbortableAsyncEffect`** helper (proposal text is aspirational). Pages use ad hoc **`useEffect` + async** patterns.
- **Reader** ([`BibleReaderPage`](../../client/src/pages/BibleReaderPage.tsx)): chapter `fetch` uses an **`isCancelled`** flag on unmount/param change; **saved-chapter** metadata uses **`AbortController`** + `signal` passed into `readSavedScripturesForChapter`. Good reference if extending cancellation elsewhere.
- Most other list/detail pages rely on **replace-on-complete** updates; low risk for typical navigation speed; optional future pass to align on `AbortController` where double-fetches cause visible flicker.

### Rendering / virtualization

- No list virtualization in tree; saved/prayer/admin lists are **bounded** by user data size. **No `useMemo` / `memo` audit** in this slice — defer until profiling.

---

## Slice 5 — A11y / telemetry / deps (pending)

---

## Slice 6 — Code + docs cleanup (pending)

---

## Slice 7 — CI / release hygiene (pending)

---

## Findings log (P0–P4)

| ID  | Sev | Area        | Finding                                                                                                                                                                                | Status |
| --- | --- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| F1  | P3  | Admin / API | `GET /api/admin/scripture-sources` not used from SPA                                                                                                                                   | Open   |
| F2  | P3  | Admin / API | Scripture diagnostics uses **Bearer JWT** (`authMiddleware`); other admin routes use **session + admin role**. Document for operators; align future admin UI or unify auth if desired. | Open   |
| F3  | P3  | Saved / UX  | Device-scoped saves rely on **secret `x-device-id`**; document threat model (lost device header ≈ access to guest saves).                                                              | Open   |
| F4  | P3  | Performance | `readEmotionScripturesBySlug` uses **N parallel verse resolutions** (potential N DB round-trips per emotion). OK for small editorial N; batch fetch if Support latency grows.          | Open   |
| F5  | P4  | Performance | Reader cross-book prev/next can run **sequential book scans** (rare). Defer unless `EXPLAIN` / profiling justifies caching or a single stats query.                                    | Open   |
| F6  | P4  | Bundle      | Tutorial route is lazy, but **`TutorialPage` imports all MDX sections statically** — first visit loads full tutorial JS. Consider per-section dynamic import if the guide grows large. | Open   |

_Add rows as review proceeds._
