# Proposal: UI Scale, Navigation, Landing, and Profile Refresh

## Goal

Implement a cohesive UX refresh that improves readability and navigation while introducing clearer unauthenticated entry paths and basic user profile management.

## Why This Is Grouped

These changes are intentionally bundled because they affect the same app-shell surfaces:

- text-size system and readability baseline
- desktop navigation layout
- unauthenticated entry behavior
- authenticated user account surfaces

Implementing them together avoids conflicting shell-level rewrites and enables one coordinated validation pass.

## Scope

1. Rebase text sizing so current `Large` becomes new `Small`, then scale up for `Medium`, `Large`, `XL`.
2. Replace crowded desktop header nav with hybrid left navigation:
   - overlay drawer on `md`/`lg`
   - pinned collapsible sidebar on `xl+`
3. Rename visible shell branding to `Scripture & Solace`.
4. Add unauthenticated landing screen with:
   - `Continue with Google`
   - `Continue as Guest` (full guest experience)
5. Add editable basic profile page for authenticated users:
   - `displayName`
   - `avatarUrl`
6. Add login return-path (`next`) support.
7. Add guest-mode indicator + sign-in CTA.
8. Add avatar preview + field-level validation feedback.
9. Add lightweight telemetry-ready hook points for landing/profile actions.

## Non-Goals

- New auth provider integrations
- Profile schema expansion beyond existing fields
- Role model or permissions redesign
- Full analytics provider integration

## Current-State Summary

- App shell, nav, modal controls, and auth state bootstrap live in `client/src/App.tsx`.
- Text scale system is global via `client/src/index.css` and `client/src/state`.
- Auth session state comes from `GET /api/auth/me`.
- Profile fields (`displayName`, `avatarUrl`) already exist in `users`.
- Facebook is env-gated through `AUTH_SOCIAL_FACEBOOK_ENABLED`.

## Proposed Approach

### 1) Text-Scale Rebase

- Update scale tokens and utility remaps in `client/src/index.css`.
- Preserve existing labels (`Small`, `Medium`, `Large`, `XL`) while shifting magnitudes upward.
- Keep persistence compatibility in `client/src/state/AppStateProvider.tsx`.

### 2) Hybrid Desktop Left Navigation

- Refactor shell layout in `client/src/App.tsx`:
  - keep current mobile behavior
  - desktop `md/lg`: overlay left drawer
  - desktop `xl+`: pinned collapsible sidebar
- Keep Escape/outside-click close behavior where overlay is used.

### 3) Branding Update

- Replace visible shell name with `Scripture & Solace` in app chrome.
- Ensure title/fallback shell labels stay aligned.

### 4) Landing + Guest Entry

- Add unauthenticated landing page under `client/src/pages`.
- Logged-out users see landing first.
- Authenticated users bypass landing.
- `Continue as Guest` enters full app routes without requiring auth.

### 5) Login Return Path

- Preserve intended destination through login using a `next` query convention.
- On successful auth callback handling, restore route intent when valid.

### 6) Editable Basic Profile Page

- Add profile page under `client/src/pages`.
- Add client auth/profile API module in `client/src/features/auth`.
- Add backend authenticated profile update endpoint:
  - controller in `server/controllers/auth`
  - service update logic in `server/services/auth-service.ts`
  - route in `server/routes/api.ts`
  - shared request/response contract in `shared/auth-contracts.ts`
- Reuse existing DB field limits and URL validation expectations.

### 7) Guest Indicator + CTA

- Add subtle guest-mode state indicator in app shell when unauthenticated.
- Include a direct sign-in action that opens/uses existing login flow.

### 8) Avatar UX Improvements

- Profile page shows live avatar preview.
- Field-level validation messaging for invalid/unsupported URLs.

### 9) Telemetry-Ready Hooks

- Add provider-agnostic event hook points:
  - `landing_login_click`
  - `landing_guest_continue`
  - `profile_save_success`
  - `profile_save_failure`
- Keep implementation no-op safe when no analytics backend is attached.

## Files Expected To Change

- `client/src/App.tsx`
- `client/src/index.css`
- `client/src/state/AppStateProvider.tsx`
- `client/src/state/app-state-store.ts` (if state flags need extension)
- `client/src/pages/*` (new landing/profile pages)
- `client/src/features/auth/*`
- `server/controllers/auth/*`
- `server/services/auth-service.ts`
- `server/routes/api.ts`
- `shared/auth-contracts.ts`
- documentation files under `docs/`

## Test Plan

- Manual UX validation:
  - text-size behavior for all four options
  - desktop nav behavior across breakpoints
  - landing/authenticated bypass logic
  - guest entry path
  - profile save + avatar preview/validation
  - login return-path behavior
- Automated checks:
  - `pnpm -C server test`
  - `pnpm -C client test`
  - `pnpm run tsc`
  - `pnpm run lint`
  - `pnpm run build`

## Risks and Mitigations

- **Shell complexity risk** (many changes in one component)  
  Mitigation: split new shell pieces into focused components as needed.

- **Auth route regressions** (landing/guest/authenticated routing)  
  Mitigation: add explicit route/guard coverage in client tests.

- **Profile validation drift** (frontend/back-end mismatch)  
  Mitigation: keep contract + validation logic aligned and test failure paths.

## Rollout Strategy

1. Implement shell/layout changes first (text scale + nav + brand).
2. Add landing/guest flow and return-path.
3. Add profile edit endpoint + profile UI.
4. Add telemetry hook points.
5. Run full verification and docs sync.

## Open Follow-Ups

- Decide whether to expose profile editing only for authenticated users (default) or provide guest “draft profile” UX later.
- Decide whether guest indicator remains permanently visible or dismissible.
