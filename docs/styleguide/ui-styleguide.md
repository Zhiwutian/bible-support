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

## Reader Comfort Settings

Reader-specific controls should be grouped into:

- `Theme`
- `Typography`
- `Layout`
- `Accessibility`

Reader controls are expected to:

- keep scripture navigation params (`book`, `chapter`, `translation`) separate from comfort preferences,
- persist comfort preferences locally with a versioned payload,
- include a one-click reset to Reader defaults,
- use route-scoped CSS tokens/variables for theme and typography changes.
- include an optional non-intrusive break reminder pattern that can be dismissed or turned off.

Default Reader baseline should prioritize long-form comfort:

- sepia theme,
- medium font size,
- relaxed line height,
- balanced content width.

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
- Navigation uses a single hamburger-triggered left overlay menu on all viewports.
- Overlay menu opens over app content with a transparent blocker that prevents background interaction.
- Overlay menu should be structured with sections:
  - `Navigation`
  - `Account`
  - `Display`
- Menu actions should close the menu before navigation/action side effects.
- Auth controls (sign in/sign out) and account identity should appear in menu `Account` section, not in header chrome.
- Header keeps logo + `Scripture & Solace` consistently in top-left for desktop and mobile.

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

## Tailwind Alignment Notes

This project follows Tailwind's utility-first guidance:

- Keep most styling in markup-level utilities so changes stay local and predictable.
- Use responsive variants (`sm:`, `md:`, `lg:`...) as mobile-first overrides (unprefixed = mobile baseline).
- Use arbitrary values (`text-[3rem]`, `max-w-[1400px]`) for true one-offs only.
- Promote repeated arbitrary values into shared tokens/utilities in `client/src/index.css`.

References:

- [Tailwind utility-first docs](https://tailwindcss.com/docs/utility-first)
- [Tailwind responsive design docs](https://tailwindcss.com/docs/responsive-design)
- [Tailwind reusing styles docs](https://tailwindcss.com/docs/reusing-styles)

## Cascade and Specificity Guardrails

- Avoid depending on utility names like `.text-base` as global override hooks when possible; this is prone to accidental collisions.
- For "exception typography" (brand wordmarks, hero lockups), use dedicated utilities/classes and avoid common remapped utility names in the same element.
- Treat `!important` as a constrained accessibility escape hatch only (for app-wide high-contrast enforcement). Do not introduce new `!important` rules for normal theming.
- Prefer scoped semantic wrappers (`.app-high-contrast`, component root classes) over broad substring selectors.

Reference:

- [MDN specificity guidance](https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity)

## Change Process

When UI styles change:

1. Update implementation.
2. Update this styleguide with new standards/tokens.
3. Update screenshots or behavior docs when relevant (`README.md`, `docs/verse-search-save.md`).

### Large Frontend Update Review Checklist

Run this checklist for significant UI/CSS/JSX changes (especially app-shell work):

1. **Cascade safety**: confirm no global selectors unintentionally override local utility intent.
2. **Breakpoint behavior**: validate mobile baseline + `sm/md/lg/xl` transitions against intended layout.
3. **Text-scale compatibility**: validate `Small/Medium/Large/XL` across updated pages.
4. **High-contrast compatibility**: validate legibility, borders, focus states, and overlays.
5. **Keyboard/accessibility behavior**: verify Escape/overlay dismissal, focusability, and target sizes.
6. **Class reuse cleanup**: extract repeated class clusters into reusable primitives/components when duplication grows.
