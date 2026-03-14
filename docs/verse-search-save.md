# Verse Search and Save

This document describes the implemented search/save expansion for fast scripture lookup and simple anonymous collections.

## Search Modes

- Guided picker
  - Inputs: `book`, `chapter`, optional `verseStart`, optional `verseEnd`
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
- `GET /api/saved-scriptures/grouped`
- `POST /api/saved-scriptures`
- `POST /api/saved-scriptures/batch`
- `PATCH /api/saved-scriptures/:savedId`
- `PATCH /api/saved-scriptures/:savedId/note`
- `DELETE /api/saved-scriptures/:savedId`
- `GET /api/reader/chapter`
- `GET /api/admin/scripture-sources`
  - Operational diagnostics for scripture source readiness (DB counts + local JSON file status); requires admin bearer token.

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
