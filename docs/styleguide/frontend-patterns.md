# Frontend Patterns

## Structure

- App shell + routes: `client/src/App.tsx`
- Route pages: `client/src/pages/*`
- Feature modules: `client/src/features/*`
- UI primitives: `client/src/components/ui/*`
- App-level providers/components: `client/src/components/app/*`
- Shared utils: `client/src/lib/*`

### Reader Feature Decomposition Pattern

When refactoring large Reader surfaces, prefer this sequence:

1. Extract presentation-only components first.
2. Keep existing handlers/state in page while wiring extracted components.
3. Extract hook-level orchestration only after UI boundaries stabilize.

Current Reader decomposition references:

- Presentation components under `client/src/features/reader/`:
  - `ReaderChapterControls`
  - `ReaderChapterContent`
  - `ReaderOptionsModal`
  - `ReaderVerseActionsModal`
  - `ReaderNoteModal`
  - `ReaderStatusBar`
  - `ReaderBreakReminder`
  - `ReaderChapterNavigation`
- Hook-level logic modules:
  - `useReaderChapterRouteState`
  - `useReaderAccountSync`
  - `useReaderVerseActions`

## State Management

- Use local `useState` for page/feature-owned async state.
- Use `client/src/state` Context + reducer for app-wide UI settings only.
- Keep server-loaded data request-driven through feature API modules.

### Session route snapshots (guest-friendly)

- Use `client/src/lib/route-session-state.ts` to persist **non-sensitive** UI state
  for a tab session (search form fields, list scroll, hub filters) via
  `sessionStorage` with Zod validation. Wrap reads/writes in `try/catch`; corrupt
  keys are cleared automatically.
- Prefer **form + scroll** over large blobs (for example avoid caching full search
  result lists unless product explicitly requires offline replay).
- Dynamic routes use the real path as the key, e.g.
  `savedBookDetailRoutePath(encodeURIComponent(bookName))`,
  `prayerPartnerDetailRoutePath(partnerId)`,
  `prayerListDetailRoutePath(listId)`. Prayer list detail also persists
  **selected partner** for the add-member control and the **prayer note** draft
  (session-only; device-local).
- This is separate from **authenticated reader state** on the server
  (`readReaderState` / `updateReaderState`): session snapshots are device/tab
  scoped and work for guests.

### Reader last location + scroll

- Last book/chapter/translation (and optional URL `verse`) live in
  `client/src/features/reader/last-reader-location.ts` and hydrate when the user
  opens `/reader` without a complete query string.
- Use `ReaderNavLinkButton` or `getLastReaderTo()` for menu/CTAs so navigation
  does not drop reader context.
- **Cross-tab:** `saveLastReaderLocation` writes both `sessionStorage` and
  `localStorage` (`LAST_READER_LOCATION_LS_KEY`). New tabs read from
  `localStorage` when the session entry is empty so the menu Reader link can
  open the last place without visiting Reader in that tab first.
- Chapter scroll within the reader content pane is stored per
  `book|chapter|translation`. **Do not** restore session scroll when a **verse
  jump** or **bookmark jump** runs for the same load (see `BibleReaderPage`).
- On **bfcache** restore (`pageshow` + `persisted`), reader scroll is re-applied
  from session storage.

### React Router scroll restoration

- The reader uses a **dedicated scroll container** (not `window`). If you add
  React Router `ScrollRestoration`, ensure it does not fight the reader pane’s
  manual scroll persistence.

### Tutorial content (MDX)

- Tutorial body: `client/src/content/tutorial/sections/*.mdx` (composed in
  `client/src/pages/TutorialPage.tsx`).
- Use thin wrappers in `client/src/components/tutorial/*` (`TutorialProse`,
  `TutorialFigure`, `TutorialStep`, `TutorialCallout`, `TutorialReaderLink`) for
  consistent layout and accessibility.
- Put images in `client/public/tutorial/` (prefer WebP). **Alt text is required**
  on every figure. Do not put secrets or env values in MDX.

## API Pattern

- Use `fetchJson`/`fetchNoContent` from `client/src/lib/api-client.ts`.
- Keep endpoint call logic in feature API files (`*-api.ts`).
- Keep request/response typing aligned with `shared/*-contracts.ts`.
- Auth flows:
  - use `redirectToLogin(provider, next?)` for social login and return-path intent
  - use `updateAuthProfile(...)` for authenticated profile metadata updates
