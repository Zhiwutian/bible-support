# Auth0 Setup (OIDC Minimal PII)

This guide configures Auth0 for the app's server-side OIDC flow with minimal stored PII.

## 1) Create Auth0 Application

- Application type: **Regular Web Application**
- Authentication flow: **Authorization Code + PKCE**

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

- Domain -> `AUTH_ISSUER` as `https://<tenant>.auth0.com/`
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
