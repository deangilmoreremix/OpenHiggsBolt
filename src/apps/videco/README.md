# VideoCo AI Platform

AI-powered personalized video generation platform, integrated into the Open Higgs Bolt monorepo.

## Features

- **Dashboard** — Overview with stats, quick actions, and recent videos
- **AI Video Generation** — Text-to-video with model selection and prompt enhancement
- **Video Library** — Grid/list view with search, filtering, playback, and delete
- **Video Upload** — Drag-and-drop upload to Supabase Storage
- **AI Clone Studio** — Upload source video + script → generate personalized clone
- **Campaign Builder** — CSV-based batch video generation
- **Video Editor** — Metadata editing, sharing, and embed code

## Routes

| Route | Page |
|---|---|
| `/videco/dashboard` | Dashboard with stats and quick actions |
| `/videco/library` | Video library with search and filters |
| `/videco/generate` | AI text-to-video generation |
| `/videco/upload` | Upload videos to storage |
| `/videco/clone` | AI clone creation |
| `/videco/campaign` | Batch campaign builder |
| `/videco/editor/:id` | Video detail editor |

## Architecture

- **Stack**: React + TypeScript + Tailwind CSS v4 + Lucide icons
- **State**: Zustand (`src/stores/videcoStore.ts`)
- **Database**: Supabase (PostgreSQL + Storage)
- **Video Generation**: Muapi API via Supabase Edge Functions
- **AI Enhancement**: OpenAI via Supabase Edge Functions
- **Auth**: None (anon key with public RLS policies)

## Edge Functions

Located in `supabase/functions/`:

- `generate-video` — Submits to Muapi, polls for result, stores in DB
- `get-videos` — Paginated video listing with filters
- `delete-video` — Deletes video record + storage file
- `process-csv` — Parses CSV, creates campaign + video records
- `enhance-prompt` — OpenAI-powered prompt enhancement

## Supabase Schema

### `videos` table
- `id` (uuid, PK)
- `tenant_id` (text) — for multi-tenancy
- `name`, `description`, `type`, `prompt`
- `source_video_url`, `generated_url`, `thumbnail_url`
- `duration`, `status`, `metadata` (jsonb)
- `created_at`, `updated_at`

### `campaigns` table
- `id` (uuid, PK)
- `tenant_id`, `name`, `source_video_url`, `status`
- `total_videos`, `completed_videos`, `metadata` (jsonb)
