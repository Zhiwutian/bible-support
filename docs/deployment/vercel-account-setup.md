# Vercel Account Setup

Follow these steps to create a Vercel account and host the frontend.

## 1) Create account

1. Go to [Vercel](https://vercel.com/).
2. Click **Sign Up**.
3. Use GitHub login (recommended).
4. Import this repository.

## 2) Create frontend project

Use these settings:

- Root directory: `client`
- Framework preset: Vite
- Build command: `pnpm run build`
- Output directory: `dist`

## 3) Add environment variable

Set:

- `VITE_API_BASE_URL=https://<your-render-api-host>`

Redeploy after setting environment variables.

## 4) Verify route handling

This repository includes `client/vercel.json` rewrite config for SPA routes.

Check:

- `/`
- `/about`
- `/emotions/<slug>` (from navigation flow)

## 5) Final CORS alignment

After Vercel URL is known, set Render API:

- `CORS_ORIGIN=https://<your-vercel-domain>`

For multiple domains, use comma-separated values.
