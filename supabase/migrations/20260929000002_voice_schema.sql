-- 20260929000002_voice_schema
--
-- RECOVERED RECONSTRUCTION of an already-applied production migration.
--
-- This migration was applied to the production database (Supabase project
-- bzxohkrxcwodllketcpz, "VideoRemix Product"; recorded in
-- supabase_migrations.schema_migrations as version 20260929000002) but was
-- never committed to source control, so production could not be reproduced
-- from the repo. The definition below is reconstructed from the LIVE schema
-- (the source of truth), introspected on 2026-10-12 through the Supabase
-- Management API (information_schema.columns, pg_constraint, pg_indexes,
-- pg_policies, pg_get_expr defaults).
--
-- DO NOT treat this as a new change: re-running it against the live database
-- is intended to be a no-op. Every statement is guarded (`create table if not
-- exists`, `create index if not exists`, `enable row level security`, and
-- `drop policy if exists` immediately followed by `create policy`).
--
-- Recreated objects (voice service tables, RLS enabled, owner policies in
-- the Clerk idiom already standard in this repo:
-- clerk_user_id = current_setting('app.clerk_user_id', true)):
--   voice_transcripts         id text pk default gen_random_uuid()::text,
--                             clerk_user_id text not null, project_id text
--                             fk -> voice_projects(id) on delete cascade,
--                             job_id text fk -> voice_jobs(id) on delete set
--                             null, language text, segments jsonb,
--                             full_text text, storage_path text,
--                             created_at timestamptz not null default now()
--   voice_dub_projects        id text pk default gen_random_uuid()::text,
--                             clerk_user_id text not null, project_id text
--                             fk -> voice_projects(id) on delete cascade,
--                             job_id text fk -> voice_jobs(id) on delete set
--                             null, source_language text, target_language
--                             text not null, source_media_path text,
--                             voice_assignments jsonb, output_path text,
--                             status text not null default 'pending',
--                             created_at/updated_at timestamptz not null
--                             default now()
--   voice_audiobook_projects  id text pk default gen_random_uuid()::text,
--                             clerk_user_id text not null, project_id text
--                             fk -> voice_projects(id) on delete cascade,
--                             job_id text fk -> voice_jobs(id) on delete set
--                             null, title text, author text, cover_path text,
--                             source_text_path text, voice_profile_id text
--                             fk -> voice_profiles(id) on delete set null,
--                             output_path text, status text not null default
--                             'pending', chapters jsonb, created_at/updated_at
--                             timestamptz not null default now()

create table if not exists public.voice_transcripts (
  id text primary key default gen_random_uuid()::text,
  clerk_user_id text not null,
  project_id text references public.voice_projects(id) on delete cascade,
  job_id text references public.voice_jobs(id) on delete set null,
  language text,
  segments jsonb,
  full_text text,
  storage_path text,
  created_at timestamptz not null default now()
);

create index if not exists voice_transcripts_clerk_user_id_idx
  on public.voice_transcripts(clerk_user_id);

create index if not exists voice_transcripts_project_id_idx
  on public.voice_transcripts(project_id);

alter table public.voice_transcripts enable row level security;

drop policy if exists "Users can view own voice transcripts"
  on public.voice_transcripts;

create policy "Users can view own voice transcripts"
  on public.voice_transcripts
  for select
  using (clerk_user_id = current_setting('app.clerk_user_id', true));

drop policy if exists "Users can insert own voice transcripts"
  on public.voice_transcripts;

create policy "Users can insert own voice transcripts"
  on public.voice_transcripts
  for insert
  with check (clerk_user_id = current_setting('app.clerk_user_id', true));

drop policy if exists "Users can update own voice transcripts"
  on public.voice_transcripts;

create policy "Users can update own voice transcripts"
  on public.voice_transcripts
  for update
  using (clerk_user_id = current_setting('app.clerk_user_id', true));

drop policy if exists "Users can delete own voice transcripts"
  on public.voice_transcripts;

create policy "Users can delete own voice transcripts"
  on public.voice_transcripts
  for delete
  using (clerk_user_id = current_setting('app.clerk_user_id', true));

create table if not exists public.voice_dub_projects (
  id text primary key default gen_random_uuid()::text,
  clerk_user_id text not null,
  project_id text references public.voice_projects(id) on delete cascade,
  job_id text references public.voice_jobs(id) on delete set null,
  source_language text,
  target_language text not null,
  source_media_path text,
  voice_assignments jsonb,
  output_path text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists voice_dub_projects_clerk_user_id_idx
  on public.voice_dub_projects(clerk_user_id);

create index if not exists voice_dub_projects_project_id_idx
  on public.voice_dub_projects(project_id);

alter table public.voice_dub_projects enable row level security;

drop policy if exists "Users can view own voice dub projects"
  on public.voice_dub_projects;

create policy "Users can view own voice dub projects"
  on public.voice_dub_projects
  for select
  using (clerk_user_id = current_setting('app.clerk_user_id', true));

drop policy if exists "Users can insert own voice dub projects"
  on public.voice_dub_projects;

create policy "Users can insert own voice dub projects"
  on public.voice_dub_projects
  for insert
  with check (clerk_user_id = current_setting('app.clerk_user_id', true));

drop policy if exists "Users can update own voice dub projects"
  on public.voice_dub_projects;

create policy "Users can update own voice dub projects"
  on public.voice_dub_projects
  for update
  using (clerk_user_id = current_setting('app.clerk_user_id', true));

drop policy if exists "Users can delete own voice dub projects"
  on public.voice_dub_projects;

create policy "Users can delete own voice dub projects"
  on public.voice_dub_projects
  for delete
  using (clerk_user_id = current_setting('app.clerk_user_id', true));

create table if not exists public.voice_audiobook_projects (
  id text primary key default gen_random_uuid()::text,
  clerk_user_id text not null,
  project_id text references public.voice_projects(id) on delete cascade,
  job_id text references public.voice_jobs(id) on delete set null,
  title text,
  author text,
  cover_path text,
  source_text_path text,
  voice_profile_id text references public.voice_profiles(id) on delete set null,
  output_path text,
  status text not null default 'pending',
  chapters jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists voice_audiobook_projects_clerk_user_id_idx
  on public.voice_audiobook_projects(clerk_user_id);

create index if not exists voice_audiobook_projects_project_id_idx
  on public.voice_audiobook_projects(project_id);

alter table public.voice_audiobook_projects enable row level security;

drop policy if exists "Users can view own voice audiobook projects"
  on public.voice_audiobook_projects;

create policy "Users can view own voice audiobook projects"
  on public.voice_audiobook_projects
  for select
  using (clerk_user_id = current_setting('app.clerk_user_id', true));

drop policy if exists "Users can insert own voice audiobook projects"
  on public.voice_audiobook_projects;

create policy "Users can insert own voice audiobook projects"
  on public.voice_audiobook_projects
  for insert
  with check (clerk_user_id = current_setting('app.clerk_user_id', true));

drop policy if exists "Users can update own voice audiobook projects"
  on public.voice_audiobook_projects;

create policy "Users can update own voice audiobook projects"
  on public.voice_audiobook_projects
  for update
  using (clerk_user_id = current_setting('app.clerk_user_id', true));

drop policy if exists "Users can delete own voice audiobook projects"
  on public.voice_audiobook_projects;

create policy "Users can delete own voice audiobook projects"
  on public.voice_audiobook_projects
  for delete
  using (clerk_user_id = current_setting('app.clerk_user_id', true));
