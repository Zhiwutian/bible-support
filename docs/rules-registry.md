# Rules Registry

This document tracks active Cursor rule files under `.cursor/rules/`.

## Purpose

- Keep a single index of rule intent and scope.
- Make rule updates auditable in PRs.
- Avoid duplicated or conflicting rule behavior.

## How rules fit together (quick map)

| Situation               | Primary rules                                                           |
| ----------------------- | ----------------------------------------------------------------------- |
| Idea / “should we…”     | `honest-feedback-on-ideas`                                              |
| Before commit           | `pre-commit-quality-gate` + `secret-commit-approval-gate`               |
| Before release / deploy | `release-readiness-checks`                                              |
| Auth, env, logging      | `auth-secrets-safety` (+ observability doc in styleguide)               |
| API / shared types      | `api-contract-discipline` + often `backend-api-boundaries`              |
| Schema / migrations     | `db-migration-safety`                                                   |
| UI / a11y               | `style-enforcement-frontend` + `frontend-accessibility-guard`           |
| API mocks / MSW         | `api-contract-discipline` (includes `client/src/test/handlers.ts` glob) |

## Active Rules

| Rule File                                        | Intent                                                                      | Activation      | Primary Use Stage                         |
| ------------------------------------------------ | --------------------------------------------------------------------------- | --------------- | ----------------------------------------- |
| `.cursor/rules/pre-commit-quality-gate.mdc`      | Core pre-commit checks for quality/docs/DB/deploy readiness                 | Always-on       | Pre-commit and PR readiness               |
| `.cursor/rules/release-readiness-checks.mdc`     | Ensure final verification and deploy-safe checks                            | Always-on       | Pre-deploy/release validation             |
| `.cursor/rules/secret-commit-approval-gate.mdc`  | Block secret-like file commits without explicit user approval               | Always-on       | Staging and commit preparation            |
| `.cursor/rules/honest-feedback-on-ideas.mdc`     | Respectful, direct feedback on ideas (risks, alternatives, not auto-yes)    | Always-on       | Planning, design, and product discussions |
| `.cursor/rules/auth-secrets-safety.mdc`          | Prevent secret leaks and unsafe auth logging/config patterns                | Scoped by globs | Auth/env/logging changes                  |
| `.cursor/rules/api-contract-discipline.mdc`      | Keep API behavior, contracts, tests, and docs synchronized                  | Scoped by globs | API/contract changes                      |
| `.cursor/rules/db-migration-safety.mdc`          | Enforce schema-to-migration parity and safe DB evolution                    | Scoped by globs | DB/schema changes                         |
| `.cursor/rules/frontend-accessibility-guard.mdc` | Preserve accessibility and UI consistency standards                         | Scoped by globs | Frontend/UI changes                       |
| `.cursor/rules/style-enforcement-frontend.mdc`   | Enforce styleguide-aligned UI generation with explicit pre-generation steps | Scoped by globs | Frontend UI generation/edits              |
| `.cursor/rules/backend-api-boundaries.mdc`       | Enforce backend layering and contract discipline in server code             | Scoped by globs | Backend route/controller/service changes  |

## Update Workflow

When adding or changing rules:

1. Edit/create the relevant `.mdc` file in `.cursor/rules/`.
2. Update this registry table in the same PR.
3. If rule intent affects team workflow, update `docs/development-workflow.md`.

## Planning Mode Deferral

- In planning mode, pre-commit/release validation commands are deferred.
- Always-on quality/release rules should be interpreted as execution-mode gates, not planning-mode actions.
- Planning responses may reference last-known check status, but should not present it as fresh execution output.
