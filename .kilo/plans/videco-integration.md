# Plan: Add VideoCo AI Platform as New App in Monorepo

## Summary
Add the VideoCo AI platform features as a new app (`videco`) inside `src/apps/`, following the existing monorepo design system and architecture. VideoCo is an AI personalized video generation platform. We extract its core features, remove all authentication, and rewire to use Supabase (storage + edge functions), Muapi (image/video APIs), and OpenAI (LLM) per the user's stack requirements.

## Current Repo Structure
- **Stack:** React 19 + TypeScript + Vite + Tailwind CSS v4
- **Routing:** React Router DOM (`src/App.tsx` with side nav + top nav)
- **Apps live in:** `src/apps/<app-name>/` with each app having a `<AppName>.tsx` router and a `pages/` subdirectory
- **Shared layer:** `src/shared/` (api, components, types), `src/lib/` (muapi.js client, models), `src/styles/` (global CSS variables, studio CSS)
- **Path aliases:** `@` → `src/`, `@/api` → `src/shared/api`, `@/types` → `src/shared/types`, `@/components` → `src/shared/components`
- **Design system:** Dark mode, `#050505` bg, cyan primary `#22d3ee`, purple accent `#a855f7`, Inter font, glass-panel effect, lucide-react icons
- **API clients in `src/shared/api/`:** `supabase.ts`, `muapi.ts`
- **Local lib clients in `src/lib/`:** `muapi.js` (full MuapiClient class with polling), `models.js`, `promptUtils.js`, `localModels.js`, `pendingJobs.js`, `uploadHistory.js`

## VideoCo Features to Extract (from reference repo)
The reference app (Next.js + Chakra UI + Supabase auth) has many features. We extract only the core ones and strip auth:

### Core Features (in scope)
1. **Video Library** — Grid/list of generated videos with thumbnails, playback, sharing, delete
2. **AI Video Generation** — Text-to-video generation via Muapi, with prompt, model selection, duration, aspect ratio
3. **Video Upload** — Upload video files to Supabase storage
4. **AI Clone Creation** — Record/upload a source video, then generate personalized videos from scripts (simplified: upload source + text prompt → generate)
5. **Video Editor** — Basic metadata editing (name, tags) since full video editing requires complex players
6. **CSV Campaign** — Bulk video generation from CSV data (simplified: upload CSV with prompts → batch generate)
7. **Embeddable Player** — Public video embed page (no auth required)
8. **Analytics Dashboard** — View video count, generation stats from Supabase

### Features Explicitly Excluded
- Authentication / login / signup / user management
- Stripe payments / subscriptions / credits
- Email integrations (Brevo, etc.)
- CRM integrations (HubSpot, ActiveCampaign, etc.)
- Zapier / webhooks
- Teleprompter, Brand Kit (out of scope)
- Multi-tenant team management

## Architecture Changes

### 1. Create `src/apps/videco/` app directory
```
src/apps/videco/
├── Videco.tsx              # Main router (like VideoStudio.tsx)
└── pages/
    ├── Dashboard.tsx       # Analytics/overview page
    ├── VideoLibrary.tsx     # Grid of all videos
    ├── VideoGenerate.tsx    # AI text-to-video generation (Muapi)
    ├── VideoUpload.tsx      # Upload videos to Supabase Storage
    ├── VideoClone.tsx       # AI clone source upload + script-to-video
    ├── VideoEditor.tsx      # Basic video metadata editor
    ├── CampaignBuilder.tsx  # CSV-based batch generation
    └── EmbedPlayer.tsx      # Public embed player (standalone route)
```

### 2. Supabase Edge Functions (new)
Create `supabase/functions/` directory at repo root for the server-side logic:
```
supabase/
├── functions/
│   ├── generate-video/     # Edge function: calls Muapi, stores result
│   ├── process-csv/        # Edge function: parses CSV, queues batch generation
│   ├── get-videos/         # Edge function: list videos from DB with pagination
│   └── delete-video/       # Edge function: delete video + storage file
├── migrations/
│   └── 001_initial.sql     # Schema for videos table, storage buckets
└── config.toml
```

### 3. Supabase Schema (new tables)
```sql
-- videos table (multi-tenant via tenant_id, no auth required)
CREATE TABLE videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL DEFAULT 'default',
  name text NOT NULL DEFAULT 'Untitled',
  description text,
  type text NOT NULL DEFAULT 'generation', -- 'generation', 'upload', 'clone', 'campaign'
  prompt text,
  source_video_url text,
  generated_url text,
  thumbnail_url text,
  duration float,
  status text NOT NULL DEFAULT 'processing', -- 'processing', 'completed', 'failed'
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Storage bucket
INSERT INTO storage.buckets (name, public) VALUES ('videos', true);
```

### 4. New shared modules
```
src/shared/
├── api/
│   └── openai.ts           # OpenAI client wrapper (calls Supabase edge fn)
├── hooks/
│   └── useVideos.ts        # Custom hook for CRUD operations on videos
└── stores/
    └── videcoStore.ts      # Zustand store for video generation state
```

