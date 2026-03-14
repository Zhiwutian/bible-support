# Scripture Reader + Multi-Save + Notes Rollout

## Goal

Ship and operate three user-facing capabilities as one cohesive support workflow:

- Save multiple verses in one action while preserving grouped display context.
- Read full chapters in-app with predictable navigation and shareable URLs.
- Add one editable note per saved scripture item.

## Non-Goals

- Multi-note threads/comments per saved verse (v2+ scope).
- Rich text notes or markdown formatting.
- Real-time collaborative note editing.
- Public sharing links for saved collections.

## Current State Summary

- Saved scriptures are persisted in `saved_scripture_items`.
- Verse text resolution already supports DB-first hydration with local JSON fallback.
- Auth scope supports authenticated user ownership and device-scoped guest ownership.
- Frontend routing and API contracts are shared through `shared/*-contracts.ts`.

## Recommended Approach

### 1) Data + Contract Foundation

- Extend saved-item schema with:
  - `saveGroupId` (nullable UUID) to associate independently stored rows that were saved together.
  - `note` (nullable text) with explicit max-length constraint.
- Add grouped response contracts that return:
  - deterministic group ordering,
  - item-level structured verse coordinates,
  - backend-generated `displayText` for fast render on clients.

### 2) Saved Scripture API Expansion

- Add `POST /api/saved-scriptures/batch` to persist multiple rows transactionally in one request.
- Add `GET /api/saved-scriptures/grouped` for grouped rendering by save action and book.
- Add `PATCH /api/saved-scriptures/:savedId/note` for one-note-per-item edits.
- Keep ownership semantics aligned with existing auth/device scope and migration bridge behavior.

### 3) Reader API

- Add `GET /api/reader/chapter` with:
  - canonicalized `book`, validated `chapter`, and normalized `translation`,
  - structured `verses[]` and backend-generated chapter `displayText`,
  - `hasPrevious` / `hasNext` plus chapter navigation metadata.
- Keep chapter bounds strict and deterministic for predictable URL behavior.

### 4) Frontend Integration

- Search page:
  - add multi-select verse checkboxes,
  - allow grouped save mutation (`Save selected (N)`).
- Saved pages:
  - list grouped results and preserve grouped display context,
  - support per-item note editing and save feedback.
- Reader page:
  - dedicated route with book/chapter/translation controls,
  - URL sync for shareable route state,
  - previous/next chapter controls.

### 5) Rollout Observability

- Emit lightweight structured logs for:
  - batch save size and scope context,
  - reader chapter latency and failures,
  - note patch failures.
- Keep logs privacy-safe (no note text content or sensitive tokens).

## Data Model and API Changes

### Schema

- `saved_scripture_items.saveGroupId` (uuid, nullable, indexed)
- `saved_scripture_items.note` (text, nullable, `char_length <= 4000`)
- Grouped-read indexes for:
  - owner + group + created ordering
  - device + group + created ordering

### New/Updated Endpoints

- `GET /api/saved-scriptures/grouped`
- `POST /api/saved-scriptures/batch`
- `PATCH /api/saved-scriptures/:savedId/note`
- `GET /api/reader/chapter`

## Security and Privacy Notes

- Maintain existing auth scope checks for all saved-scripture mutations.
- Sanitize and normalize note input (trim, empty-to-null, max length).
- Do not log note body text in observability events.
- Preserve minimal-profile posture (display name/avatar only, no email persistence).

## Rollout and Migration Plan

1. Apply schema migration for `saveGroupId` and `note`.
2. Deploy backend contracts/controllers/services.
3. Deploy frontend grouped-save/reader/note UI.
4. Run full quality gates (`lint`, `tsc`, `test`, `build`).
5. Execute smoke checks for:
   - grouped batch save,
   - note edit flow,
   - reader chapter navigation.

## Test Plan

- Backend:
  - batch validation + ownership behavior,
  - note patch success + not-found/failure paths,
  - reader validation and chapter bounds.
- Frontend:
  - reader route render and next/previous chapter behavior,
  - batch save selection and save success feedback,
  - saved-item note edit and persistence feedback.
- Integration/ops:
  - full monorepo validation commands,
  - post-deploy endpoint smoke checks.

## Risks and Mitigations

- **Risk:** legacy rows without group ids can produce mixed presentation.
  - **Mitigation:** compatibility mapping in grouped-read service with deterministic fallback grouping.
- **Risk:** reader payload size can increase latency on large chapters.
  - **Mitigation:** lightweight caching + latency logging for visibility.
- **Risk:** note misuse or oversized payloads.
  - **Mitigation:** strict validation and DB constraint guardrail.

## Acceptance Criteria

### Blocking

- Batch save persists multiple items in one action and displays grouped output.
- Reader route supports canonicalized book/chapter/translation URL round-trip.
- One note per saved item can be created/updated/cleared safely.
- Full quality gates pass in CI/local validation.

### Stretch

- Observability logs make rollout health measurable with low noise.
- Reader/grouped flows maintain deterministic ordering under mixed legacy/new data.
