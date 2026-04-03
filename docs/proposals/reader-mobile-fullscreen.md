# Proposal: Reader full-screen reading and tools sheet

**Status:** Implemented (see CHANGELOG **[Unreleased]**).

**Scope:** **All viewports** (phone, tablet, desktop)—same capabilities everywhere, not only narrow screens.

## Goal

- Bible Reader users can enter a **distraction-minimized reading mode** that uses the **full viewport** instead of the capped **`max-h-[60vh]`** scroll area (on every breakpoint where the reader is shown).
- Discovery: **click / tap on “empty” reader chrome** (the scroll area but not a verse control) **or** an explicit **Reader tools** control opens a **tools surface** with **Full screen** and, when reader comfort is enabled, **Reader options**.
- **Verse actions** (click / tap verse, keyboard activation) must **not** open the tools surface—only the verse action flow.

## Non-goals

- Removing the existing **Options** header button when comfort is enabled (header **Options** and sheet **Reader options** can both remain for discoverability).
- Changing unrelated routes or non-reader layouts.

## Presentation note (tablet / desktop)

- **Behavior and actions** match mobile: same sheet actions, same fullscreen / overlay behavior, same telemetry.
- **Visual layout** of the tools surface may use **responsive styling** (e.g. bottom sheet on small widths, **centered panel** on `md+` aligned with [`ModalShell`](../../client/src/components/ui/ModalShell.tsx) / `ui-modal-*` patterns) so desktop users get a familiar modal instead of a phone-style bottom sheet—without changing what the buttons do.

## Current state (summary)

- Chapter text lives in a scroll container with **`max-h-[60vh] overflow-y-auto`** on [`client/src/pages/BibleReaderPage.tsx`](../client/src/pages/BibleReaderPage.tsx).
- Verses are interactive (`button` / `role="button"` spans) in [`client/src/features/reader/ReaderChapterContent.tsx`](../client/src/features/reader/ReaderChapterContent.tsx); clicks bubble to ancestors.
- Modals use **`ui-modal-backdrop`** at **`z-50`** ([`client/src/index.css`](../client/src/index.css)).
- Viewport meta does not set **`viewport-fit=cover`**, so **`env(safe-area-inset-*)`** is limited on notched devices until updated.

## Recommended approach

1. **Event isolation:** `stopPropagation()` on verse **`onClick`** / **`onKeyDown`** handlers in `ReaderChapterContent` so parent “open tools” handlers do not run.
2. **No viewport gate for features:** Do **not** hide Reader tools / content-click / fullscreen behind `max-width: 767px`. Optional **`matchMedia`** only for **responsive layout** of the tools surface (bottom vs centered), not for enabling the feature.
3. **Tools surface:** New component—dialog pattern (`role="dialog"`, `aria-modal`, labelled title), backdrop above reader content, **`z-[52]`**; **safe-area** padding where relevant; **Escape** and backdrop dismiss; **`prefers-reduced-motion`**-friendly transitions; **`md+`:** center panel + max width consistent with existing modals (reuse patterns from [`ModalShell`](../../client/src/components/ui/ModalShell.tsx)).
4. **Full screen:** `useReaderFullscreen`—`requestFullscreen` on an immersive wrapper when available (**desktop and mobile**); **fixed `inset-0`** overlay fallback with **`100dvh`**, **`min-h-0` flex** scroll region, and **`env(safe-area-inset-*)`** on chrome; **`z-[60]`** for immersive shell so it sits above **`z-50`** modals when active (modals still **exit immersive** when opened to avoid stacking bugs).
5. **Scroll preservation:** Save **`scrollTop`** when toggling immersive so chapter position is stable.
6. **Body scroll lock** while immersive; clear on exit and unmount; **exit fullscreen** on route unmount.
7. **Telemetry:** `reader_mobile_tools_opened`, `reader_mobile_tools_option_selected`, `reader_fullscreen_entered` / `reader_fullscreen_exited` (include `mode: native | overlay` where useful).
8. **HTML:** `viewport-fit=cover` in [`client/index.html`](../client/index.html) for safe areas.

## Security / privacy

- No new PII; telemetry follows existing `trackEvent` patterns.

## Test plan

- **Vitest:** Assert tools surface opens from **Reader tools** and from **content-area click** (no `matchMedia` required for gating); **Full screen** path with `requestFullscreen` mocked where needed.
- **`pnpm run lint`**, **`tsc`**, **`test`**, **`build`** from repo root.
- **axe:** Existing Reader route smoke ([`client/src/app-a11y.test.tsx`](../client/src/app-a11y.test.tsx)); ensure new dialog has accessible name.

## Risks and mitigations

| Risk                                   | Mitigation                                                                                  |
| -------------------------------------- | ------------------------------------------------------------------------------------------- |
| Native FS + modal z-order              | Exit immersive when verse/note/options modals open                                          |
| Scroll jump entering/exiting immersive | Restore `scrollTop` after toggle                                                            |
| `100dvh` / safe-area quirks            | Fallback overlay + `viewport-fit=cover`                                                     |
| JSDOM `matchMedia`                     | Only used for responsive sheet layout; tests can rely on default or mock for snapshot tests |

## Related docs

- [`docs/proposals/bible-support-reader-ui-hybrid.md`](bible-support-reader-ui-hybrid.md) — hybrid reader / mobile overflow context
- [`docs/proposals/reader-comfort-customization-research.md`](reader-comfort-customization-research.md) — reader comfort flag

---

_Implementation task list: inline comments in code and CHANGELOG under **[Unreleased]**._
