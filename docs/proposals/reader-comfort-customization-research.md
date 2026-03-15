# Reader Comfort Customization Research Proposal

## Goal

Create a highly comfortable, intuitive Reader experience that supports long-form reading with evidence-based defaults and the most common customization controls used in mature reading apps.

## Non-Goals

- Build a full EPUB-style pagination engine in this phase.
- Add account-synced cloud preferences in this phase.
- Introduce experimental typography features that reduce consistency (per-character spacing overrides, novelty effects).

## Scope Confirmed

- Device priority: balanced across mobile, tablet, and desktop.
- Implementation posture: incremental by phase, but complete overall.
- Customization scope: full controls in roadmap (`Theme`, `Typography`, `Layout`, `Accessibility`) with strict testing gates at each phase.

## Research Summary and Product Implications

## 1) Eye-Comfort Color Schemes for Digital Reading

### Findings

- WCAG 2.2 requires:
  - minimum contrast ratio `4.5:1` for normal-size text,
  - minimum `3:1` for large text.
- Pure `#000` on `#fff` (and the inverse) can feel harsh over long sessions.
- Most successful reading products offer multiple comfort themes (commonly light, sepia, dark) so users can match ambient light and personal preference.

### Product Decision

Reader should ship with 3 comfort presets:

- **Light**: off-white background + dark charcoal text.
- **Sepia**: warm paper-like background + deep brown text.
- **Dark**: very dark gray background + soft near-white text.

All theme pairs must meet WCAG AA contrast.

## 2) Common Reading Implementations in Kindle-like Apps

### Findings

Kindle-style reading apps consistently expose:

- font family selection,
- font size,
- line spacing,
- margins/content width,
- preset themes,
- saved reading profiles/themes.

### Product Decision

Reader settings should use the same mental model:

- grouped controls (`Theme`, `Typography`, `Layout`, `Accessibility`),
- fast preview while adjusting,
- saved preferences that persist across sessions on the same device,
- one-click reset to recommended defaults.

## 3) Readable Typefaces + Spacing for Screens

### Findings

- Practical body text guidance:
  - line length around `45-75` characters per line (ideal around mid-band),
  - line-height typically around `1.5` for long-form reading comfort,
  - left-aligned paragraphs outperform justified text for readability on web.
- Readers benefit from clear, familiar typefaces and predictable rhythm.

### Product Decision

Ship with a constrained, readable font set:

- Serif option for book-like reading.
- Sans option for clean UI-style reading.
- Accessibility option (existing or future dyslexia-friendly mode).

Default typography baseline:

- font size: medium-large comfortable baseline,
- line-height: `1.55` default,
- paragraph spacing: modest separation,
- max content width tuned to maintain line-length target at each breakpoint.

## 4) Programmer Actions to Reduce Eyestrain

### Findings

Common eyestrain contributors:

- glare and poor contrast pairing,
- dense text and tight spacing,
- long continuous near-focus sessions,
- motion-heavy UI behavior.

Practical mitigation patterns:

- provide theme choices for environment and preference,
- enforce readable typography defaults,
- support reduced motion,
- include subtle, non-intrusive break guidance (e.g., 20-20-20 principle),
- avoid blinking/marquee-like distractions.

### Product Decision

Reader should include:

- reduced motion compatibility,
- optional lightweight “reading break reminder” hint (non-blocking),
- stable, low-animation settings UX.

## Required Information Architecture

Reader settings are grouped and surfaced as:

- **Theme**
  - Light / Sepia / Dark
- **Typography**
  - Font family
  - Font size
  - Line height
  - Paragraph spacing
- **Layout**
  - Content width / margins
  - Optional alignment policy display (left-aligned default)
- **Accessibility**
  - Reduced motion
  - High-contrast compatibility messaging/state
  - Reset reader settings

## Default Profile Strategy (Required)

Balanced-device default profile:

- Theme: `Sepia` (comfortable cross-environment baseline)
- Font family: serif reading font
- Font size: medium
- Line-height: `1.55`
- Paragraph spacing: medium
- Content width:
  - mobile: near-full width with safe side padding,
  - tablet/desktop: constrained width targeting recommended character count.
- Alignment: left-aligned body text.
- Reduced motion: respect OS preference by default.

## Content Rendering Policy (Required)

- Maintain structured verse display while optimizing long-form readability.
- Verse numbers remain visible but should not dominate reading flow.
- Preserve paragraph/line wrapping behavior with no forced horizontal scroll.
- Avoid justified full-width text for the main reading body.

## Persistence, Versioning, and Reset Policy (Required)

