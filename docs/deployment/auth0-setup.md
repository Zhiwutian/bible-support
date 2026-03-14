# Auth0 Setup (OIDC Minimal PII)

This guide configures Auth0 for the app's server-side OIDC flow with minimal stored PII.

## 1) Create Auth0 Application

- Application type: **Regular Web Application**
- Authentication flow: **Authorization Code + PKCE**
- Application Authentication/Credentials: **do not leave as `none`**
  - Use client-secret based auth for token exchange (for example `client_secret_post`)

## 2) Configure Callback + Logout URLs

Set these in the Auth0 app dashboard:

- **Allowed Callback URLs**
  - `https://<api-host>/api/auth/callback`
  - local dev: `http://localhost:8080/api/auth/callback`
- **Allowed Logout URLs**
  - `https://<frontend-host>/`
  - local dev: `http://localhost:5173/`

## 3) Copy Credentials

From Auth0 application settings:

- Domain -> `AUTH_ISSUER` as `https://<exact-domain>/`
  - Some tenants use regional domains (for example `*.us.auth0.com`).
  - Always copy exact value from Auth0 dashboard.
- Client ID -> `AUTH_CLIENT_ID`
- Client Secret -> `AUTH_CLIENT_SECRET`

## 4) Server Environment Variables

Add to Render/server environment:

```txt
AUTH_ENABLED=true
AUTH_PROVIDER=auth0
AUTH_ISSUER=https://<tenant>.auth0.com/
AUTH_CLIENT_ID=<client-id>
AUTH_CLIENT_SECRET=<client-secret>
AUTH_REDIRECT_URI=https://<api-host>/api/auth/callback
AUTH_LOGIN_REDIRECT_URI=https://<frontend-host>/
AUTH_LOGOUT_REDIRECT_URI=https://<frontend-host>/
SESSION_SECRET=<long-random-secret>
SESSION_TTL_SECONDS=604800
SESSION_COOKIE_SAME_SITE=none
```

Notes:

- Keep `SESSION_SECRET` high-entropy and rotate with deployment controls.
- For split-host deployment (`Vercel` + `Render`), use `SESSION_COOKIE_SAME_SITE=none`; production then requires `Secure=true` (already enabled by server runtime).

## 5) Verify Auth Endpoints

- `GET /api/auth/me` -> returns auth state envelope (including `enabledSocialProviders` for login modal options)
- `GET /api/auth/login` -> redirects to Auth0 (optional `next=/path` restores post-login route)
- `GET /api/auth/callback`:
  - API clients receive endpoint errors in JSON envelope
  - browser flows redirect to frontend with query markers:
    - `?auth=success`
    - `?auth=error&reason=<code>&message=<text>`
- `POST /api/auth/logout` -> clears session cookie (API clients)
- `GET /api/auth/logout` -> clears session cookie and redirects to `AUTH_LOGOUT_REDIRECT_URI` (browser navigation)
- `PATCH /api/auth/me` -> updates authenticated profile metadata (`displayName`, `avatarUrl`)

Current social-provider login status:

- Google sign-in is enabled in the app login modal.
- Facebook sign-in is intentionally deferred until a Meta developer app is configured.
- `AUTH_SOCIAL_FACEBOOK_ENABLED` controls whether Facebook is shown/enabled in app login flow.
- To re-enable Facebook later, add Auth0 Facebook connection + Meta app credentials, set `AUTH_SOCIAL_FACEBOOK_ENABLED=true`, and redeploy API.

## 6) Minimal PII Policy

Current storage model:

- stores internal `users.userId`
- stores provider mapping in `auth_accounts(provider, providerSubject)`
- stores optional `users.displayName` + `users.avatarUrl`
- does **not** persist email

Metadata behavior:

- `displayName`/`avatarUrl` use `user_wins` policy.
- Provider claims populate local metadata only when local value is currently `null`.
- Callback flow does not overwrite existing local profile values.

Avatar URL validation:

- max length is enforced
- production requires `https` URLs
- development accepts `http` and `https`

## 7) Admin Bootstrap Runbook

After first successful login, promote one account to admin manually.

1. Find user id from provider subject:

```sql
select u."userId", u."role", a."provider", a."providerSubject"
from "users" u
join "auth_accounts" a on a."userId" = u."userId"
where a."provider" = 'auth0'
order by u."createdAt" asc;
```

2. Grant first admin:

```sql
update "users"
set "role" = 'admin', "updatedAt" = now()
where "userId" = '<target-user-id>';
```

3. Verify current admin set:

```sql
select "userId", "role", "displayName", "createdAt"
from "users"
where "role" = 'admin'
order by "createdAt" asc;
```

Rollback one role change:

```sql
update "users"
set "role" = 'user', "updatedAt" = now()
where "userId" = '<target-user-id>';
```

Break-glass recovery when admin set is lost:

```sql
with candidate as (
  select a."userId"
  from "auth_accounts" a
  where a."provider" = 'auth0'
  order by a."createdAt" asc
  limit 1
)
update "users" u
set "role" = 'admin', "updatedAt" = now()
from candidate
where u."userId" = candidate."userId";
```

## 8) Troubleshooting Login/Callback Failures

If sign-in returns `auth=error&reason=server_error`:

1. Verify issuer discovery:

```sh
curl -i "${AUTH_ISSUER%.}/.well-known/openid-configuration"
```

Expected: `200` + JSON.  
If `404`, `AUTH_ISSUER` is wrong (usually missing regional domain).

2. Verify Auth0 app authentication setting:

- `Application Authentication` must not be `none`.
- Use client-secret method compatible with server configuration.

3. Verify callback URL match:

- Auth0 Allowed Callback URLs includes:
  - `https://<api-host>/api/auth/callback`
- Render env `AUTH_REDIRECT_URI` matches exactly.

4. Verify production DB migrations are applied (callback writes user/account rows):

```sh
pnpm run db:migrate
```
