# Proposal: Global translation preference, tutorial dark mode, support layout, outbound study links

**Status:** Implemented (see CHANGELOG [Unreleased]).

**Companion:** Cursor plan `translation_ux_and_support_ui` (implementation task list).

## Goal

1. **Translation:** Persist a single **app-wide Bible translation** in **localStorage**; once set, it drives Support, Search, and Reader until the user changes it. **Saved preference overrides URL `translation` query** on reader (with a one-time seed from URL only when no preference exists yet).
2. **Tutorial:** Fix **unreadable text in dark mode** on the tutorial route by updating [`TutorialProse`](../../client/src/components/tutorial/TutorialProse.tsx) (and related MDX wrappers) for `.app-dark-mode`.
3. **Support scriptures:** Remove **swipe** navigation on [`EmotionScripturePage`](../../client/src/pages/EmotionScripturePage.tsx); place **Previous / Next** directly under the verse display, then **Read full chapter** below that; replace inline **Learn context** UI with **outbound study links** (Bible.com + optional BibleGateway).
4. **YouVersion / study content:** Document that the **public YouVersion Platform API** does **not** expose study-guide-by-verse endpoints; use **HTTPS deep links** instead of API-backed study content.

## Non-goals

- Adding a YouVersion **API key** or server proxy solely for study text (out of scope unless product later licenses content).
- Changing **per-saved-item** translation in Saved Scriptures (existing behavior can remain).
- Full removal of [`FullContextPage`](../../client/src/pages/FullContextPage.tsx) / [`readScriptureContext`](../../client/src/features/emotions/emotion-api.ts) in the first slice unless grep shows no inbound dependency (optional follow-up).

## Current state (summary)

| Area           | Behavior                                                                                                                                                                                       |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Support        | [`EmotionScripturePage`](../../client/src/pages/EmotionScripturePage.tsx): `useState` translation, swipe + bottom actions, expandable context via `readScriptureContext`, link to Full Context |
| Search         | [`SearchPage`](../../client/src/pages/SearchPage.tsx): translation in **session** [`route-session-state`](../../client/src/lib/route-session-state.ts)                                         |
| Reader         | URL + [`useReaderChapterRouteState`](../../client/src/features/reader/useReaderChapterRouteState.ts)                                                                                           |
| Tutorial       | [`TutorialProse`](../../client/src/components/tutorial/TutorialProse.tsx): fixed light-theme slate classes                                                                                     |
| YouVersion API | [Quick reference](https://developers.youversion.com/quick-reference): Bible **text** only (`/bibles`, books, chapters, verses); **no** documented study-guide endpoints                        |

## Recommended approach

### A. Preferred translation

- New module e.g. [`client/src/lib/preferred-translation.ts`](../../client/src/lib/preferred-translation.ts): Zod-validated value, key `app:preferred-translation:v1`, default `KJV`.
- Hydrate in app shell ([`App.tsx`](../../client/src/App.tsx) or existing state provider); expose `preferredTranslation` + `setPreferredTranslation`; optional `storage` event for multi-tab sync.
- **Reader:** After hydration, normalize `translation` in state and URL to preference; **seed** from URL **once** if storage empty.
- **Support / Search:** Initialize selectors from preference; on change, persist preference.
- **Navigation:** Audit [`build-reader-chapter-url`](../../client/src/features/reader/build-reader-chapter-url.ts), [`ReaderNavLinkButton`](../../client/src/components/app/ReaderNavLinkButton.tsx), emotion → reader, shared verse links so generated URLs use preferred translation (then reader still normalizes).
- **Search route state:** Avoid dual source of truth—derive translation from preference on load or sync preference whenever route state restores.

### B. Tutorial dark mode

- Add `.app-dark-mode` (or equivalent) overrides in `TutorialProse`; fix [`TutorialPage`](../../client/src/pages/TutorialPage.tsx) Suspense fallback.
- Scan [`TutorialCallout`](../../client/src/components/tutorial/TutorialCallout.tsx) and tutorial MDX sections for hard-coded light-only classes.

### C. Emotion scripture layout

- Remove touch handlers and `onTouchStart` / `onTouchEnd` on the scripture `Card`.
- Order: reference + text → **Prev / Next** → **Read full chapter** → **Study online** links.
- Update section header copy (no swipe).
- Tab order matches visual order; external links have clear accessible names and `rel="noopener noreferrer"`.

### D. Learn context → study links

- Replace expandable summary / “View full context” on Support with labeled links, e.g. Bible.com pattern `https://www.bible.com/bible/{versionId}/{USFM}.{chapter}.{verse}` with a small **translation → YouVersion version id** map and fallback version.
- Optional second link: BibleGateway passage URL (align with [`bible-support-reader-ui-hybrid.md`](bible-support-reader-ui-hybrid.md)).
- Short UI note: third-party sites / terms.
- Update [`07-learn-context.mdx`](../../client/src/content/tutorial/sections/07-learn-context.mdx).
- **Full Context route:** minimal change—remove navigation from emotion flow; keep route for bookmarks until audited.

## Data model and API changes

- **Client-only:** `localStorage` for preferred translation; no DB migration.
- **Server:** No change required for study **links**; existing scripture-context API may become less used from Support (cleanup optional).

## Security / privacy

- Outbound links only; no new secrets.
- Optional telemetry: `study_link_opened` / `translation_preference_changed` with non-PII payloads (provider, reference code).

## Rollout and migration

- Existing users: first load seeds preference from current behavior (e.g. `KJV` or first URL translation) once, then preference file drives.
- Document in [`docs/configuration.md`](../configuration.md) and repo-root [`CHANGELOG.md`](../../CHANGELOG.md).

## Test plan

- Vitest: `preferred-translation` load/save/invalid JSON; translation persistence across surfaces (mock `localStorage`).
- Update [`App.test.tsx`](../../client/src/App.test.tsx) (and any emotion tests) for swipe removal, layout, translation URL behavior.
- `pnpm run lint`, `tsc`, `test`, `build`; if reader/dark CSS touched per project rules, `pnpm --filter client test`.

## Risks and mitigations

| Risk                                        | Mitigation                                                                                      |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| URL share expectations vs preference        | Document that shared `/reader?translation=` is normalized to saved preference after first visit |
| Bible.com URL breakage / version id drift   | Fallback version id; manual smoke; optional feature flag                                        |
| Removing context panel reduces on-app depth | Clear copy + optional keep Full Context route for bookmarks                                     |
| Search route state vs preference diverge    | Single source: preference wins; simplify route state                                            |

## Open questions

- None blocking; optional second implementation slice: remove or redirect `FullContextPage` after usage grep.

## Related docs

- [`bible-support-reader-ui-hybrid.md`](bible-support-reader-ui-hybrid.md)
- [`reader-mobile-fullscreen.md`](reader-mobile-fullscreen.md)

---

_Implementation: follow Cursor plan **translation_ux_and_support_ui**; keep this file as the product/architecture record._
