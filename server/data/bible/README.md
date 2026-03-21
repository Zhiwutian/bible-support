# Bundled Bible JSON (KJV, ASV, WEB)

Public-domain verse maps used by:

- **Offline / no-DB reader:** `GET /api/reader/chapter` falls back to these files when Postgres has no `scripture_verses` rows (or when `DATABASE_URL` is unset).
- **Search / emotions:** `scripture-search-service` and `emotion-service` read the same files when the DB does not satisfy the query.
- **DB import:** `pnpm -C server db:import:bible-translations` loads all three into `scripture_verses`.

## Refresh local copies

From the repo root:

```sh
pnpm run db:sync:bible-sources
```

Writes:

- `kjv.json`
- `asv.json`
- `web.json`

## Load corpus into the database

```sh
pnpm run db:sync:bible-sources
pnpm run db:import:bible-translations
```

Single-translation or custom path: see `pnpm run db:import:bible-json` and `docs/verse-search-save.md`.
