# Reader Styles, Bookmarking, and Account-Synced Reader State

## Goal

Extend the Reader into a more book-like, resumable reading experience with:

- three reader presentation styles (`verse`, `standard`, `clean`),
- click-to-bookmark last reading place,
- authenticated account sync for reader preferences and bookmark state.

## Non-Goals

- Multiple named bookmarks in this phase.
- AI/prose rewriting of scripture text.
- Full cross-device reading history timeline.

## Confirmed Product Decisions

- `Options` should be visually obvious as a button.
- Reading styles:
  - `verse`: current per-verse format with full reference label.
  - `standard`: traditional Bible formatting with superscript verse numbers.
  - `clean`: no verse indicators; joined paragraph-style reading with minimal formatting cleanup.
- Bookmark model: single last-reading position.
- Bookmark anchor payload: `book + chapter + verse + translation + scrollOffset`.
- Auth sync policy: `account_wins` on login.

## Current State Summary

- Reader currently renders chapter verses using one format (`reference + verseText`).
- Reader comfort settings are local-storage based and versioned.
- Auth session is available via signed cookie and `req.authUserId`.
- No persisted backend reader state table/endpoints exist yet.

## Recommended Approach

### 1) Preference and contract expansion

- Add `readingStyle` to reader preferences model.
- Introduce shared contracts for reader state endpoints:
  - `GET /api/reader/state`
  - `PATCH /api/reader/state`
  - `DELETE /api/reader/state` (clear synced state for authenticated user).

### 2) Backend reader-state persistence

- Add `reader_state` table keyed by `userId` with:
  - preferences snapshot (JSON),
  - bookmark fields (`book`, `chapter`, `verse`, `translation`, `scrollOffset`),
  - timestamps.
- Normalize partial/legacy payloads server-side for backward compatibility.

### 3) Reader UI rendering styles

- Add `Reading style` selector in Reader Options modal.
- Render variants:
  - `verse`: existing line-per-verse reference display.
  - `standard`: flowing text with superscript verse numbers.
  - `clean`: flowing text with no markers and minimal punctuation-safe joining.

### 4) Bookmarking UX

- Clicking a verse/line sets current bookmark.
- Save confirmation appears after bookmark set.
- Add `Jump to last place` action when a bookmark exists.
- Restore bookmark anchor + scroll offset on chapter load.

### 5) Account sync behavior

- Guest mode: local persistence only.
- Authenticated mode: load server reader state and apply over local (`account_wins`).
- Authenticated updates: debounce writes and skip unchanged writes.
- Include robust fallback to local behavior if sync endpoints fail.

### 6) Privacy and controls

- Add `Clear synced reader data` control in Options for signed-in users.
- Clear action removes server reader state and local cached reader state.
- Maintain privacy-safe telemetry (no verse/note text in events).

## Data Model and API Changes

### Database

- New `reader_state` table in `server/db/schema.ts` + migration:
  - `userId` (PK/FK to `users.userId`)
  - `preferences` (jsonb)
  - `bookmarkBook` text nullable
  - `bookmarkChapter` integer nullable
  - `bookmarkVerse` integer nullable
  - `bookmarkTranslation` text nullable
  - `bookmarkScrollOffset` integer nullable
  - `createdAt`, `updatedAt`

### API

- `GET /api/reader/chapter` unchanged for verse source.
- New:
  - `GET /api/reader/state` (auth required)
  - `PATCH /api/reader/state` (auth required)
  - `DELETE /api/reader/state` (auth required)

## Security and Privacy Notes

- Reader state endpoints require authenticated session (`requireSessionUserId`).
- Validate all bookmark coordinates and bounds before persisting.
- Keep telemetry metadata-only:
  - `reader_style_changed`
  - `reader_bookmark_set`
  - `reader_state_synced`
  - `reader_state_cleared`

## Rollout and Migration Plan

1. Add contracts + reader preference schema bump with migration logic.
2. Add DB table + backend service/controller/routes.
3. Add reader rendering styles and bookmark interactions.
4. Add auth sync integration and clear-data controls.
5. Validate test suite, lint, and docs updates.

## Test Plan

- Backend:
  - reader state auth guards,
  - payload validation,
  - partial legacy state normalization,
  - clear state endpoint.
- Frontend:
  - style switching and render checks,
  - bookmark set/jump/restore flow,
  - account-wins sync behavior,
  - clear synced reader data behavior.
- Regression:
  - reader chapter navigation,
  - translation switching,
  - “Back to Support Verse” flow.

## Risks and Mitigations

- **Risk:** frequent scroll updates cause noisy API traffic.
  - **Mitigation:** debounce and unchanged-state write suppression.
- **Risk:** inconsistent state from partial old payloads.
  - **Mitigation:** server-side normalization and defaults.
- **Risk:** user confusion around bookmark save.
  - **Mitigation:** explicit save confirmation and visible `Jump to last place` affordance.

## Acceptance Criteria

- Reader supports `verse`, `standard`, and `clean` styles.
- Bookmark is created by clicking verse/line and includes scroll offset.
- `Jump to last place` works when bookmark exists.
- Authenticated reader state loads from account and overrides local state.
- User can clear synced reader data from Options.
- Guest mode still works without backend reader-state dependency.