- Saved/reader flows:
  - use grouped saved endpoints for saved-page views (`readSavedScriptureGroups`)
  - use batch mutation for multi-select save flows (`saveScriptureBatch`)
  - use note patch mutation for one-note-per-item editing (`updateSavedScriptureNote`)
  - use reader chapter API with URL-synced query state (`readReaderChapter`)
  - for authenticated reader-state sync, use reader state endpoints (`readReaderState`, `updateReaderState`, `clearReaderState`) with local fallback
  - keep reader comfort preferences out of URL params (store locally with schema versioned preferences)
  - prayer hub pages: use `client/src/features/prayer/*` (`prayer-insights-api.ts`, `use-prayer-page-insights`, `use-prayer-reminder`, `PrayerHubInsightsBar`, `PrayerReminderSettingsModal`, `PrayerFilterModalShell`); call `GET /api/prayer/insights` and `PATCH /api/prayer/settings`; show toast + inline status when insights fail to load (same spirit as emotion list failures); after logging a list session, dispatch `app:prayer-insights-invalidate` via `dispatchPrayerInsightsInvalidate()` so open hub pages refetch streaks without a full navigation

## Styling Pattern

- Tailwind utilities first.
- Use `cn` helper for conditional classes.
- Prefer `client/src/components/ui` primitives over one-off ad-hoc markup.
- Keep global style concerns in `client/src/index.css` only when shared broadly.
- For inline setting explainers (`?`), use shared `SettingHelpModal` instead of duplicating per-page `ModalShell` blocks.
- For destructive or irreversible actions, use shared `ConfirmModal` (`client/src/components/ui/ConfirmModal.tsx`) instead of `window.confirm`; pass `confirmPendingLabel` when the default busy text (“Removing…”) does not fit (e.g. “Deleting…”).
- Keep utility intent explicit: avoid mixing project-wide remapped utility names (for example `text-base`) on elements that need fixed, exception typography.
- Use arbitrary utility values for one-off exceptions; if repeated in 2+ places, promote to tokenized utility or shared primitive.
- For shell-level branding/layout clusters repeated across header/menu/modal, extract a small shared presentational component.
- For Reader typography/theme customization, prefer route-scoped CSS variable tokens instead of one-off utility class chains.
- For verse-level Reader actions, prefer opening one actions modal from the verse click target and avoid dense per-verse inline action controls.

## Accessibility Pattern

- Keep controls labeled and keyboard reachable.
- Use modal primitives (`ModalShell`) for dense mobile options.
- For long mobile setting modals (for example Reader Options), enforce `max-h` + `overflow-y-auto` on panel content so all controls remain reachable.
- For mobile-reader heavy routes, prefer full-bleed content containers when readability benefits from wider line usage; restore rounded/inset card treatment at `sm+`.
- For note indicators/action menus, provide explicit `aria-label` text by verse reference and restore focus to invoking controls when menus/modals close.
- Preserve Escape/outside-click modal behavior consistency.
- Validate high-contrast and text-scale behavior for changed views.
- Prayer hub: inline insights failure copy uses `prayer-insights-inline-status` in `index.css` for dark-mode and high-contrast readability (see `PrayerHubInsightsBar`).
- Keep landing and auth-entry actions operable with keyboard and large text scales.
- Treat app-wide high-contrast overrides as a controlled global layer; avoid adding new `!important` rules outside accessibility scope.
- For reader-longform surfaces, validate reduced-motion and high-contrast combinations together.
- For reader bookmarking interactions, keep keyboard-accessible click targets and provide visible status feedback (`role="status"`).
- For interactive reader verse targets, prefer reader-scoped semantic classes (for example `reader-verse-inline-hit`) over `hover:bg-slate-*` utility hooks to avoid global dark/high-contrast selector bleed.

## Routing and Entry Pattern

- App shell decides entry state:
  - authenticated users: full route set
  - unauthenticated users: landing first, then guest mode or login
- Include a user-facing walkthrough route (`/tutorial`) when route count grows, so usage guidance stays in-product.
- Guest mode is explicit UI state and should not be conflated with authenticated session state.
- Preserve route intent through login via `next` path and restore after successful callback.
- Keep user-facing terminology consistent in shell navigation and support route copy (`Support` / `Scriptural Support`).
- For shareable scripture workflows, route state should live in query params (for example `scriptureId`, `book`, `chapter`, `translation`) instead of hidden local state only.

## Telemetry Hook Pattern

