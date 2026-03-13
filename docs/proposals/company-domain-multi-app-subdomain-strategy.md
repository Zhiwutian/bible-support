# Proposal: Company Domain Strategy for Multiple Small Apps

## Goal

Establish a scalable domain and routing pattern for hosting multiple small apps under one company brand.

## Non-Goals

- Migrating every existing app immediately
- Implementing full cross-app SSO in phase 1
- Standardizing all backend frameworks/providers at once

## Recommendation (High Level)

Use one company domain and app-specific subdomains, with clear separation of frontend and API per app:

- `app-one.company.com` (frontend)
- `api.app-one.company.com` (API)
- `app-two.company.com` (frontend)
- `api.app-two.company.com` (API)

This gives strong isolation, clear ownership, and predictable auth behavior while keeping branding unified.

## Why This Works Well

- Consistent branding across all products
- Repeatable launch process for new apps
- Easier DNS and certificate management under one zone
- Better auth reliability than unrelated platform domains
- Clear blast-radius boundaries when one app has incidents

## Domain Topology Options

### Option A: Per-App Frontend + Per-App API Subdomains (Recommended)

Examples:

- `notes.company.com` + `api.notes.company.com`
- `verse.company.com` + `api.verse.company.com`

Pros:

- Strong app isolation
- Simple app-level auth/cookie boundaries
- Easy ownership by app teams

Cons:

- More DNS records than centralized API

### Option B: Per-App Frontend + Shared API Domain With Paths

Examples:

- `notes.company.com`
- `api.company.com/notes/*`

Pros:

- Fewer API hostnames
- Centralized API controls

Cons:

- Path-based routing complexity
- Larger shared blast radius
- Harder per-app infra migration

### Option C: Shared App Shell + Multi-App Paths

Examples:

- `company.com/notes`
- `company.com/verse`

Pros:

- Single web host and cert path

Cons:

- Coupled deployments and routing
- Harder app-level isolation and scaling

## Auth and Cookie Boundary Strategy

Default policy for phase 1:

- Keep sessions **app-local**, not org-wide.
- Scope cookies to each app/API pair.
- Avoid shared parent-domain cookies (`.company.com`) unless deliberate SSO is introduced.

This prevents accidental cross-app session leakage and reduces security risk.

## Naming Conventions

- Frontend: `<app>.company.com`
- API: `api.<app>.company.com`
- Optional admin/ops:
  - `status.company.com`
  - `admin.company.com` (if centralized tooling is needed)

For staging:

- `<app>-stg.company.com`
- `api.<app>-stg.company.com`

## Starter Domain Map (Example: 3 Apps)

Assume company domain is `acmeco.com`.

Production:

- `journal.acmeco.com` -> Journal frontend
- `api.journal.acmeco.com` -> Journal API
- `scripture.acmeco.com` -> Scripture frontend
- `api.scripture.acmeco.com` -> Scripture API
- `tasks.acmeco.com` -> Tasks frontend
- `api.tasks.acmeco.com` -> Tasks API

Staging:

- `journal-stg.acmeco.com` -> Journal staging frontend
- `api.journal-stg.acmeco.com` -> Journal staging API
- `scripture-stg.acmeco.com` -> Scripture staging frontend
- `api.scripture-stg.acmeco.com` -> Scripture staging API
- `tasks-stg.acmeco.com` -> Tasks staging frontend
- `api.tasks-stg.acmeco.com` -> Tasks staging API

Optional shared utility hosts:

- `status.acmeco.com` -> status page
- `docs.acmeco.com` -> public docs/help center

## DNS and TLS Guidance

- Use one DNS provider for the entire zone.
- Keep low TTL during migration windows (for example 300s).
- Use managed TLS at hosting providers (Vercel/Render/Cloudflare).
- Document ownership of each DNS record.

## Environment Variable Pattern (Per App)

Frontend:

- `VITE_API_BASE_URL=https://api.<app>.company.com`

API:

- `CORS_ORIGIN=https://<app>.company.com`
- `AUTH_REDIRECT_URI=https://api.<app>.company.com/api/auth/callback`
- `AUTH_LOGIN_REDIRECT_URI=https://<app>.company.com/`
- `AUTH_LOGOUT_REDIRECT_URI=https://<app>.company.com/`

## Rollout Plan

1. Buy/assign company domain.
2. Define naming standards and reserve subdomain namespace.
3. Migrate one pilot app first.
4. Validate auth/session behavior and monitoring.
5. Template the setup for future apps.
6. Migrate remaining apps incrementally.

## Pilot App Checklist

- DNS records resolve for frontend + API hosts
- CORS configured for exact frontend origin
- Auth provider callback/logout URLs updated
- Session cookie behavior verified in browser
- Health and auth smoke tests pass
- Rollback path documented

## Risks and Mitigations

- **Risk:** inconsistent naming over time  
  **Mitigation:** enforce naming template and checklist in `docs/proposals`/runbooks
- **Risk:** accidental cross-app cookie scope  
  **Mitigation:** app-local cookie policy as default, security review for any shared cookie changes
- **Risk:** migration downtime  
  **Mitigation:** pilot-first rollout, low TTL, staged cutovers

## Future Extension: Optional SSO

If you later want single sign-on across apps:

- introduce explicit SSO architecture and threat model
- define token/session exchange between apps
- implement with intentional shared auth domain (not ad hoc shared cookies)

Defer this until multiple apps are stable under the base subdomain pattern.

## Decision Rubric

Choose this strategy now if:

- you expect 2+ apps in the next year
- you want consistent brand and lower long-term operational friction
- you prefer app isolation over centralized coupling

If you only plan one app long-term, this may still be useful, but urgency is lower.
