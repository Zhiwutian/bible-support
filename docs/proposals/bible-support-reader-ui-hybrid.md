# Proposal: Bible Support — hybrid reader UI and mobile overflow

**Status:** Approved for implementation (hybrid UX + Full Context primary Reader + secondary BibleGateway).

## Goal

- Full chapter from **Full Context** opens **in-app Reader** (`/reader`); optional **BibleGateway** remains as a secondary action.
- **Support / Emotions** verse reading uses the **same reader typography** as `/reader` via a shared **`ReaderSurface`** (no full-chapter fetch on that screen).
- **Reader** chapter controls work on **narrow / mobile** viewports; fix **overflow** on prayer partners, prayer lists, profile, and similar forms under **large text**.
- **Prayer list** member removal uses a **confirmation modal**.
- In **Reader**, **saved** verses in the current chapter are **visually distinct** from bookmark; **support verse** context appears when arriving from Emotions.

## Non-goals

- Replacing the Emotion swipe/carousel with reader-only navigation (out of scope for this pass).

## Current state (summary)

- `FullContextPage` opens BibleGateway for “Read full chapter.”
- `EmotionScripturePage` already navigates to `/reader` for full chapter.
- `ReaderChapterControls` uses fixed `min-width` flex children that can overflow on small screens.
- `BibleReaderPage` rings **bookmark** verses only; saved items show note markers but not a dedicated “saved” highlight.
- `PrayerListDetailPage` removes members without confirmation.

## Recommended approach

1. **Shared navigation helper** (or inline parity) to build `/reader` query params from reference + translation + optional emotion slug.
2. **`ReaderPreferencesProvider`** (or `storage` event + hook) so `ReaderSurface` updates when preferences change on `/reader`.
3. **`ReaderSurface`**: applies the same CSS class stack as `BibleReaderPage`’s `readerRootClassName`.
4. **Reader chapter UI**: responsive column layout; chapter **`<select>`** on small breakpoints optional alongside number input on `md+`.
5. **Layout fixes**: `min-w-0`, `w-full`, `break-words` on flex children and inputs.
6. **Reader content**: pass `isSavedVerse` into `ReaderChapterContent`; support verse **callout** when `fromEmotion` / `fromScriptureId` present (fetch if needed).

## Security / privacy

- External BibleGateway link keeps `noopener,noreferrer` on `window.open`.

## Test plan

- Client tests: Full Context primary button navigates to `/reader` with expected params; secondary still opens external URL (mock `window.open`).
- Prayer list remove: modal confirm path (if test patterns exist).
- Run `pnpm run lint`, `tsc`, `test`, `build` from repo root.

## Risks

- Duplicated reference-parsing logic if not centralized; mitigate with a small shared helper under `client/src/features/reader/` or `lib/`.

## Related plans / docs

- `reader-comfort-customization-research.md`, `reader-styles-bookmarks-account-sync.md`, `scripture-reader-multisave-notes-rollout.md`

---

_Detailed task list and architecture notes were derived from the implementation plan; keep this proposal as the product/architecture record._
