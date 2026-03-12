# Rules Usage Guide

This guide explains how Cursor rules work in this project and how to enforce coding standards effectively.

## How Rules Are Applied

Rules in `.cursor/rules/*.mdc` influence agent behavior using frontmatter:

- `alwaysApply: true` -> considered for every task.
- `globs: ...` -> considered when matching files are in scope.
- `alwaysApply: false` + `globs` -> focused, context-specific guidance.

Rules are guidance for generation decisions. They are strongest when specific and actionable.

## Soft Guidance vs Hard Enforcement

Rules guide behavior, but hard enforcement should come from tooling:

1. Lint/type checks (`pnpm run lint`, `pnpm run tsc`)
2. Tests (`pnpm run test`)
3. Build check (`pnpm run build`)
4. CI gates (`docs-policy`, `db-migration-policy`, quality job)
5. Pre-commit discipline (project rule + local checks)

Use both:

- Rules for consistent intent.
- Tooling for deterministic enforcement.

## Writing Effective Rules

For each rule:

- Keep one concern per file.
- State what to do and what to avoid.
- Include explicit pre-generation steps when needed.
- Reference source-of-truth docs (for example `docs/styleguide.md`).
- Keep rules concise and practical.

## Recommended Rule Types

- Always-on core rule (pre-commit quality gate).
- Security/auth secrets rule.
- API contract + test + docs synchronization rule.
- DB migration parity/safety rule.
- Frontend accessibility/style consistency rule.
- Release-readiness verification rule.
- Glob-scoped frontend/backend rules for context-aware behavior.

## How To Add a New Rule

1. Create a file in `.cursor/rules/`:

```md
---
description: Short description
globs: client/src/**/*.tsx
alwaysApply: false
---
```

2. Add concise rule content (purpose, required steps, constraints).
3. Update `docs/rules-registry.md` with the new rule entry.
4. If workflow expectations changed, update `docs/development-workflow.md`.

## Current Project Standard

- Use focused rule files (one concern per file).
- Keep only pre-commit/release rules always-on; keep domain rules glob-scoped.
- Keep CI docs/migration/quality gates as hard blockers.
- Update docs/changelog with behavior changes in the same PR.
