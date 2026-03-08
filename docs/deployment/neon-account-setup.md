# Neon Account Setup

Follow these steps to create and configure your Neon account for this app.

## 1) Create account

1. Go to [Neon](https://neon.tech/).
2. Sign up with GitHub (recommended) or email.
3. Choose the free plan to start.

## 2) Create project and database

1. Click **Create Project**.
2. Choose provider/region:
   - Prefer AWS region near your Render region.
3. Choose Postgres version:
   - 16 or 17 are both acceptable for this app.
4. Finish project creation.

## 3) Get connection string

1. Open the project dashboard.
2. Copy the pooled connection string.
3. Confirm URL includes SSL mode (for example `sslmode=require`).

Example format:

```txt
postgresql://<user>:<password>@<host>/<database>?sslmode=require
```

## 4) Values you will use in Render

- `DATABASE_URL=<your-neon-connection-string>`
- `DB_SSL=true`
- `DB_SSL_REJECT_UNAUTHORIZED=true`

## 5) Security notes

- Do not commit the connection string to git.
- Keep credentials only in host environment variable settings.