- Persistence: local device storage (client-side), reader-specific preference keys.
- Versioning: add a preferences schema version to support future migrations.
- Reset: one control resets all Reader preferences to default profile.
- URL policy: keep chapter URL params for scripture navigation only; do not encode comfort settings in URL.

## Performance Budget and Constraints (Required)

- Settings changes must feel immediate and not introduce visible jank.
- Theme/typography toggles should avoid layout thrash and heavy repaint patterns.
- Reader remains responsive on low-end mobile devices.

## Success Metrics (Required)

- Settings adoption rate (users who change at least one reader setting).
- Session comfort proxy metrics:
  - longer continuous reader sessions,
  - lower immediate bounce from Reader route.
- Stability metrics:
  - low “reset to defaults” churn after repeated use,
  - no increase in readability-related support issues.
- Accessibility metrics:
  - pass rate for contrast and keyboard tests across themes/controls.

## Privacy and Telemetry Boundaries (Required)

- Collect only aggregated UI preference interactions.
- Never log verse text content, note content, or sensitive user data.
- Avoid user-identifying analytics payloads for reading preference events.

## Incremental Rollout Plan with Phase Gates

### Phase 1: Research + Defaults Baseline

Deliverables:

- final research synthesis,
- default profile specification,
- success metrics + telemetry boundaries.

Must-pass test gate:

- contrast validation for baseline themes,
- breakpoint readability spot checks (mobile/tablet/desktop),
- product sign-off on defaults and measurement plan.

### Phase 2: Core Reader Controls + Persistence

Deliverables:

- Theme/Typography/Layout controls,
- responsive settings UI,
- persistence + reset.

Must-pass test gate:

- unit tests for settings state and persistence,
- integration tests for live Reader updates,
- keyboard/focus accessibility checks,
- no-jank performance smoke tests.

### Phase 3: Accessibility + Eyestrain Enhancements

Deliverables:

- reduced-motion support in reader interactions,
- high-contrast interoperability,
- optional non-intrusive break reminder pattern.

Must-pass test gate:

- reduced-motion + high-contrast combination tests,
- text-scale compatibility verification (`Small/Medium/Large/XL`),
- cross-browser matrix checks.

### Phase 4: Staged Rollout + Tuning

Deliverables:

- feature-flag rollout plan (`VITE_READER_COMFORT_ENABLED`),
- staged release checklist,
- rollback criteria and tuning loop.

Must-pass test gate:

- telemetry payload privacy validation,
- staged rollout dry run and rollback rehearsal,
- no regressions in existing reader route tests.

Phase 4 implementation note:

- Reader comfort settings UI is controlled by `VITE_READER_COMFORT_ENABLED` to support dark-launch and quick rollback.
- Telemetry hooks emit only interaction metadata:
  - `reader_preference_changed`
  - `reader_preferences_reset`
  - `reader_break_tip_dismissed`

## Test Matrix (Global)

- **Accessibility**
  - WCAG AA contrast by theme,
  - keyboard-only control interaction,
  - focus visibility and control order.
- **Readability**
  - character-per-line bounds by breakpoint,
  - line-height and spacing behavior across font sizes,
  - long chapter readability checks.
- **Performance**
  - interaction responsiveness on mobile and desktop,
  - no perceptible jank during setting changes.
- **Regression**
  - chapter navigation still stable,
  - “Back to Support Verse” context return still works.

## Risks and Mitigations

- **Risk:** too many settings overwhelm users.
  - **Mitigation:** sensible defaults + grouped controls + reset button.
- **Risk:** accessibility regressions across theme combinations.
  - **Mitigation:** strict contrast and keyboard test gates before each phase promotion.
- **Risk:** performance issues from dynamic typography/theme changes.
  - **Mitigation:** CSS-variable-driven implementation and explicit performance checks.

## Documentation and Implementation Touchpoints

- Reader route UI: `client/src/pages/BibleReaderPage.tsx`
- Global tokens/styles: `client/src/index.css`
- UI standards: `docs/styleguide/ui-styleguide.md`
- Frontend architecture patterns: `docs/styleguide/frontend-patterns.md`

## References

- [W3C WCAG 2.2 Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- [web.dev Typography Guidance](https://web.dev/learn/design/typography)
- [WebAIM Text/Typographical Layout](https://webaim.org/techniques/textlayout)
- [How to Customize Text on Kindle](https://www.howtogeek.com/734656/how-to-customize-text-on-your-kindle/)
- [American Optometric Association: Computer Vision Syndrome](https://www.aoa.org/healthy-eyes/eye-and-vision-conditions/computer-vision-syndrome)
