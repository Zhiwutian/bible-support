# Verse Search and Save

This document describes the implemented search/save expansion for fast scripture lookup and simple anonymous collections.

## Search Modes

- Guided picker
  - Inputs: `book`, `chapter`, optional `verseStart`, optional `verseEnd`
  - Chapter input accepts temporary empty state (no search until chapter is re-entered).
  - Chapter values are constrained to the selected book's maximum chapter count.
  - Best for clarity and low cognitive load.
- Reference input
  - Inputs: free text like `John 3`, `John 3:16`, `John 3:16-18`
  - Best for users who know scripture references.
- Keyword search
  - Inputs: free text like `peace`, `anxiety`, `comfort`
  - Best for discovery when users do not know the exact reference.

## Saved Collection Scope

- Anonymous device-scoped saves are supported.
- Authenticated user-scoped saves are also supported.
- Client sends stable `x-device-id` header for anonymous save scope and migration bridge behavior.

### Guest `x-device-id` (threat model)

- The browser generates and stores a **device id** and sends it on API requests (see `client/src/lib/device-id.ts` and `client/src/lib/api-client.ts`). For **anonymous** users, saved scriptures are scoped to that identifier **on the server**.
- **Treat the device id like a secret for guest data:** any client that presents the **same** `x-device-id` can access the same guest save collection (read/write within normal API rules). Shared computers, browser extensions, or copied storage could widen exposure.
- **Mitigation:** Sign in for **account-scoped** ownership; use guest mode only when that tradeoff is acceptable. Product copy and support docs can describe “guest saves stay on this browser” without exposing implementation details.
- When authenticated via cookie session, saved-scripture routes can resolve user scope without requiring `x-device-id`.
- Backend stores reference/query metadata, not full user-auth profile data.
- Saved-item uniqueness is ownership-aware:
  - authenticated: `ownerUserId + translation + book + chapter + verseStart + verseEnd`
  - anonymous: `deviceId + translation + book + chapter + verseStart + verseEnd` (when `ownerUserId is null`)
- Batch save actions assign `saveGroupId` so related rows render together while remaining individually addressable.
- Each saved item supports one optional plain-text note (`note`) with server validation and DB length check.
- Saved UI shows grouped books first (`/saved`) with detail route per book (`/saved/:book`) and grouped display rows.

## Backend Endpoints

- `GET /api/scriptures/search`
  - Query params:
    - `mode=guided|reference|keyword`
    - `translation`
    - `q` (required for `reference`/`keyword`)
    - `book`, `chapter`, `verseStart`, `verseEnd` (for guided)
    - `limit`
- `GET /api/saved-scriptures`
- `GET /api/saved-scriptures/chapter`
- `GET /api/saved-scriptures/grouped`
- `POST /api/saved-scriptures`
- `POST /api/saved-scriptures/batch`
- `PATCH /api/saved-scriptures/:savedId`
- `PATCH /api/saved-scriptures/:savedId/note`
- `DELETE /api/saved-scriptures/:savedId`
- `GET /api/reader/chapter`
- `GET /api/reader/state`
- `PATCH /api/reader/state`
- `DELETE /api/reader/state`
- `GET /api/admin/scripture-sources`
  - Operational diagnostics for scripture source readiness (DB counts + local JSON file status); requires a **Bearer JWT signed with `TOKEN_SECRET`** (not the SPA session). **Not wired in the admin UI** — operators use **`curl`** or scripts; see **`docs/deployment/README.md`** → _Admin API authentication_. Response includes **`readerChapterBundledFallback`** (`availableTranslations`, `allTrackedPresent`) so ops can confirm Reader can fall back to `server/data/bible/*.json` when the DB has no `scripture_verses` rows for a translation.

All endpoints use the existing API envelope contract, except delete routes that intentionally return `204 No Content`.

## Data Model

- `scripture_verses`
  - Structured verse corpus for fast lookup.
  - Indexed by reference coordinates and full-text search index.
- `saved_scripture_items`
  - Ownership-aware saved reference/range metadata for authenticated and anonymous flows.
  - Stores grouped save context (`saveGroupId`) and one optional note (`note`).
  - Includes ownership-aware uniqueness and grouped-read indexes.

See:

- `server/db/schema.ts`
- `database/schema.sql`
- `database/migrations/0005_brisk_search_and_saved_scriptures.sql`
- `database/migrations/0011_solid_reader_multisave_notes.sql`
- `database/migrations/0012_reader_state_account_sync.sql`

## Hybrid Source Strategy

- Source order is: DB corpus -> local server JSON (`server/data/bible`) -> remote API fallback (`bible-api.com`) for `reference`/`keyword`.
- Search responses normalize `translation` to canonical short codes (`KJV`, `ASV`, `WEB`) for save-path compatibility.
- Response includes `source: local|remote`.

