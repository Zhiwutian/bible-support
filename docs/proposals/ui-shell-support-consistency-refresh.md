# Proposal: UI Shell + Support Consistency Refresh

## Goal

Improve navigation clarity and wording consistency across desktop/mobile while aligning branding, auth entry points, and support/search/about experiences.

## Why This Update

- Current shell mixes navigation patterns across breakpoints.
- Sign-in controls are split between header and menu, creating inconsistent account UX.
- User-facing terminology still mixes `Emotions` and `Support`.
- Search mode chooser and About content can be simplified for clarity.

## Scope

1. Desktop menu becomes hamburger-triggered left pop-out overlay.
2. Menu opens over app content with transparent background blocker.
3. Main content width increases on full desktop to roughly 10-column equivalent.
4. Header keeps logo + `Scripture & Solace` in top-left on desktop and mobile.
5. Sign-in/sign-out controls only appear inside menu; account section shows avatar + username when authenticated.
6. Increase mobile `XL` text size.
7. Replace menu label `Emotions` with `Support`.
8. Support page title/copy updates:
   - Title: `Scriptural Support`
   - Subheading: `Choose How You Are Feeling for Scriptural Support`
9. Emotion labels become first-person (`I Am Angry`, `I Am Anxious`, etc.).
10. About page is rewritten to reflect current functionality and includes FAQ.
11. Search page uses a `Search Type` select input instead of three mode buttons.
12. Login modal uses full brand header (logo + `Scripture & Solace`).
13. Consistency enhancements:
    - grouped menu sections (`Navigation`, `Account`, `Display`)
    - active-state/fallback copy cleanup for `Support` terminology
    - stable logo/title sizing to avoid layout shift
    - FAQ quick-link actions to major routes

## Non-Goals

- Route path changes (`/` remains support landing route).
- Auth-provider behavior changes.
- Backend schema/API changes unrelated to current UI requests.

## Implementation Approach

### 1) App shell and menu architecture

- Refactor [`client/src/App.tsx`](../../client/src/App.tsx):
  - Remove pinned desktop sidebar behavior.
  - Use one overlay menu pattern for desktop/mobile with backdrop + Escape/outside close.
  - Move auth controls to `Account` menu section only.
  - Keep display controls in `Display` menu section.
  - Keep navigation links in `Navigation` menu section with `Support` label.

### 2) Layout and header

- Update shell/container classes in [`client/src/App.tsx`](../../client/src/App.tsx):
  - widen full-desktop content area.
- Ensure top-left logo + brand text is consistently rendered across viewports.

### 3) Typography

- Adjust XL text-scale rules in [`client/src/index.css`](../../client/src/index.css) for stronger mobile readability.

### 4) Page content updates

- Update support route UI in [`client/src/pages/EmotionsPage.tsx`](../../client/src/pages/EmotionsPage.tsx):
  - title/subheading text updates.
  - first-person emotion labels.
- Update search mode controls in [`client/src/pages/SearchPage.tsx`](../../client/src/pages/SearchPage.tsx):
  - convert mode button row to `Search Type` select.
- Rewrite [`client/src/pages/AboutPage.tsx`](../../client/src/pages/AboutPage.tsx):
  - current feature summary + FAQ + route quick links.

### 5) Modal branding and consistency

- Update login modal in [`client/src/App.tsx`](../../client/src/App.tsx):
  - full brand header with logo + `Scripture & Solace`.

### 6) Tests and docs

- Update [`client/src/App.test.tsx`](../../client/src/App.test.tsx) for:
  - menu-only auth controls
  - support terminology
  - branded login modal
  - search mode select behavior
- Update:
  - [`docs/styleguide/ui-styleguide.md`](../styleguide/ui-styleguide.md)
  - [`docs/styleguide/frontend-patterns.md`](../styleguide/frontend-patterns.md)
  - [`docs/styleguide/code-patterns.md`](../styleguide/code-patterns.md)
  - [`README.md`](../../README.md) (if user-visible labels changed)
  - [`CHANGELOG.md`](../../CHANGELOG.md)
  - [`docs/conversation-running-log.md`](../conversation-running-log.md)

## Verification Plan

- Automated:
  - `pnpm -C client test`
  - `pnpm run lint`
  - `pnpm run tsc`
  - `pnpm run build`
- Manual:
  - desktop/mobile overlay menu behavior and backdrop
  - account info + sign-in/sign-out shown only in menu
  - support terminology and active states
  - larger mobile XL text
  - search type select mode switching
  - about/faq copy and quick links
  - branded login modal header

## Risks and Mitigations

- **Shell complexity in one file (`App.tsx`)**
  - Keep changes sectioned by menu group blocks and reuse existing callbacks.
- **Terminology drift (`Emotions` vs `Support`)**
  - Include dedicated content sweep in tests/docs pass.
- **Spacing regressions at larger text scales**
  - Validate both normal and `XL` at mobile and desktop.
