# Documentation Index

This folder contains maintainable project documentation for application structure, runtime behavior, and team workflow.

## Documents

- `architecture.md`
  - High-level architecture
  - Request lifecycle
  - Data flow and runtime boundaries
- `project-structure.md`
  - Directory ownership and responsibilities
  - Where to add new code as the app grows
- `development-workflow.md`
  - Local setup and daily development loop
  - CI and deployment lifecycle
- `configuration.md`
  - Split frontend/backend env-file model
  - Local file setup and Render/Vercel env mapping
- `styleguide.md`
  - Current UI design standards and accessibility-first styling rules
  - Global tokens/primitives and component styling conventions
- `deployment-render-neon.md`
  - Lightweight free-tier deployment guide
  - Render web service + Neon Postgres setup and smoke verification
- `deployment-vercel-render.md`
  - Split-hosting guide for Vercel frontend + Render API
  - `VITE_API_BASE_URL` and CORS setup for phase-2 free-tier UX
- `deployment/README.md`
  - Main deployment guide with end-to-end step sequence
  - Links to per-service account setup guides
- `deployment/neon-account-setup.md`
  - Neon account/project/database setup checklist
- `deployment/render-account-setup.md`
  - Render account/workspace/service setup checklist
- `deployment/vercel-account-setup.md`
  - Vercel account/project/frontend setup checklist
- `deployment/auth0-setup.md`
  - Auth0 OIDC setup checklist for server-side session auth
  - Callback/logout URL config and auth env mapping
- `proposals/README.md`
  - Proposal index and structure for future project updates
- `proposals/oauth-email-login-minimal-pii.md`
  - Concrete OIDC/OAuth implementation path for email login with minimal PII storage
- `app-startup-walkthrough.md`
  - Step-by-step startup timeline from `pnpm run dev` to first render/API calls
  - Server bootstrap order, route handling path, and error flow
- `conversation-running-log.md`
  - Running record of user prompts and assistant response summaries across this implementation cycle
- `verse-search-save.md`
  - Search-mode UX contract and backend endpoint summary
  - Device-scoped save behavior, hybrid source strategy, and validation steps
  - Translation import/sync workflow and scripture diagnostics endpoint usage

## Documentation Maintenance Rules

- Update docs in the same pull request as behavior changes.
- Keep this folder implementation-aware (actual paths, real scripts).
- Prefer concise docs that explain "why" and "where", not line-by-line code.
- If a script or workflow changes, update `README.md` and this folder together.

## How To Update The Changelog

`CHANGELOG.md` lives at the project root and should be updated in every PR that changes behavior, architecture, tooling, or workflow.

- Add new entries under `## [Unreleased]` in the correct subsection:
  - `Added`
  - `Changed`
  - `Fixed`
  - `Removed`
- Write concise, user-facing summaries of impact (what changed and why it matters).
- Group related file changes into one bullet when possible.
- When cutting a release, move `Unreleased` entries into a dated/versioned section and reset `Unreleased`.

## Test Changed Script Note

For fast local feedback, run:

```sh
pnpm run test:changed
```

To override the diff base ref used by the script:

```sh
TEST_CHANGED_BASE=origin/main pnpm run test:changed
```

## Comment Standards

Use comments to improve maintainability for both humans and AI tools, not to restate obvious code.

- Add JSDoc-style comments to:
  - exported functions
  - non-trivial internal helpers
  - modules with setup/behavioral side effects
- Keep JSDoc concise and practical:
  - one sentence for purpose
  - include important behavior or constraints
  - mention notable return/throw behavior when not obvious
- Add inline comments only for complex logic:
  - fallback behavior
  - non-obvious control flow
  - performance/safety decisions
- Avoid noisy comments:
  - do not explain basic language syntax
  - do not duplicate variable names line-by-line
- If code changes alter behavior, update related comments in the same PR.

## Tailwind UI Standards

- Prefer Tailwind utility classes for component-level styling in `client/src`.
- Keep shared/global styles minimal in `client/src/index.css`.
- If class lists become hard to scan, extract reusable UI components in `client/src/components/ui` instead of adding custom CSS files.
- Use a consistent scale for spacing/colors/typography to keep the UI cohesive across features.
- Prefer `@/` imports (for example, `@/components/ui`, `@/lib`) instead of deep relative paths.

## Import Alias Standards

- In client code, prefer `@/` imports for `client/src/*` modules.
- In server code, prefer `@server/` imports for `server/*` modules.
- Use `@shared/` imports for contracts shared between client and server.
- Keep same-folder imports relative (for example, `./logger.js`) when that is clearer.

## Frontend State and Forms Guidance

- Use `react-hook-form` + `zod` for form validation and submit handling.
- Keep feature form schemas close to feature code (for example, `client/src/features/todos/`).
- Use local `useState` for component-owned state that is not shared.
- Use Context + reducer for lean global UI state used across multiple components.
- Keep API-backed data request-driven in feature components/services unless a dedicated server-state library is introduced.
