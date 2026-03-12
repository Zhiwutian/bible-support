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

- `GET /api/auth/me` -> returns auth state envelope
- `GET /api/auth/login` -> redirects to Auth0
- `GET /api/auth/callback`:
  - API clients receive endpoint errors in JSON envelope
  - browser flows redirect to frontend with query markers:
    - `?auth=success`
    - `?auth=error&reason=<code>&message=<text>`
- `POST /api/auth/logout` -> clears session cookie (API clients)
- `GET /api/auth/logout` -> clears session cookie and redirects to `AUTH_LOGOUT_REDIRECT_URI` (browser navigation)

## 6) Minimal PII Policy

Current storage model:

- stores internal `users.userId`
- stores provider mapping in `auth_accounts(provider, providerSubject)`
- does **not** persist email/name/avatar by default

## 7) Troubleshooting Login/Callback Failures

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
