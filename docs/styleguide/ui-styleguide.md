# UI Styleguide

This document tracks the current UI design system and implementation standards.

## Principles

- Prioritize readability and calm visual hierarchy.
- Keep interactions obvious for all ages, including elderly users.
- Prefer consistency over novelty across pages and controls.
- Preserve accessibility defaults (text scale + high contrast) across routes.

## Design Tokens

Global tokens and primitives are in `client/src/index.css`.

- Text scale tokens:
  - `--app-text-scale-sm`
  - `--app-text-scale-md`
  - `--app-text-scale-lg`
  - `--app-text-scale-xl`
- Modal primitives:
  - `.ui-modal-backdrop`
  - `.ui-modal-panel`
- Accessibility scope class:
  - `.app-high-contrast`

When introducing new global visual behavior, add tokenized CSS in `index.css` and document it here.

## Typography and Text Scale

Supported display sizes:

- `Small`
- `Medium`
- `Large`
- `XL`

Implementation:

- App shell applies one of:
  - `.app-text-scale-sm`
  - `.app-text-scale-md`
  - `.app-text-scale-lg`
  - `.app-text-scale-xl`
- Utility text classes are remapped within each scale scope.
- Form controls inherit tuned size rules for readability.

Do not add ad-hoc per-page scale logic; use global text-scale classes.

## Color and Contrast

- Default page shell uses sky/slate palette.
- High-contrast mode enforces black text, white backgrounds, and strong borders.
- High-contrast behavior is globally scoped through `.app-high-contrast`.

Any new component must remain legible in both normal and high-contrast modes.

## Spacing and Layout

- Use Tailwind spacing scale for component layout.
- Keep max content width constrained (`max-w-*`) for long-form readability.
- Maintain minimum touch target height (`min-h-11` or larger) for interactive controls.

## Interactive Components

- Use shared UI components from `client/src/components/ui` when possible.
- Use modal interactions for dense option sets on mobile.
- Ensure Escape-key and outside-click behavior is consistent with existing modal/menu patterns.
- Use clear success/error toast messaging for auth and data mutations.

## Navigation

- Header remains sticky on mobile and desktop.
- Mobile navigation uses hamburger + overlay, and blocks background interaction when open.
- Desktop navigation uses a hybrid left-nav model:
  - `md/lg`: overlay drawer opened from header `Menu` button
  - `xl+`: pinned left sidebar with explicit collapse/expand toggle
- Menu actions should close the menu before navigation/action side effects.
- Guest mode should display a clear but non-blocking sign-in CTA in shell chrome.

## Forms and Inputs

- Use clear labels and predictable control order.
- On mobile, prefer larger tap targets and readable labels.
- Keep select/options language simple and explicit.
- For profile metadata forms:
  - keep field-level validation visible near each input
  - include live avatar preview when avatar URL is editable
  - allow users to clear optional profile fields

## Icons and Buttons

- Use simple line icons with consistent stroke weight.
- Primary actions use high-contrast, filled styles.
- Secondary actions use bordered neutral styles.
- Destructive actions require confirmation.

## Component Styling Rules

- Prefer Tailwind utilities in component files.
- Use global CSS only for:
  - app-wide tokens
  - global accessibility layers
  - reusable primitives used across many components
- Avoid one-off custom CSS files unless a pattern is reused.

## Change Process

When UI styles change:

1. Update implementation.
2. Update this styleguide with new standards/tokens.
3. Update screenshots or behavior docs when relevant (`README.md`, `docs/verse-search-save.md`).