### 5. Update `src/App.tsx`
- Add `/videco/*` route entry
- Add VideoCo nav item to SideNavigation and TopNavigation

### 6. Environment Variables
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_MUAPI_KEY=
VITE_OPENAI_API_KEY=       # or use Supabase edge fn proxy
```

## Implementation Steps

### Step 1: Supabase Schema & Edge Functions
1. Create `supabase/migrations/001_initial.sql` with videos table and storage bucket
2. Create `supabase/functions/generate-video/index.ts` — accepts prompt + params, calls Muapi video generation, polls result, stores in DB
3. Create `supabase/functions/get-videos/index.ts` — paginated video listing with optional type filter
4. Create `supabase/functions/delete-video/index.ts` — delete video row + storage file
5. Create `supabase/functions/process-csv/index.ts` — parse CSV text, create video rows per row, return job IDs

### Step 2: Client-side API layer
1. Update `src/shared/api/supabase.ts` — ensure client setup with env vars
2. Create `src/shared/api/openai.ts` — wrapper for chat completions via Supabase edge fn (avoids exposing OpenAI key client-side)
3. Create `src/shared/stores/videcoStore.ts` — Zustand store for generation state (selected model, prompt, processing status)

### Step 3: Create videco app structure
1. Create `src/apps/videco/Videco.tsx` — React Router routes
2. Create `src/apps/videco/pages/VideoGenerate.tsx` — full page with prompt input, model picker (reuse from lib/models.js), aspect ratio, duration controls, generation progress
3. Create `src/apps/videco/pages/VideoLibrary.tsx` — grid view of videos with type filter tabs, thumbnails, play modal, delete
4. Create `src/apps/videco/pages/Dashboard.tsx` — stats cards (total videos, by type, recent generations), recent videos list
5. Create `src/apps/videco/pages/VideoUpload.tsx` — drag-and-drop upload to Supabase Storage
6. Create `src/apps/videco/pages/VideoClone.tsx` — upload source video + enter script → generate personalized video
7. Create `src/apps/videco/pages/CampaignBuilder.tsx` — CSV text input → preview data → batch generate
8. Create `src/apps/videco/pages/VideoEditor.tsx` — metadata editor (name, description, tags)

### Step 4: Wire into main app
1. Update `src/App.tsx` — add `<Route path="/videco/*" element={<Videco />} />`
2. Update `src/shared/components/SideNavigation.tsx` — add VideoCo nav item (`Film` icon)
3. Update `src/shared/components/TopNavigation.tsx` — add VideoCo tab entry

### Step 5: Styling & Polish
1. Ensure all pages use existing CSS variables (`bg-app`, `bg-panel`, `bg-card`, `primary`, etc.)
2. Use existing glass-panel, custom-scrollbar, animate-fade-in-up utility classes
3. Ensure responsive layout (sidebar collapse on mobile handled by existing nav)
4. Add loading states, error toasts, empty states using existing design patterns

## Key Design Decisions

1. **No auth** — All Supabase operations use anon key with RLS disabled (public access). The `tenant_id` column on videos enables multi-tenancy without auth (keyed by a default value).

2. **Edge functions for API calls** — Muapi key, OpenAI key, and Supabase service role are kept server-side in edge functions. Client only calls edge functions with anon key.

3. **OpenAI integration** — Used for campaign script generation and prompt enhancement. Client calls a Supabase edge function proxy, which holds the OpenAI API key.

4. **Reuse existing patterns** — Match the structure of `video-studio` (most similar app in codebase) for router layout, page organization, and Muapi usage.

5. **Zustand over localStorage** — Use a lightweight store for generation state (like the MuapiClient pattern in `src/lib/`), but Zustand for app-level state.

6. **Storage bucket** — `videos` bucket in Supabase Storage for both uploaded source videos and generated video files. Public access for embeds.

## Files to Create
1. `supabase/migrations/001_initial.sql`
2. `supabase/functions/generate-video/index.ts`
3. `supabase/functions/get-videos/index.ts`
4. `supabase/functions/delete-video/index.ts`
5. `supabase/functions/process-csv/index.ts`
6. `supabase/functions/enhance-prompt/index.ts` (OpenAI proxy)
7. `src/shared/api/openai.ts`
8. `src/shared/stores/videcoStore.ts`
9. `src/apps/videco/Videco.tsx`
10. `src/apps/videco/pages/Dashboard.tsx`
11. `src/apps/videco/pages/VideoLibrary.tsx`
12. `src/apps/videco/pages/VideoGenerate.tsx`
13. `src/apps/videco/pages/VideoUpload.tsx`
14. `src/apps/videco/pages/VideoClone.tsx`
15. `src/apps/videco/pages/CampaignBuilder.tsx`
16. `src/apps/videco/pages/VideoEditor.tsx`

## Files to Modify
1. `src/App.tsx` — add videco route
2. `src/shared/components/SideNavigation.tsx` — add VideoCo nav item
3. `src/shared/components/TopNavigation.tsx` — add VideoCo top tab

## Out of Scope
- Electron desktop wrapper integration
- Netlify deployment config changes
- Authentication of any kind
- Payment/billing
- Real-time subscriptions (can be added later)
