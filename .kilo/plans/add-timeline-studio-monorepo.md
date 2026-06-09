# Plan: Add Timeline Studio as Monorepo Application

## Context

**Current repo structure:** This is a monorepo using a `packages/` directory with git submodules for sub-applications (Vibe-Workflow, Open-Poe-AI, Open-AI-Design-Agent). The main app is a Vite + React app, with an existing `packages/studio` (a separate smaller "studio" component lib). There is also a Next.js app (`app/`) and Supabase for backend. The repo name is "OpenHiggsBolt".

**Timeline Studio:** An AI-powered video editor built with Next.js 15 + React 19 + TypeScript (frontend) and Rust + Tauri (desktop backend). It uses Bun as package manager. It has 73% TypeScript, 25% Rust. It supports multiple AI providers including OpenAI.

**Goal:** Integrate Timeline Studio as a web application (no Tauri desktop, no Rust) into this monorepo, leveraging the existing Supabase backend and OpenAI integration.

## Key Constraints & Decisions

1. **Web-only**: Strip all Tauri/Rust dependencies. Use only the `src/` (frontend) and `packages/` (shared libs) from Timeline Studio. Discard `src-tauri/`, `crates/`.
2. **Add as git submodule** in `packages/timeline-studio`, following the existing monorepo pattern.
3. **Package manager**: This repo uses npm (has `package-lock.json`); Timeline Studio uses Bun. We'll add it as a submodule and let it manage its own deps. The root `package.json` will integrate it for transpilation.
4. **No conflicts with existing `packages/studio/`**: The existing small `packages/studio/` (AI studio components) must not be overwritten. Timeline Studio goes into a new `packages/timeline-studio/` directory.
5. **Supabase integration**: Add Supabase client config to Timeline Studio, pointing to the existing local Supabase instance (port 54321).
6. **OpenAI integration**: Timeline Studio already has OpenAI support built in; ensure its env vars align with existing config.
7. **Build/Tooling**: Timeline Studio uses Next.js. The root repo uses Vite. We'll add a separate Next.js build script at root level to build the Timeline Studio app.

## Steps

### 1. Add Timeline Studio as git submodule
```bash
cd /path/to/repo
git submodule add https://github.com/deangilmoreremix/timeline-studio.git packages/timeline-studio
```
- This follows the established pattern (Vibe-Workflow, Open-Poe-AI, etc.)
- Note: The `packages/studio/` directory is a separate, smaller package — no conflict.

### 2. Prune Tauri/Rust from the submodule (web-only)
Inside `packages/timeline-studio/`:
- Delete/ignore `src-tauri/` directory
- Delete/ignore `crates/` directory
- Delete Tauri-specific config: `tauri.conf.json` (if present), `Cargo.toml` at root
- Keep: `src/`, `packages/`, `public/`, `index.html`, `next.config.ts`, `vite.config.ts`, `src-node/`, `config/`

### 3. Fix Next.js config for web-only build
In `packages/timeline-studio/next.config.ts`:
- Ensure `output: 'standalone'` or `output: 'export'` for static/web deployment
- Remove any Tauri-specific Next.js config (e.g., `tauri` preset if used)

### 4. Configure environment variables
Create `packages/timeline-studio/.env.local` with:
```
# Supabase (pointing to local dev instance)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from existing supabase config>

# OpenAI (existing project key)
OPENAI_API_KEY=<existing key>

# Disable Tauri/desktop features
NEXT_PUBLIC_APP_MODE=web
```

### 5. Install Timeline Studio dependencies
```bash
cd packages/timeline-studio
bun install
```

### 6. Add Supabase client to Timeline Studio
- Install `@supabase/supabase-js` and `@supabase/ssr` in the timeline-studio package:
  ```bash
  cd packages/timeline-studio
  bun add @supabase/supabase-js @supabase/ssr
  ```
- Create `packages/timeline-studio/src/lib/supabase.ts` with client initialization using `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 7. Update root package.json scripts
In root `package.json`, add:
```json
{
  "scripts": {
    "dev:timeline": "cd packages/timeline-studio && bun run dev",
    "build:timeline": "cd packages/timeline-studio && bun run build",
    "dev:all": "(npm run dev) & (npm run dev:timeline)"
  }
}
```

### 8. Update Next.js transpilation (if needed)
In `packages/timeline-studio/next.config.ts`, ensure internal shared packages are transpiled if referenced.

### 9. Update .gitignore
Add to root `.gitignore`:
```
# Timeline Studio
packages/timeline-studio/.next/
packages/timeline-studio/out/
packages/timeline-studio/.env.local
```

### 10. Supabase schema alignment
- Review Timeline Studio's expected database schema (from its migrations/docs)
- Add necessary Supabase migrations in `supabase/migrations/` for Timeline Studio tables (projects, timelines, media_items, exports, etc.)
- If Timeline Studio uses its own PostgreSQL schema (via Rust backend), extract only the table definitions needed for the web frontend and create equivalent Supabase migrations.

### 11. Disable Tauri-only features
In Timeline Studio source code:
- Find and gate Tauri-specific imports (`@tauri-apps/api`, `@tauri-apps/plugin-*`) behind dynamic checks or replace with no-ops/web equivalents
- Ensure FFmpeg/video processing that was handled by Rust backend is routed to a web-compatible solution (e.g., Supabase Edge Functions, or a separate API service)

### 12. Verify build
```bash
cd packages/timeline-studio
bun run build
```
Resolve any build errors (missing Tauri APIs, Rust-specific modules, etc.).

## Files to Modify

1. `.gitmodules` — add timeline-studio entry
2. `packages/timeline-studio/` — entire submodule checkout + pruning
3. `packages/timeline-studio/next.config.ts` — web-only mode
4. `packages/timeline-studio/.env.local` — env config
5. `packages/timeline-studio/src/lib/supabase.ts` — new file
6. `package.json` — add scripts
7. `.gitignore` — add timeline-studio ignores
8. `supabase/migrations/` — new migrations for Timeline Studio schema

## Verification

1. `cd packages/timeline-studio && bun run dev` — starts Next.js dev server on port 3000
2. `cd packages/timeline-studio && bun run build` — produces production build
3. Open browser to `http://localhost:3000` — Timeline Studio UI loads
4. Supabase Studio at `http://localhost:54323` shows Timeline Studio tables

## Risks / Open Questions

- **Video processing backend**: Timeline Studio relies on Rust + FFmpeg for video processing. For web-only mode, this needs a replacement (Supabase Edge Functions with FFmpeg.wasm, or a separate microservice). This is a significant scope item.
- **Bun vs npm**: The repo uses npm; Timeline Studio uses Bun. Submodule keeps its own `bun.lock`. This is fine as long as root scripts invoke bun for timeline-studio commands.
- **Large repo**: Timeline Studio has 3,402 commits and significant code. The submodule will be large. Consider `--depth 1` for shallow clone if full history isn't needed.
- **Shadcn/ui dependencies**: Timeline Studio uses shadcn/ui components. These are source-level (copied into `src/components`), so they'll ship with the submodule — no extra dependency needed.
