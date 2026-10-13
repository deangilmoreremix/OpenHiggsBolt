-- 20261010000000_voice_schema_reconcile
--
-- RECOVERED RECONSTRUCTION of an already-applied production migration.
--
-- This migration was applied to the production database (Supabase project
-- bzxohkrxcwodllketcpz, "VideoRemix Product"; recorded in
-- supabase_migrations.schema_migrations as version 20261010000000) but was
-- never committed to source control, so production could not be reproduced
-- from the repo. The definition below is reconstructed from the LIVE schema
-- (the source of truth), introspected on 2026-10-12 through the Supabase
-- Management API (information_schema.columns, pg_constraint, pg_indexes,
-- pg_policies, pg_get_expr defaults, storage.buckets). The voice-assets
-- bucket was created 2026-10-10 09:54:36 UTC, which matches this
-- migration's position in the applied history.
--
-- DO NOT treat this as a new change: re-running it against the live database
-- is intended to be a no-op. Column additions use `add column if not exists`
-- (skipped entirely when the column exists), and every policy is dropped
-- with `if exists` before being recreated with an identical definition.
--
-- What the applied production migration did (as reconstructed):
--   1. Added columns to the studio tables:
--        voice_profiles:    audio_url text, instruct text, language text,
--                           seed numeric, vd_states jsonb,
--                           locked boolean not null default false,
--                           ref_text text
--        voice_jobs:        input jsonb, output_asset_id uuid
--        voice_generations: audio_url text, duration_s numeric,
--                           gen_time_s numeric, seed numeric,
--                           starred boolean not null default false
--   2. Added Clerk-idiom policies (clerk_user_id =
--      current_setting('app.clerk_user_id', true)) to voice_projects,
--      voice_jobs, voice_generations and voice_profiles. In production these
--      were ADDED ALONGSIDE the original auth.uid() policies from
--      20260929000000_voice_studio_schema (the old policies were never
--      dropped), and that is preserved here: this file only creates the new
--      "... own voice ..." policies and never touches the old ones.
--   3. Created the voice_assets registry table (id text pk default
--      gen_random_uuid()::text, clerk_user_id text not null, project_id text
--      fk -> voice_projects(id) on delete cascade, job_id text fk ->
--      voice_jobs(id) on delete set null, kind text not null, storage_path
--      text not null, content_type text, size_bytes bigint, metadata jsonb,
--      created_at timestamptz not null default now()) with indexes on
--      clerk_user_id / project_id / job_id / kind, RLS enabled and four
--      Clerk-idiom owner policies.
--   4. Created the PUBLIC voice-assets bucket (public = true, no
--      file_size_limit, no allowed_mime_types restriction) plus four
--      owner-scoped policies on storage.objects ("voice assets owner
--      read/insert/update/delete") matching files whose first OR second path
--      segment is the caller's auth.uid().

-- 1. New columns on the studio tables ---------------------------------------

alter table public.voice_profiles
  add column if not exists audio_url text,
  add column if not exists instruct text,
  add column if not exists language text,
  add column if not exists seed numeric,
  add column if not exists vd_states jsonb,
  add column if not exists locked boolean not null default false,
  add column if not exists ref_text text;

alter table public.voice_jobs
  add column if not exists input jsonb,
  add column if not exists output_asset_id uuid;

alter table public.voice_generations
  add column if not exists audio_url text,
  add column if not exists duration_s numeric,
  add column if not exists gen_time_s numeric,
  add column if not exists seed numeric,
  add column if not exists starred boolean not null default false;

-- 2. Clerk-idiom policies, added alongside the original policies ------------

alter table public.voice_projects enable row level security;

drop policy if exists "Users can view own voice projects"
  on public.voice_projects;

create policy "Users can view own voice projects"
  on public.voice_projects
  for select
  using (clerk_user_id = current_setting('app.clerk_user_id', true));

drop policy if exists "Users can insert own voice projects"
  on public.voice_projects;

create policy "Users can insert own voice projects"
  on public.voice_projects
  for insert
  with check (clerk_user_id = current_setting('app.clerk_user_id', true));

drop policy if exists "Users can update own voice projects"
  on public.voice_projects;

create policy "Users can update own voice projects"
  on public.voice_projects
  for update
  using (clerk_user_id = current_setting('app.clerk_user_id', true));

drop policy if exists "Users can delete own voice projects"
  on public.voice_projects;

create policy "Users can delete own voice projects"
  on public.voice_projects
  for delete
  using (clerk_user_id = current_setting('app.clerk_user_id', true));

drop policy if exists "Users can view own voice jobs"
  on public.voice_jobs;

create policy "Users can view own voice jobs"
  on public.voice_jobs
  for select
  using (clerk_user_id = current_setting('app.clerk_user_id', true));

drop policy if exists "Users can insert own voice jobs"
  on public.voice_jobs;

create policy "Users can insert own voice jobs"
  on public.voice_jobs
  for insert
  with check (clerk_user_id = current_setting('app.clerk_user_id', true));

drop policy if exists "Users can update own voice jobs"
  on public.voice_jobs;

create policy "Users can update own voice jobs"
  on public.voice_jobs
  for update
  using (clerk_user_id = current_setting('app.clerk_user_id', true));

drop policy if exists "Users can delete own voice jobs"
  on public.voice_jobs;

create policy "Users can delete own voice jobs"
  on public.voice_jobs
  for delete
  using (clerk_user_id = current_setting('app.clerk_user_id', true));

drop policy if exists "Users can view own voice generations"
  on public.voice_generations;

create policy "Users can view own voice generations"
  on public.voice_generations
  for select
  using (clerk_user_id = current_setting('app.clerk_user_id', true));

drop policy if exists "Users can insert own voice generations"
  on public.voice_generations;

create policy "Users can insert own voice generations"
  on public.voice_generations
  for insert
  with check (clerk_user_id = current_setting('app.clerk_user_id', true));

drop policy if exists "Users can update own voice generations"
  on public.voice_generations;

create policy "Users can update own voice generations"
  on public.voice_generations
  for update
  using (clerk_user_id = current_setting('app.clerk_user_id', true));

drop policy if exists "Users can delete own voice generations"
  on public.voice_generations;

create policy "Users can delete own voice generations"
  on public.voice_generations
  for delete
  using (clerk_user_id = current_setting('app.clerk_user_id', true));

drop policy if exists "Users can view own voice profiles"
  on public.voice_profiles;

create policy "Users can view own voice profiles"
  on public.voice_profiles
  for select
  using (clerk_user_id = current_setting('app.clerk_user_id', true));

drop policy if exists "Users can insert own voice profiles"
  on public.voice_profiles;

create policy "Users can insert own voice profiles"
  on public.voice_profiles
  for insert
  with check (clerk_user_id = current_setting('app.clerk_user_id', true));

drop policy if exists "Users can update own voice profiles"
  on public.voice_profiles;

create policy "Users can update own voice profiles"
  on public.voice_profiles
  for update
  using (clerk_user_id = current_setting('app.clerk_user_id', true));

drop policy if exists "Users can delete own voice profiles"
  on public.voice_profiles;

create policy "Users can delete own voice profiles"
  on public.voice_profiles
  for delete
  using (clerk_user_id = current_setting('app.clerk_user_id', true));

-- 3. voice_assets registry table ---------------------------------------------

create table if not exists public.voice_assets (
  id text primary key default gen_random_uuid()::text,
  clerk_user_id text not null,
  project_id text references public.voice_projects(id) on delete cascade,
  job_id text references public.voice_jobs(id) on delete set null,
  kind text not null,
  storage_path text not null,
  content_type text,
  size_bytes bigint,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists voice_assets_clerk_user_id_idx
  on public.voice_assets(clerk_user_id);

create index if not exists voice_assets_project_id_idx
  on public.voice_assets(project_id);

create index if not exists voice_assets_job_id_idx
  on public.voice_assets(job_id);

create index if not exists voice_assets_kind_idx
  on public.voice_assets(kind);

alter table public.voice_assets enable row level security;

drop policy if exists "Users can view own voice assets"
  on public.voice_assets;

create policy "Users can view own voice assets"
  on public.voice_assets
  for select
  using (clerk_user_id = current_setting('app.clerk_user_id', true));

drop policy if exists "Users can insert own voice assets"
  on public.voice_assets;

create policy "Users can insert own voice assets"
  on public.voice_assets
  for insert
  with check (clerk_user_id = current_setting('app.clerk_user_id', true));

drop policy if exists "Users can update own voice assets"
  on public.voice_assets;

create policy "Users can update own voice assets"
  on public.voice_assets
  for update
  using (clerk_user_id = current_setting('app.clerk_user_id', true));

drop policy if exists "Users can delete own voice assets"
  on public.voice_assets;

create policy "Users can delete own voice assets"
  on public.voice_assets
  for delete
  using (clerk_user_id = current_setting('app.clerk_user_id', true));

-- 4. voice-assets bucket and its storage policies ----------------------------

insert into storage.buckets (id, name, public)
values ('voice-assets', 'voice-assets', true)
on conflict (id) do nothing;

drop policy if exists "voice assets owner read" on storage.objects;

create policy "voice assets owner read"
  on storage.objects
  for select
  using (
    bucket_id = 'voice-assets'
    and (
      (storage.foldername(name))[1] = (auth.uid())::text
      or (storage.foldername(name))[2] = (auth.uid())::text
    )
  );

drop policy if exists "voice assets owner insert" on storage.objects;

create policy "voice assets owner insert"
  on storage.objects
  for insert
  with check (
    bucket_id = 'voice-assets'
    and (
      (storage.foldername(name))[1] = (auth.uid())::text
      or (storage.foldername(name))[2] = (auth.uid())::text
    )
  );

drop policy if exists "voice assets owner update" on storage.objects;

create policy "voice assets owner update"
  on storage.objects
  for update
  using (
    bucket_id = 'voice-assets'
    and (
      (storage.foldername(name))[1] = (auth.uid())::text
      or (storage.foldername(name))[2] = (auth.uid())::text
    )
  )
  with check (
    bucket_id = 'voice-assets'
    and (
      (storage.foldername(name))[1] = (auth.uid())::text
      or (storage.foldername(name))[2] = (auth.uid())::text
    )
  );

drop policy if exists "voice assets owner delete" on storage.objects;

create policy "voice assets owner delete"
  on storage.objects
  for delete
  using (
    bucket_id = 'voice-assets'
    and (
      (storage.foldername(name))[1] = (auth.uid())::text
      or (storage.foldername(name))[2] = (auth.uid())::text
    )
  );