- Use `trackEvent(...)` from `client/src/lib/telemetry.ts` for analytics-ready hooks.
- Keep hooks provider-neutral and side-effect-light (no hard dependency on external analytics SDK).
- Current high-value hook points:
  - landing guest continue
  - login provider click
  - profile save success/failure
  - reader comfort settings changed/reset/dismiss interactions
  - reader style changes, bookmark set, and state sync/clear interactions
  - prayer reminder settings saved (`prayer_reminder_settings_saved`, payload: `{ enabled: boolean }` only)
  - Reader telemetry payloads must stay privacy-safe:
  - include only setting keys/values and interaction type
  - exclude verse text, note text, and identifying user content

## Form and Selector Consistency

- Prefer the shared **`Select`** primitive (`client/src/components/ui/Select.tsx`) for labeled filter-style dropdowns so spacing, borders, and mobile `16px` select rules stay consistent.
- Prefer select inputs when users are choosing one mode from a small predefined list (for example `Search Type`).
- Keep labels explicit and task-oriented (`Search Type`, `Display settings`, `Support`).
- Use component-level casing (`capitalize` utility on actionable controls) instead of global `button { text-transform: ... }` rules so content buttons (for example scripture text) stay semantically accurate.
- Use shared `Button` for modal actions and menu controls where behavior matches primary/ghost variants; avoid repeating one-off raw button class stacks.

## Helper Copy and Tone Pattern

- Use a hybrid voice: kind + practical + action-oriented.
- Keep helper text concise and immediately useful:
  - what the control does
  - when to use it
  - what to do next if it fails
- Prefer warm, recovery-first error copy (`We could not...`) over abrupt blame-oriented phrasing.
- For high-reuse UI phrases (retry/copy/share/open-route/loading), use lightweight shared copy tokens so wording stays uniform.
- Keep route-specific nuance in the page/component and avoid over-abstracting full paragraphs into shared constants.

## Voice QA Checklist

Before merging copy-heavy frontend updates:

1. Check tone consistency across help modals, inline hints, empty states, toasts, and action labels.
2. Ensure each error message includes a clear recovery action or next step.
3. Keep sentence length scannable on mobile (short, direct statements).
4. Re-run route spot checks for Support, Search, Saved, Reader, Tutorial, and shared-verse flows.
5. Add/update targeted UI assertions for key user-facing strings in critical flows to catch wording drift.

## Copy Freeze (Canonical Phrases)

Use these approved phrases for recurring UI states unless a route needs specific context.

- **Loading**
  - `Loading...`
  - `Loading verses...`
  - `Loading your saved books...`
  - `Loading support categories...`
  - `Loading context...`
- **Recovery Actions**
  - `Try again`
  - `Dismiss`
  - `Open Reader`
  - `Open Search`
  - `Go to Support`
  - `Copy Link`
  - `Share Verse`
- **Error Baseline**
  - `Something went wrong. Please try again.`
  - `We could not load that right now.`
  - `Sharing is unavailable on this device.`
  - `We could not share this verse right now.`
  - `We could not copy that right now.`
- **Share/Status**
  - `Share options are open.`
  - `Share link copied.`
  - `Share canceled.`
- **Empty/Results**
  - `No results yet`
  - `No verses found yet`

### Copy Freeze Rules

1. Prefer these phrases first for repeated system states.
2. Add route-specific details after the canonical phrase when helpful.
3. Keep tense and structure consistent (`We could not ...` for failures).
4. Update this section and `client/src/lib/copy.ts` together when introducing a new canonical phrase.

## Large-Change Frontend Review Rhythm

For large frontend updates, include a dedicated review pass before merge:

1. Run CSS/JSX audit of changed surfaces (`index.css`, shell/page JSX, UI primitives).
2. Compare responsive/cascade decisions against official Tailwind guidance.
3. Verify `Small/Medium/Large/XL` + high-contrast behavior for updated routes.
4. Identify duplication hotspots and either extract shared primitives or log follow-up tasks.
5. Update styleguide docs in the same PR so standards track reality.

## Adding New Frontend Feature (Checklist)

1. Add shared contracts if API shape changes.
2. Add feature API module under `client/src/features/<feature>/`.
3. Add route page in `client/src/pages/`.
4. Wire route in `client/src/App.tsx`.
5. Reuse `components/ui` primitives where possible.
6. Add/adjust tests in `client/src/*.test.tsx` and mock handlers.
7. For URL-driven flows, add route round-trip tests (initial URL -> rendered state -> interaction -> updated URL/state).
8. For persisted UX preferences, add unit tests for storage migration/fallback/reset behavior.
