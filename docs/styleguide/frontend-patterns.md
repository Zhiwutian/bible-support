# Frontend Patterns

## Structure

- App shell + routes: `client/src/App.tsx`
- Route pages: `client/src/pages/*`
- Feature modules: `client/src/features/*`
- UI primitives: `client/src/components/ui/*`
- App-level providers/components: `client/src/components/app/*`
- Shared utils: `client/src/lib/*`

## State Management

- Use local `useState` for page/feature-owned async state.
- Use `client/src/state` Context + reducer for app-wide UI settings only.
- Keep server-loaded data request-driven through feature API modules.

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

## Styling Pattern

- Tailwind utilities first.
- Use `cn` helper for conditional classes.
- Prefer `client/src/components/ui` primitives over one-off ad-hoc markup.
- Keep global style concerns in `client/src/index.css` only when shared broadly.
- Keep utility intent explicit: avoid mixing project-wide remapped utility names (for example `text-base`) on elements that need fixed, exception typography.
- Use arbitrary utility values for one-off exceptions; if repeated in 2+ places, promote to tokenized utility or shared primitive.
- For shell-level branding/layout clusters repeated across header/menu/modal, extract a small shared presentational component.

## Accessibility Pattern

- Keep controls labeled and keyboard reachable.
- Use modal primitives (`ModalShell`) for dense mobile options.
- Preserve Escape/outside-click modal behavior consistency.
- Validate high-contrast and text-scale behavior for changed views.
- Keep landing and auth-entry actions operable with keyboard and large text scales.
- Treat app-wide high-contrast overrides as a controlled global layer; avoid adding new `!important` rules outside accessibility scope.

## Routing and Entry Pattern

- App shell decides entry state:
  - authenticated users: full route set
  - unauthenticated users: landing first, then guest mode or login
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

## Form and Selector Consistency

- Prefer select inputs when users are choosing one mode from a small predefined list (for example `Search Type`).
- Keep labels explicit and task-oriented (`Search Type`, `Display settings`, `Support`).

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
