# Proposal: Same-Site Domain Strategy for Auth Session Reliability

## Goal

Eliminate cross-site cookie/session instability during authentication by moving to a same-site domain topology.

## Non-Goals

- Replacing Auth0/OIDC provider
- Rewriting auth flow contracts (`/api/auth/login|callback|logout|me`)
- Introducing a custom auth/session backend

## Current Problem Summary

Current deployment uses:

- Frontend: `*.vercel.app`
- API: `*.onrender.com`

This is cross-site by registrable domain (`vercel.app` vs `onrender.com`), so browser privacy protections can block session cookies on API requests. Observable symptoms:

- callback succeeds and sets `app_session`
- frontend shows "sign-in incomplete"
- `/api/auth/me` returns `isAuthenticated: false`
- DevTools shows request cookies only under filtered/blocked cookie views

## Options Considered

### Option A: Custom Domain with App/API Subdomains (Recommended)

Example:

- `app.yourdomain.com` -> Vercel frontend
- `api.yourdomain.com` -> Render API

Pros:

- Reliable cookie behavior (same-site)
- Clean separation of frontend and API
- Minimal code change required
- Good long-term scalability and operability

Cons:

- Requires owning and configuring a custom domain

### Option B: Single Host + Reverse Proxy for `/api/*`

Example:

- `yourdomain.com` serves frontend
- `yourdomain.com/api/*` proxies to Render API

Pros:

- True same-origin for API requests
- Very stable session behavior

Cons:

- Requires proxy configuration and routing maintenance
- Slightly more operational coupling

### Option C: Stay on Free Platform Domains + Browser Exceptions

Pros:

- No infra/domain change

Cons:

- Not reliable for end users
- Depends on user browser privacy settings
- Not production-safe

Recommendation: avoid as a long-term approach.

## Option Comparison (Quick View)

| Option                                             | Reliability | Setup Effort |  Typical Time |  Ongoing Complexity | Notes                                      |
| -------------------------------------------------- | ----------- | -----------: | ------------: | ------------------: | ------------------------------------------ |
| A: `app.` + `api.` custom subdomains               | High        |       Medium |     1-3 hours |                 Low | Best long-term fit for current stack       |
| B: Single host + `/api` reverse proxy              | High        |  Medium-High |     2-5 hours |              Medium | Strong cookie behavior, extra proxy upkeep |
| C: Keep free platform domains + browser exceptions | Low         |          Low | 15-30 minutes | High (user support) | Not production-safe for broad users        |

Time estimates assume DNS access, dashboard access, and no provider outages.

## Decision Rubric

Choose **Option A** when:

- you want the fastest production-safe fix with low long-term maintenance
- you are staying on Vercel + Render
- you can use a custom domain

Choose **Option B** when:

- you need strict same-origin behavior for all API calls
- you are comfortable maintaining reverse-proxy routing rules
- you may add more backend services behind one public host later

Choose **Option C** only when:

- this is temporary local/dev troubleshooting
- you are validating root cause before proper domain cutover

Default recommendation for this project: **Option A**.

## Go/No-Go Cutover Checklist

Go only when all items below are true:

- DNS records for `app.<domain>` and `api.<domain>` resolve correctly.
- Vercel serves frontend on `https://app.<domain>`.
- Render serves API on `https://api.<domain>`.
- Render env values are updated:
  - `CORS_ORIGIN=https://app.<domain>`
  - `AUTH_REDIRECT_URI=https://api.<domain>/api/auth/callback`
  - `AUTH_LOGIN_REDIRECT_URI=https://app.<domain>/`
  - `AUTH_LOGOUT_REDIRECT_URI=https://app.<domain>/`
- Vercel env value is updated:
  - `VITE_API_BASE_URL=https://api.<domain>`
- Auth0 URLs are updated exactly:
  - Allowed Callback URL -> `https://api.<domain>/api/auth/callback`
  - Allowed Logout URL -> `https://app.<domain>/`
- New API and frontend deployments completed after env changes.
- Smoke tests pass:
  - `GET /api/health` returns `200`
  - login redirects to provider and returns to app successfully
  - `GET /api/auth/me` returns `isAuthenticated: true` after login
  - admin routes still enforce role checks correctly

No-go triggers (delay cutover):

- callback URL mismatch errors
- `/api/auth/me` remains unauthenticated after successful callback
- cookies still appear filtered/blocked on same-site domain setup
- CORS errors between `app.<domain>` and `api.<domain>`

## Recommendation

Adopt **Option A** (`app.` + `api.` on one custom domain).

This gives the best reliability-to-complexity ratio for the current Vercel + Render + Auth0 stack.

## Required Configuration Changes

### Frontend (Vercel)

- Set custom domain: `app.yourdomain.com`
- Keep root directory/build unchanged
- Set `VITE_API_BASE_URL=https://api.yourdomain.com`

### API (Render)

- Set custom domain: `api.yourdomain.com`
- Update `CORS_ORIGIN=https://app.yourdomain.com`
- Keep existing auth/session configuration and secrets

### Auth0

Update allowed URLs:

- Allowed Callback URL: `https://api.yourdomain.com/api/auth/callback`
- Allowed Logout URL: `https://app.yourdomain.com/`

### Server Env Updates

- `AUTH_REDIRECT_URI=https://api.yourdomain.com/api/auth/callback`
- `AUTH_LOGIN_REDIRECT_URI=https://app.yourdomain.com/`
- `AUTH_LOGOUT_REDIRECT_URI=https://app.yourdomain.com/`

Cookie policy:

- Prefer `SESSION_COOKIE_SAME_SITE=lax` once same-site topology is active.
- Keep `Secure` cookie behavior enabled in production.

## Rollout Plan

1. Provision DNS + attach `app.` and `api.` custom domains.
2. Update Vercel + Render domain mappings.
3. Update Auth0 callback/logout URLs.
4. Update Render and Vercel environment variables.
5. Redeploy API and frontend.
6. Validate auth flow end-to-end:
   - `/api/auth/login` -> provider
   - callback returns to app
   - `/api/auth/me` returns authenticated payload
7. Remove temporary browser cookie exceptions used during investigation.

## Validation Checklist

- Browser network request to `/api/auth/me` includes `app_session` cookie without "filtered out"
- `/api/auth/me` returns:
  - `isAuthenticated: true`
  - non-null `userId`
- Admin session routes work after login
- Logout clears session and `/api/auth/me` returns unauthenticated

## Risks and Mitigations

- **Risk:** DNS misconfiguration delays cutover  
  **Mitigation:** perform staged DNS verification and keep old domains live during transition
- **Risk:** Auth0 URL mismatch causes login failure  
  **Mitigation:** update all callback/logout values in one change window and verify immediately
- **Risk:** stale client env values in Vercel deployments  
  **Mitigation:** force redeploy after env update and verify build-time values

## Open Questions

- Use `SESSION_COOKIE_SAME_SITE=lax` immediately after cutover, or keep `none` for conservative compatibility?
- Keep old `*.vercel.app` / `*.onrender.com` endpoints accessible for rollback window, or disable immediately after cutover?
