# Emotion pages — high contrast spot check

Manual pass to verify **Scriptural Support** (emotion tiles) and the **emotion scripture viewer** stay readable when **High contrast** is enabled in the app shell.

## When to run

- After changing **`client/src/index.css`** global mode blocks (`.app-high-contrast`, `.app-dark-mode`) or emotion-specific markup/classes.
- Before release if display settings or Support routes changed materially.

## Preconditions

1. Client dev server running (e.g. `pnpm -C client run dev`). Note the port Vite prints (e.g. `http://localhost:5175/`).
2. Use **High contrast only** first: turn **Dark mode** **off** in **Menu → Display settings** so you are not mixing dark + high contrast unless you intend to test that combo.

## Steps

1. Open the app → **Continue as guest**.
2. **Menu → Display settings** → enable **High contrast** → apply/save so the shell uses **`app-high-contrast`** (white background, black text on slate-based utilities per `index.css`).
3. **Support home** (`/`): scan emotion tiles — body copy using **`text-slate-*`** should read as **black** on **white** cards. Theme accents use **`text-indigo-*`**, **`text-red-*`**, etc.; those are **not** rewritten by the global high-contrast slate rule and should remain **dark on light** (tinted card backgrounds from emotion themes).
4. Open one category (e.g. **I Am Afraid**): check **page title**, **translation** and **actions** panels (slate utilities → black), **reference** line (hue utilities), and the **verse block** inside **`ReaderSurface`** (reader theme tokens; reader surfaces preserve variables under global modes).
5. Optional: repeat with **Dark mode** **on** as well if you need to validate **dark + high contrast** together (narrower real-world use).

## If something fails

- **Slate-colored text** wrong in HC: check **`.app-high-contrast [class*='text-slate-']`** and competing rules in `index.css` (order and `!important`).
- **Hue-colored text** (e.g. `text-indigo-900`) wrong in HC: emotion themes intentionally avoid the slate substring matcher; fix in **`emotion-theme.ts`** or a scoped **`.app-high-contrast .emotion-support-page`** rule if product requires different HC ink.
- **Reader verse** wrong: see **`.app-high-contrast .reader-root`** / **`.reader-chapter-text`** overrides in `index.css`.

## Related code

- Global mode CSS: **`client/src/index.css`** (section map comment before high-contrast overrides).
- Emotion pages: **`client/src/pages/EmotionsPage.tsx`**, **`client/src/pages/EmotionScripturePage.tsx`**, wrapper **`emotion-support-page`**; dark-mode hue overrides are **dark-only** (`.app-dark-mode .emotion-support-page`).
