# Database constraints & API parity

Cross-reference for Postgres checks, Drizzle (`server/db/schema.ts`), Zod (controllers), and shared contracts. When you change one layer, update the others in the same PR.

## Translation codes

| Layer  | Reader bookmark                                                              | Saved / search / reader chapter                                   |
| ------ | ---------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Shared | `SUPPORTED_SCRIPTURE_TRANSLATIONS` in `shared/scripture-search-contracts.ts` | Same                                                              |
| DB     | `reader_state_bookmark_translation_check` (`KJV`, `ASV`, `WEB`)              | `scripture_verses.translation` (no enum check; corpus is curated) |
| Zod    | `reader-state-controller` bookmark `translation` enum                        | Saved-scripture body `translation` enum                           |

Adding a translation requires: import pipeline, schema/migration if new DB checks, and contract updates.

## Saved scripture items

| Field / rule          | Zod / service                                                                                           | DB check / index                                                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `note` length         | `max(4000)`                                                                                             | `char_length(note) <= 4000`                                                                                                          |
| `sourceMode`          | `z.enum(['local', 'remote'])`; type `SavedScriptureSourceMode` in `shared/saved-scripture-contracts.ts` | `source_mode_check`                                                                                                                  |
| Chapter / verses      | positive ints, `verseEnd >= verseStart`                                                                 | matching checks                                                                                                                      |
| Chapter listing query | `readSavedScripturesForChapter`                                                                         | Partial indexes `saved_scripture_items_owner_chapter_scope_idx`, `saved_scripture_items_device_chapter_scope_idx` (migration `0016`) |

## Scripture verses (reader + search)

| Query pattern                                   | Indexes                                                                   |
| ----------------------------------------------- | ------------------------------------------------------------------------- |
| By translation + book + chapter (+ verse order) | Unique `scripture_verses_unique` on `(translation, book, chapter, verse)` |
| Keyword / ranked search                         | GIN `scripture_verses_text_ts_idx` on `to_tsvector('simple', verseText)`  |
| Reference / ilike fallback                      | `scripture_verses_reference_idx`                                          |

The btree `scripture_verses_book_chapter_verse_idx` on `(book, chapter, verse)` helps mixed filters; primary hot paths include `translation` in `WHERE`, satisfied via the unique index prefix.

## Auth audit

See `shared/auth-audit-contracts.ts` and the comment on `auth_audit_events_event_type_check` in `server/db/schema.ts`.

## NOT VALID constraints

If a migration adds `CHECK ... NOT VALID`, ship a follow-up migration that runs `VALIDATE CONSTRAINT` once legacy rows are clean (see `0015_validate_reader_saved_check_constraints.sql`).

## When to add an index

- New `WHERE` / `JOIN` / `ORDER BY` on large tables used in user-facing routes.
- Confirm with `EXPLAIN (ANALYZE, BUFFERS)` on staging or a production-sized snapshot.
- Add the index in both `server/db/schema.ts` and `database/migrations/*.sql`, and extend this doc if the pattern is reusable.