## Full Bible JSON Import

To load a fuller local corpus into `scripture_verses`:

```sh
pnpm run db:sync:bible-sources
pnpm run db:import:bible-translations
```

Defaults:

- `db:sync:bible-sources` writes local files:
  - `server/data/bible/kjv.json`
  - `server/data/bible/asv.json`
  - `server/data/bible/web.json`
- `db:import:bible-translations` imports those three translations into `scripture_verses`.
- `db:import:bible-json` still supports one-off import/override for a single translation.

Optional overrides:

```sh
BIBLE_JSON_PATH=/absolute/path/to/verses.json pnpm run db:import:bible-json
BIBLE_JSON_URL=https://example.com/verses.json BIBLE_TRANSLATION=WEB pnpm run db:import:bible-json
```

Expected input shape:

- JSON object map: `{ "<Book> <Chapter>:<Verse>": "<Verse text>" }`

## Accessibility-First Choices

- Global text-size control with persisted preference.
- Global high-contrast toggle with persisted preference.
- Large controls (`min-h-11`) on search/save actions.
- Simplified labels and predictable placement for key actions.
- Helper copy uses a warm + practical tone with recovery-first error messaging.
- Text-size options now include: `Small`, `Medium`, `Large`, and `XL`.
- Mobile uses a shared display-settings modal with live preview and `Cancel` rollback for both text size and high contrast.

## Reader Route Behavior

- Frontend route: `/reader?book=<Book>&chapter=<N>&translation=<Code>`.
- Backend canonicalizes book/translation and validates chapter bounds.
- Payload includes:
  - structured `verses[]`
  - chapter-level `displayText`
  - `hasPrevious` / `hasNext` and chapter navigation references.
- Reader UI supports previous/next chapter actions and keeps URL state synchronized.
- When the user is on the first chapter of a book, `Previous chapter` can roll into the last chapter of the previous canonical book (when available for the selected translation).
- When the user is on the last chapter of a book, `Next chapter` can roll into chapter 1 of the next canonical book (when available for the selected translation).
- Reader supports three reading styles:
  - `verse`: reference + verse text
  - `standard`: superscript verse number formatting
  - `clean`: paragraph-style reading without verse indicators
- Reader supports click-to-save bookmark and `Jump to last place` resume behavior.
- Reader supports verse-level actions (`Bookmark`, `Save verse`, `View/Edit note`) from a verse-click actions modal (mobile bottom-sheet style).
- Reader verse actions include `Share verse` using native share first with clipboard fallback.
- In `standard` mode, verse text stays paragraph-style while each verse segment remains individually selectable for actions.
- In `clean` mode, the same paragraph-style per-verse segment selection is available without extra selector rows.
- `View/Edit note` in Reader can initialize note editing for unsaved verses by auto-saving that verse first.
- Reader can fetch chapter-scoped saved rows for note/save state, avoiding full saved-list hydration for each chapter view.
- Saved note indicators render per covered verse and open a note-edit modal directly from the chapter view.
- Authenticated sessions can sync reader preferences/bookmark to account state (`account_wins`); guests remain local-storage based.

## Shared Verse Links

- Shared verse links use a public route:
  - `/verse?book=<Book>&chapter=<N>&verse=<N>&translation=<Code>`
- Recipients can open this route as guests or signed-in users.
- Verse detail route behavior:
  - canonicalizes and validates query params
  - fetches verse content through existing scripture search (`mode=reference`)
  - offers navigation actions: `Open in Reader`, `Open Search`, `Go to Support`
  - supports `Share verse` (native share when available, clipboard fallback otherwise)
  - supports `Copy link`

## Rollout Observability

- Backend emits lightweight structured logs for:
  - grouped batch-save attempts (including batch size),
  - reader chapter latency/success/failure,
  - note update failures.
- Logging intentionally avoids note-body content and other sensitive values.

## Rollout and Validation

- Type checks: `pnpm run tsc`
- Build: `pnpm run build`
- Frontend tests: `pnpm -C client test`
- Backend tests: `pnpm -C server test`
- Diagnostics endpoint: `GET /api/admin/scripture-sources` with `Authorization: Bearer <token>`

### Quick Visual QA (Text Size)

1. Open the app and switch text size from `Small` -> `Medium` -> `Large` -> `XL`.
2. Verify visible scale changes on:
   - top nav labels and controls
   - section headers and paragraph text
   - search results cards and saved scripture cards
3. Confirm `High contrast` still keeps text readable at all four sizes.
4. Refresh the page and verify the selected size persists.
5. On mobile viewport, verify controls remain usable and text does not clip.

Recommended next step:

- keep `server/data/bible` and DB corpus in sync by rerunning import scripts during translation updates.
