# Split Hosting: Vercel Frontend + Render API + Neon DB

This is the recommended phase-2 free-tier UX setup:

- Frontend static site on Vercel (fast static delivery, no sleep)
- API on Render free web service (can sleep/cold start)
- PostgreSQL on Neon free tier

## Why Vercel here

- Excellent static hosting defaults for Vite apps.
- Very low setup friction and reliable preview deployments.
- Strong free-tier fit for the frontend half of this architecture.

Cloudflare Pages and Netlify are also valid. Vercel is chosen here for the lowest friction with current project setup.

## 1) Deploy API first (Render + Neon)

Follow `docs/deployment-render-neon.md` to deploy backend and database.

After deploy, note your API origin:

- Example: `https://bible-support-api.onrender.com`

## 2) Configure backend CORS for split hosting

On Render API service, set:

- `CORS_ORIGIN=https://your-frontend.vercel.app`

For multiple allowed frontends (preview + production), provide a comma-separated list:

- `CORS_ORIGIN=https://your-frontend.vercel.app,https://your-custom-domain.com`

## 3) Deploy frontend on Vercel

In Vercel project settings:

- Root Directory: `client`
- Framework preset: Vite
- Build command: `pnpm run build`
- Output directory: `dist`

Set frontend environment variable:

- `VITE_API_BASE_URL=https://your-api.onrender.com`

This repo now supports `VITE_API_BASE_URL` automatically for API calls, so no route rewrite/proxy is required in production.

## 4) Vercel SPA routing

`client/vercel.json` includes SPA rewrite config so direct route refreshes work:

- rewrite all paths to `/index.html`

## 5) Verify end-to-end

1. Open frontend URL and validate emotion tiles load.
2. Navigate into an emotion and confirm scriptures/context render.
3. Run API smoke check:

```sh
DEPLOY_URL=https://your-api.onrender.com pnpm run smoke:deploy
```

## Operational notes

- Frontend remains fast/static even when API is idle.
- First API request after inactivity may cold-start on Render free tier.
- Keep `DB_SSL=true` for Neon-backed production deployments.
