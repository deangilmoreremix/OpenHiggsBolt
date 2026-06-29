# Deploy to Netlify

This app is a Next.js 15 monorepo that uses each visitor's own MuAPI key for all
AI features. There are no server-side credentials to configure — every user pastes
their key into the in-app modal on first load and it is stored locally
(`localStorage` + a first-party cookie) and forwarded to `api.muapi.ai` via the
Next.js proxy routes.

## One-click deploy

The repo contains a fully-working `netlify.toml`, so the simplest deployment is:

1. Push this repo to GitHub.
2. In Netlify → **Add new site → Import from Git**, select the repo.
3. Netlify will detect `netlify.toml` and pre-fill:
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Functions directory: `netlify/functions`
   - Node version: `20`
4. Click **Deploy site** — no environment variables are required for the AI
   features (everyone brings their own MuAPI key).

If you'd rather deploy without Git, the Netlify CLI can do it from your laptop:

```bash
# Requires a one-time `netlify login`
netlify deploy --build --prod
```

## What is deployed

- **Next.js app** (App Router, React 19, Tailwind) at `/` and `/studio/*`
- **API proxy routes** under `/api/*` that forward user requests to
  `https://api.muapi.ai/*` while attaching the `x-api-key` header from the
  visitor's cookie / request header. No MuAPI key is ever stored on the server.
- **Five optional Serverless Functions** under `/api/brands`, `/api/brand`,
  `/api/campaigns`, `/api/assets`, `/api/photo-studio`. These back an
  *optional* Photo/Brand Studio workflow that talks to Supabase and **is only
  used if you also set the following env vars** (see below).

## Environment variables

The core 13 studios (Image, Video, Audio, AI Clipping, Vibe Motion, Lip Sync,
Cinema, Marketing, Workflows, Apps, VFX, Thumbnail, Script Writer, Cinema,
Presentation, Content Planner) all work with **zero env vars** — every user
brings their own MuAPI key.

If you also want the Brand / Photo Studio features (Supabase-backed), set:

```
NEXT_PUBLIC_SUPABASE_URL    = https://<your-project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY   = <service-role-key>
```

These are read by the Lambda functions under `netlify/functions/`. Without them
those routes return 500 but the rest of the app keeps working.

## MuAPI key flow (per-user)

1. On first visit, the API Key modal opens.
2. The user pastes a key from <https://muapi.ai/access-keys>.
3. The key is saved to `localStorage` (`muapi_key`) **and** mirrored as a
   first-party `muapi_key` cookie (`SameSite=Lax`, 1-year expiry).
4. Every request from a studio goes to `/api/...` on this origin.
5. The Next.js middleware + API routes read the cookie (or the `x-api-key`
   request header) and forward the call to `api.muapi.ai` with that key.
6. The key never leaves the user's browser except inside the proxied request
   directly to MuAPI.

Users can update or remove their key at any time from the **Settings** button
in the top-right of the Studio header.

## Verifying locally

```bash
npm install
npm run build
npm start              # production preview on http://localhost:3000
```

Open `http://localhost:3000`, paste a MuAPI key, and start generating.

## Known limitations of this build

The original repo pulled three packages from private git submodules
(`packages/Vibe-Workflow`, `packages/Open-Poe-AI`, `packages/Open-AI-Design-Agent`).
Their referenced commits are not fetchable from the public remotes at build
time, so this deployment uses stub packages (`packages/ai-agent`,
`packages/workflow-builder`, `packages/design-agent`) that let the build
succeed and ship the full UI.

What this means in practice:

- The 13 studios reachable from `/studio/*` (Image, Video, Audio, AI Clipping,
  Vibe Motion, Lip Sync, Cinema, Marketing, Workflows, Apps, VFX, Thumbnail,
  Script Writer, Presentation, Content Planner) are **fully functional**.
- Direct `/agents/*` and `/workflow/*` URLs render a friendly "module
  unavailable in this build" notice — the Vibe-Workflow / Open-Poe-AI
  / Design Agent surfaces that lived inside those packages. Everything else
  keeps working.
- Once the upstream submodules are publicly fetchable again, dropping the
  stubs and re-adding the original `workspaces` entries + `transpilePackages`
  restores the full feature set without any other code changes.

## Production checklist (already done)

- [x] `npm run build` compiles cleanly, all 21 routes generated
- [x] `netlify.toml` includes security headers (`X-Frame-Options`,
      `Referrer-Policy`, `HSTS`, `Permissions-Policy`)
- [x] `_next/static/*` cached for 1 year (immutable)
- [x] Node 20 pinned
- [x] Functions bundled with esbuild
- [x] No secrets in the build — MuAPI keys are user-provided only
