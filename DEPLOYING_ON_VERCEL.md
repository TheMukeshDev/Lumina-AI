# Deploying Lumina AI to Vercel 🔧🚀

This page explains how to deploy the Lumina AI project to Vercel (production or preview). It covers the simplest workflow and a few troubleshooting tips.

## 1) Prerequisites

- A GitHub account with the repository pushed to GitHub (branch: `main`).
- A Vercel account (https://vercel.com).
- Optional: Vercel CLI installed (`npm i -g vercel`).

## 2) Project structure to know

We keep the actual app in the `lumina-ai-learning/` subdirectory (Vite + React). The important files:

- `lumina-ai-learning/package.json` — contains the app `build` and `dev` scripts
- `vercel.json` (root) — the authoritative Vercel configuration for the whole repo
- `lumina-ai-learning/vercel.json` — *should not* declare `builds` (only local routes) to avoid conflicts

> Tip: Keep a single source of truth for Vercel builds — the root `vercel.json` is recommended.

## 3) Setup on Vercel (UI)

1. Login to Vercel and click **New Project** → import your GitHub repo.
2. On the import page:
   - **Root Directory**: leave blank or set to `/` (we use the root `vercel.json` to point to the subfolder)
   - **Framework Preset**: select **Other** (Vite is not always auto-detected)
   - **Build & Output Settings**: build command should be `npm run build` and Output Directory `lumina-ai-learning/dist`.

3. Add Environment Variables (if needed): in **Settings → Environment Variables** add `VITE_...` variables used by the app (do not commit secrets to GitHub).

4. Deploy. Vercel will run the root `build` script which delegates to the subdirectory (see next section).

## 4) Recommended root package.json

To make Vercel run the subdirectory build reliably, add a root `package.json` with forwarded scripts:

```json
{
  "scripts": {
    "build": "npm --prefix lumina-ai-learning run build",
    "dev": "npm --prefix lumina-ai-learning run dev",
    "preview": "npm --prefix lumina-ai-learning run preview"
  }
}
```

This ensures the top-level `npm run build` calls the subpackage's build script (`tsc && vite build`).

## 5) Example root `vercel.json`

Use a root `vercel.json` like this (authoritative config):

```json
{
  "version": 2,
  "builds": [
    { "src": "lumina-ai-learning/package.json", "use": "@vercel/static-build", "config": { "distDir": "dist" } },
    { "src": "lumina-ai-learning/api/**/*.js", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/lumina-ai-learning/api/$1.js" },
    { "src": "/(.*)", "dest": "/lumina-ai-learning/index.html" }
  ]
}
```

> Note: Avoid duplicating `builds` in the subdirectory `vercel.json` — Vercel warns and ignores some project settings if it finds nested `builds`.

## 6) Common issues & fixes

- Build shows a plain text message instead of running `npm run build`:
  - Ensure your root `package.json` contains the `build` script forwarding to `lumina-ai-learning`.
  - Ensure Vercel project `Root Directory` is correct and points to the repo root.

- Blank site (404 or empty page):
  - Check the Output Directory `lumina-ai-learning/dist` exists after build
  - Check `vercel.json` routes point to `/lumina-ai-learning/index.html` or to the right dist folder

- Environment variables not applied:
  - Confirm variables are set in **Project Settings → Environment Variables** for the correct environment (Production/Preview/Development)

## 7) Using the Vercel CLI (optional)

To create a quick deployment from your machine:

```bash
cd lumina-ai-learning
vercel --prod
```

This will deploy the subdirectory as a project; prefer the UI for long term project configuration.

## 8) Post-deploy checks

- Visit the deployment URL printed in Vercel.
- Check the **Functions** and **Logs** panels for errors.
- If static assets 404, check the base path in `vite.config.ts`.

---

If you'd like, I can also add a short workflow snippet for GitHub Actions to deploy to Vercel automatically on push — would you like that added here?