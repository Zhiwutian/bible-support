# Database Patterns

## Sources of Truth

- Drizzle schema: `server/db/schema.ts`
- SQL schema mirror: `database/schema.sql`
- Incremental migrations: `database/migrations/*.sql`

All schema changes should maintain parity across these three layers.

## Migration Strategy

- Prefer additive, non-destructive migrations for hosted DBs.
- Use data backfills only when needed, with explicit predicates.
- Keep migration journal aligned (`database/migrations/meta/_journal.json`).

## Constraint/Index Discipline

- Add checks for domain invariants (positive numeric values, enum-like text constraints).
- Add indexes for query patterns and operational access paths.
- Use unique indexes/partial indexes where ownership scopes differ (for example device vs user).

## DB Change Workflow

1. Update `server/db/schema.ts`.
2. Add migration SQL.
3. Update `database/schema.sql`.
4. Update service query mappings and shared contracts.
5. Add tests around new behavior (conflicts, constraints, ownership rules).
6. Document operational impact and rollout notes.

## Operational Safety

- Hosted bootstrap: `db:migrate` then `db:seed`.
- Avoid destructive reset/import commands against hosted environments.
- Keep environment-driven SSL configuration (`DB_SSL`, `DB_SSL_REJECT_UNAUTHORIZED`).
