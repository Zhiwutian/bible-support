# Proposal: Immersive reader chrome, deferred exit control, chapter scroll reset

**Status:** Implemented (see CHANGELOG **[Unreleased]**).

**Companion:** Builds on [`reader-mobile-fullscreen.md`](./reader-mobile-fullscreen.md) (tools sheet + fullscreen shell).

## Goal

1. **Exit full screen:** In immersive mode, hide the in-app **Exit full screen** button until a **timeout** elapses, or the user **clicks** the immersive shell (same click reveals bottom chapter chrome). A click on **verse text** (the `.reader-verse-text-hit` control) opens the **verse actions** sheet (save / bookmark / share / note); shell clicks on **empty** reading chrome **do not** open verse actions. Clicks on **modals** or the **bottom bar** are ignored for this reveal. **Native** fullscreen exit (**Esc**, browser UI) is unchanged.
2. **Chapter navigation placement:** Move **Previous chapter** / **Next chapter** from the **top** of the immersive shell to a **bottom** bar (with safe-area padding). Non-immersive reader already places chapter nav **below** the chapter scroll area; no change unless a follow-up asks for sticky viewport chrome.
3. **Scroll position on chapter change:** When opening a chapter that has **no saved scroll offset** for the current `book|chapter|translation` key, scroll the reader container to the **top** so next/previous chapter does not leave the viewport scrolled to the previous chapter’s position.

## Non-goals

- Hiding Previous/Next in immersive (only **Exit** is deferred).
- Adding **ReaderBreakReminder** inside immersive (optional future slice).
- Sticky/fixed chapter nav on the non-immersive **page** chrome.

## Decisions (final questions resolved)

| Topic                         | Decision                                                                                                                                                                                                                                                                                                                                     |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| What reveals Exit?            | **`click` capture** on the immersive shell (primary button): shows bottom chapter bar + Exit (telemetry `surface_click`), except clicks on **`[role=dialog][aria-modal=true]`** or **`reader-immersive-bottom-chrome`**. **Or** **timeout** (~4s, **immediate** if `prefers-reduced-motion: reduce`). **Scroll** alone does not reveal Exit. |
| Bottom chapter bar visibility | **Hides** on **user scroll**; stays **hidden** until the user **clicks** the immersive shell again (same as Exit). **No** idle timer to re-show after scroll. Programmatic scroll uses a suppress flag so restore/nav does not hide the bar. **Chapter nav** (prev/next) still **shows** the bar when invoked.                               |
| Clearance / a11y              | Scroll column **`padding-bottom`** uses **`--reader-immersive-bottom-chrome-pad`** on **`.reader-immersive-shell`** (see **`index.css`**). When the bar is off-screen, the chrome container sets **`aria-hidden`** so assistive tech matches the visual.                                                                                     |
| Suppress + bfcache            | Double-`rAF` clear is **generation-scoped** so overlapping schedules do not drop suppress early. **`pageshow`** (bfcache) only arms suppress when **immersive** is active.                                                                                                                                                                   |
| Stacking                      | Bottom chrome is **after** the modal portal host in the DOM with **higher z-index** (`z-[75]` vs host `z-[70]`) so controls stay visible and tappable; modals still cover when open.                                                                                                                                                         |
| Telemetry                     | `reader_immersive_exit_revealed` with `{ reason: 'surface_click' \| 'timeout' }` (once per immersive session).                                                                                                                                                                                                                               |

## Current state (summary)

- [`BibleReaderPage.tsx`](../../client/src/pages/BibleReaderPage.tsx): immersive shell is `flex-col` with **top** row (prev / next / exit), then scrollable `reader-content`, then absolute modal host `z-[70]`.
- Session scroll restore: if `loadReaderScrollPosition` returns `null`, the effect does not set `scrollTop`, so the **same** scroll container keeps the **old** offset after chapter change.

## Recommended approach

1. **Scroll reset:** In the session-restore `useEffect`, use `requestAnimationFrame` to set `scrollTop = 0` when `saved == null` and `suppressSessionScrollRef` is false; keep existing restore when `saved != null`. Preserve verse-jump and bookmark suppression behavior.
2. **Immersive layout:** Order: optional **loading** strip → `flex-1 min-h-0` **reader-content** → modal host → **bottom bar** (border-top, theme vars, `pb` + safe-area).
3. **Exit deferral:** `useState(false)` + reset when `isImmersiveReader` becomes false; on enter, start `setTimeout` (respect reduced motion); **`click` capture** on immersive root reveals chrome + Exit; **verse text** (`.reader-verse-text-hit`) clicks still open verse actions in the bubble phase. (Scroll-based reveal was skipped — programmatic `scrollTop` fires `scroll` too.)
4. **Tests:** Fullscreen test **clicks** the immersive shell before Exit appears. **Scroll-to-top** after chapter nav is covered by implementation (`useLayoutEffect` + `navigateReaderChapter` + payload-aligned save/restore); a DOM integration assertion was dropped due to **jsdom** / Strict Mode timing with `scrollTop`.

## Security / privacy

- Telemetry payload is non-PII (`reason` enum).

## Test plan

- `pnpm run lint`, `tsc`, `test`, `build`; Reader route axe smoke unchanged expectation.

## Risks and mitigations

| Risk                   | Mitigation                                                          |
| ---------------------- | ------------------------------------------------------------------- |
| Users cannot find Exit | Timeout + long-press reveal; document Esc for native FS             |
| Double telemetry       | Ref guard: one `reader_immersive_exit_revealed` per immersive entry |

## Related docs

- [`reader-mobile-fullscreen.md`](./reader-mobile-fullscreen.md)

---

_Implementation: [`BibleReaderPage.tsx`](../../client/src/pages/BibleReaderPage.tsx); CHANGELOG [Unreleased]._
