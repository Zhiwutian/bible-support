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

- Anonymous, device-scoped saves only (no sign-in required).
- Client sends stable `x-device-id` header for anonymous save scope.
- When authenticated via cookie session, saved-scripture routes can resolve user scope without requiring `x-device-id`.
- Backend stores reference/query metadata, not full user-auth profile data.
- Saved-item uniqueness is enforced by: `deviceId + translation + book + chapter + verseStart + verseEnd`.
- Saved UI now shows grouped books first (`/saved`), with a detail route per book (`/saved/:book`) listing saved verses for that book.

## Backend Endpoints

- `GET /api/scriptures/search`
  - Query params:
    - `mode=guided|reference|keyword`
    - `translation`
    - `q` (required for `reference`/`keyword`)
    - `book`, `chapter`, `verseStart`, `verseEnd` (for guided)
    - `limit`
- `GET /api/saved-scriptures`
- `POST /api/saved-scriptures`
- `PATCH /api/saved-scriptures/:savedId`
- `DELETE /api/saved-scriptures/:savedId`
- `GET /api/admin/scripture-sources`
  - Operational diagnostics for scripture source readiness (DB counts + local JSON file status); requires admin bearer token.

All endpoints use the existing API envelope contract, except delete routes that intentionally return `204 No Content`.

## Data Model

- `scripture_verses`
  - Structured verse corpus for fast lookup.
  - Indexed by reference coordinates and full-text search index.
- `saved_scripture_items`
  - Device-scoped saved reference/range metadata.
  - Unique constraint prevents duplicate saves for same device + range.

See:

- `server/db/schema.ts`
- `database/schema.sql`
- `database/migrations/0005_brisk_search_and_saved_scriptures.sql`

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
