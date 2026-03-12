# Rules Registry

This document tracks active Cursor rule files under `.cursor/rules/`.

## Purpose

- Keep a single index of rule intent and scope.
- Make rule updates auditable in PRs.
- Avoid duplicated or conflicting rule behavior.

## Active Rules

| Rule File                                        | Intent                                                                      | Activation      | Primary Use Stage                        |
| ------------------------------------------------ | --------------------------------------------------------------------------- | --------------- | ---------------------------------------- |
| `.cursor/rules/pre-commit-quality-gate.mdc`      | Core pre-commit checks for quality/docs/DB/deploy readiness                 | Always-on       | Pre-commit and PR readiness              |
| `.cursor/rules/release-readiness-checks.mdc`     | Ensure final verification and deploy-safe checks                            | Always-on       | Pre-deploy/release validation            |
| `.cursor/rules/auth-secrets-safety.mdc`          | Prevent secret leaks and unsafe auth logging/config patterns                | Scoped by globs | Auth/env/logging changes                 |
| `.cursor/rules/api-contract-discipline.mdc`      | Keep API behavior, contracts, tests, and docs synchronized                  | Scoped by globs | API/contract changes                     |
| `.cursor/rules/db-migration-safety.mdc`          | Enforce schema-to-migration parity and safe DB evolution                    | Scoped by globs | DB/schema changes                        |
| `.cursor/rules/frontend-accessibility-guard.mdc` | Preserve accessibility and UI consistency standards                         | Scoped by globs | Frontend/UI changes                      |
| `.cursor/rules/style-enforcement-frontend.mdc`   | Enforce styleguide-aligned UI generation with explicit pre-generation steps | Scoped by globs | Frontend UI generation/edits             |
| `.cursor/rules/backend-api-boundaries.mdc`       | Enforce backend layering and contract discipline in server code             | Scoped by globs | Backend route/controller/service changes |

## Update Workflow

When adding or changing rules:

1. Edit/create the relevant `.mdc` file in `.cursor/rules/`.
2. Update this registry table in the same PR.
3. If rule intent affects team workflow, update `docs/development-workflow.md`.
