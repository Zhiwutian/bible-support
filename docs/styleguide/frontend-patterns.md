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

## Styling Pattern

- Tailwind utilities first.
- Use `cn` helper for conditional classes.
- Prefer `client/src/components/ui` primitives over one-off ad-hoc markup.
- Keep global style concerns in `client/src/index.css` only when shared broadly.

## Accessibility Pattern

- Keep controls labeled and keyboard reachable.
- Use modal primitives (`ModalShell`) for dense mobile options.
- Preserve Escape/outside-click modal behavior consistency.
- Validate high-contrast and text-scale behavior for changed views.

## Adding New Frontend Feature (Checklist)

1. Add shared contracts if API shape changes.
2. Add feature API module under `client/src/features/<feature>/`.
3. Add route page in `client/src/pages/`.
4. Wire route in `client/src/App.tsx`.
5. Reuse `components/ui` primitives where possible.
6. Add/adjust tests in `client/src/*.test.tsx` and mock handlers.
