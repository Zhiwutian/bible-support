# Reader comfort — Phase 3 & 4 execution status

Tracks implementation against `docs/proposals/reader-comfort-customization-research.md` **Phase 3** (a11y + eyestrain) and **Phase 4** (rollout + telemetry).

## Phase 3 — Accessibility + eyestrain

| Deliverable                                     | Status      | Notes                                                                                                                                                                              |
| ----------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reduced motion in reader                        | **Shipped** | Preference + `reader-reduced-motion` on `.reader-root`; CSS in `client/src/index.css` minimizes animation/transition duration.                                                     |
| OS default for reduced motion                   | **Shipped** | `loadReaderPreferences()` / fresh install uses `prefers-reduced-motion` when no stored prefs (`reader-preferences.ts`).                                                            |
| High-contrast interoperability                  | **Shipped** | `.app-high-contrast` rules preserve reader tokens on `.reader-content` / break reminder (`index.css`). In-app messaging in Reader Options points users to Menu → Display settings. |
| Break reminder (non-blocking)                   | **Shipped** | `ReaderBreakReminder.tsx` + dismiss + `reader_break_tip_dismissed` telemetry.                                                                                                      |
| Automated: reduced motion + high contrast combo | **Tests**   | See `client/src/App.test.tsx` (hydrated high contrast + reader classes; reduced-motion class when pref on).                                                                        |
| Automated: text scale × reader                  | **Tests**   | App text scale (`app-text-scale-*`) + reader font size classes coexist; spot-check via localStorage + reader root still present.                                                   |
| Cross-browser matrix                            | **Manual**  | Use checklist below before major releases.                                                                                                                                         |

### Manual cross-browser checklist (spot)

Run after meaningful Reader or global display changes:

- [ ] Chrome: Reader Options keyboard flow (Tab order, Escape closes modals).
- [ ] Safari (iOS if applicable): scrollable chapter + Options modal scroll.
- [ ] Firefox: theme + high contrast + reduced motion together.
- [ ] Optional: `prefers-reduced-motion: reduce` system setting with fresh guest profile.

## Phase 4 — Staged rollout + tuning

| Deliverable              | Status               | Notes                                                                                                                                                                                              |
| ------------------------ | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Feature flag             | **Shipped**          | `VITE_READER_COMFORT_ENABLED` (`BibleReaderPage`, `client/.env.example`).                                                                                                                          |
| Rollback / dark launch   | **Documented**       | `docs/development-workflow.md` → **Reader Comfort Rollout Checklist**.                                                                                                                             |
| Telemetry (privacy-safe) | **Shipped + tested** | Documented events + allowlist helper `reader-comfort-telemetry.ts`; Vitest asserts payloads for rollout events.                                                                                    |
| Additional reader events | **Advisory**         | `reader_options_opened`, `reader_style_changed`, `reader_bookmark_set`, `reader_state_cleared` may fire alongside rollout events; payloads must stay free of verse/note **text** (coordinates OK). |

### Rollout events (canonical three)

- `reader_preference_changed` — `{ key: string, value: string | boolean }` (primitive preference value only).
- `reader_preferences_reset` — no payload.
- `reader_break_tip_dismissed` — no payload.

## Related paths

- Reader UI: `client/src/pages/BibleReaderPage.tsx`, `client/src/features/reader/*`
- Tokens: `client/src/index.css`
- Product spec: `docs/proposals/reader-comfort-customization-research.md`
