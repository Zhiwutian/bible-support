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

## Slice 2 — Security / authz / IDOR (pending)

_Placeholder: route-by-route auth matrix, cookie/OIDC notes, XSS/telemetry inventory per proposal §8._

---

## Slice 3 — Backend queries / transactions (pending)

---

## Slice 4 — Frontend abstractions / perf (pending)

---

## Slice 5 — A11y / telemetry / deps (pending)

---

## Slice 6 — Code + docs cleanup (pending)

---

## Slice 7 — CI / release hygiene (pending)

---

## Findings log (P0–P3)

| ID  | Sev | Area        | Finding                                              | Status |
| --- | --- | ----------- | ---------------------------------------------------- | ------ |
| F1  | P3  | Admin / API | `GET /api/admin/scripture-sources` not used from SPA | Open   |

_Add rows as review proceeds._
