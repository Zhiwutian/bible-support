# Proposals

This directory stores forward-looking implementation proposals for project updates.

Use proposals when:

- The change is large or architectural.
- There are multiple implementation options/trade-offs.
- You want a reviewed plan before code changes begin.

Suggested proposal structure:

1. Goal and non-goals
2. Current-state summary
3. Recommended approach
4. Data model and API changes
5. Security/privacy considerations
6. Rollout and migration plan
7. Test plan
8. Risks and mitigations
9. Open questions

Current proposals:

- `full-application-review.md` — phased full-stack review: code/docs cleanup, FE/BE optimization, functionality + test gaps, security, a11y, supply chain, telemetry, CI/release
- `workout-tracker-build-plan.md` — pointer to **`workout-tracker/docs/proposals/workout-tracker-build-plan.md`** (course / standalone app build plan)
- `oauth-email-login-minimal-pii.md`
- `same-site-domain-auth-session-strategy.md`
- `company-domain-multi-app-subdomain-strategy.md`
- `ui-scale-nav-landing-profile-refresh.md`
- `ui-shell-support-consistency-refresh.md`
- `support-scripture-candidates-stress-guilt-refresh.md`
- `scripture-reader-multisave-notes-rollout.md`
- `reader-comfort-customization-research.md`
- `reader-styles-bookmarks-account-sync.md`
- `bible-support-reader-ui-hybrid.md` — hybrid reader (`/reader` + embedded `ReaderSurface`), Full Context → Reader, mobile overflow, prayer confirm modal, saved/support emphasis in chapter
- `reader-mobile-fullscreen.md` — reader tools sheet + full viewport / Fullscreen API + safe-area fallback on **all viewports** (responsive sheet layout); verse click isolation
- `translation-support-tutorial-study-links.md` — global translation preference (localStorage, overrides URL), tutorial dark-mode prose, support scripture layout (no swipe), outbound Bible.com/BibleGateway study links (no YouVersion study API)
