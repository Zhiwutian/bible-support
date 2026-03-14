# Styleguide

This directory contains implementation-focused guides for UI conventions, architecture patterns, and extension workflows.

## Documents

- `ui-styleguide.md`
  - UI tokens, accessibility rules, and component styling conventions
- `code-patterns.md`
  - Cross-stack coding patterns, layering rules, and extension checklists
- `frontend-patterns.md`
  - Frontend structure, state, API, and component composition patterns
- `backend-patterns.md`
  - Backend route/controller/service/auth/rate-limit patterns
- `database-patterns.md`
  - Drizzle schema, SQL parity, migration, and DB change workflow

## How To Use

- Before adding a new feature, read `code-patterns.md` and the stack-specific pattern file(s).
- Prefer extending existing patterns over introducing new architectural styles.
- When architecture or behavior changes, update the relevant styleguide document in the same PR.
