-- 20260929000000_voice_studio_schema
--
-- RECOVERED RECONSTRUCTION of an already-applied production migration.
--
-- This migration was applied to the production database (Supabase project
-- bzxohkrxcwodllketcpz, "VideoRemix Product"; recorded in
-- supabase_migrations.schema_migrations as version 20260929000000) but was
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
-- Recreated objects (Voice Studio core tables, RLS enabled):
--   voice_projects     id text pk default gen_random_uuid()::text,
--                      clerk_user_id text not null, name text not null,
--                      kind text not null default 'general',
--                      metadata jsonb, created_at/updated_at timestamptz
--                      not null default now()
--   voice_profiles     id text pk default gen_random_uuid()::text,
--                      clerk_user_id text not null, name text not null,
--                      description text, kind text not null default 'clone',
--                      reference_url text, preview_url text,
--                      design_params jsonb, status text not null default
--                      'ready', created_at/updated_at timestamptz not null
--                      default now()
--   voice_jobs         id text pk default gen_random_uuid()::text,
--                      clerk_user_id text not null, project_id text fk
--                      -> voice_projects(id) on delete cascade, type text
--                      not null, status text not null default 'pending',
--                      progress integer, input_params jsonb,
--                      result_url text, error text, created_at/updated_at
--                      timestamptz not null default now(),
--                      finished_at timestamptz
--   voice_generations  id text pk default gen_random_uuid()::text,
--                      clerk_user_id text not null, project_id text fk
--                      -> voice_projects(id) on delete cascade, job_id text
--                      fk -> voice_jobs(id) on delete set null,
--                      profile_id text fk -> voice_profiles(id) on delete set
--                      null, model text, text text, language text,
--                      params jsonb, storage_path text, duration_ms integer,
--                      created_at timestamptz not null default now()
--   Indexes on clerk_user_id / project_id / job_id / profile_id / kind /
--   status per table, plus the redundant `*_user_idx` duplicates of the
--   clerk_user_id indexes that exist in the applied schema.
--   Owner policies scoped with the original idiom in force when this
--   migration ran: clerk_user_id = (auth.uid())::text. voice_profiles
--   originally had all four policies (select/insert/update/delete);
--   voice_jobs and voice_generations originally had only three
--   (select/insert/update — no delete policy existed until the
--   Clerk-idiom "... own voice ..." policies were added later by
--   20261010000000_voice_schema_reconcile.sql, which left these original
--   policies in place).

create table if not exists public.voice_projects (
  id text primary key default gen_random_uuid()::text,
  clerk_user_id text not null,
  name text not null,
  kind text not null default 'general',
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.voice_profiles (
  id text primary key default gen_random_uuid()::text,
  clerk_user_id text not null,
  name text not null,
  description text,
  kind text not null default 'clone',
  reference_url text,
  preview_url text,
  design_params jsonb,
  status text not null default 'ready',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.voice_jobs (
  id text primary key default gen_random_uuid()::text,
  clerk_user_id text not null,
  project_id text references public.voice_projects(id) on delete cascade,
  type text not null,
  status text not null default 'pending',
  progress integer,
  input_params jsonb,
  result_url text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  finished_at timestamptz
);

create table if not exists public.voice_generations (
  id text primary key default gen_random_uuid()::text,
  clerk_user_id text not null,
  project_id text references public.voice_projects(id) on delete cascade,
  job_id text references public.voice_jobs(id) on delete set null,
  profile_id text references public.voice_profiles(id) on delete set null,
  model text,
  text text,
  language text,
  params jsonb,
  storage_path text,
  duration_ms integer,
  created_at timestamptz not null default now()
);

create index if not exists voice_projects_clerk_user_id_idx
  on public.voice_projects(clerk_user_id);

create index if not exists voice_projects_kind_idx
  on public.voice_projects(kind);

create index if not exists voice_profiles_clerk_user_id_idx
  on public.voice_profiles(clerk_user_id);

create index if not exists voice_profiles_kind_idx
  on public.voice_profiles(kind);

create index if not exists voice_profiles_user_idx
  on public.voice_profiles(clerk_user_id);

create index if not exists voice_jobs_clerk_user_id_idx
  on public.voice_jobs(clerk_user_id);

create index if not exists voice_jobs_project_id_idx
  on public.voice_jobs(project_id);

create index if not exists voice_jobs_status_idx
  on public.voice_jobs(status);

create index if not exists voice_jobs_user_idx
  on public.voice_jobs(clerk_user_id);

create index if not exists voice_generations_clerk_user_id_idx
  on public.voice_generations(clerk_user_id);

create index if not exists voice_generations_job_id_idx
  on public.voice_generations(job_id);

create index if not exists voice_generations_profile_id_idx
  on public.voice_generations(profile_id);

create index if not exists voice_generations_project_id_idx
  on public.voice_generations(project_id);

create index if not exists voice_generations_user_idx
  on public.voice_generations(clerk_user_id);

alter table public.voice_projects enable row level security;

alter table public.voice_profiles enable row level security;

drop policy if exists "Users can view own profiles"
  on public.voice_profiles;

create policy "Users can view own profiles"
  on public.voice_profiles
  for select
  using (clerk_user_id = (auth.uid())::text);

drop policy if exists "Users can insert own profiles"
  on public.voice_profiles;

create policy "Users can insert own profiles"
  on public.voice_profiles
  for insert
  with check (clerk_user_id = (auth.uid())::text);

drop policy if exists "Users can update own profiles"
  on public.voice_profiles;

create policy "Users can update own profiles"
  on public.voice_profiles
  for update
  using (clerk_user_id = (auth.uid())::text);

drop policy if exists "Users can delete own profiles"
  on public.voice_profiles;

create policy "Users can delete own profiles"
  on public.voice_profiles
  for delete
  using (clerk_user_id = (auth.uid())::text);

alter table public.voice_jobs enable row level security;

drop policy if exists "Users can view own jobs"
  on public.voice_jobs;

create policy "Users can view own jobs"
  on public.voice_jobs
  for select
  using (clerk_user_id = (auth.uid())::text);

drop policy if exists "Users can insert own jobs"
  on public.voice_jobs;

create policy "Users can insert own jobs"
  on public.voice_jobs
  for insert
  with check (clerk_user_id = (auth.uid())::text);

drop policy if exists "Users can update own jobs"
  on public.voice_jobs;

create policy "Users can update own jobs"
  on public.voice_jobs
  for update
  using (clerk_user_id = (auth.uid())::text);

alter table public.voice_generations enable row level security;

drop policy if exists "Users can view own generations"
  on public.voice_generations;

create policy "Users can view own generations"
  on public.voice_generations
  for select
  using (clerk_user_id = (auth.uid())::text);

drop policy if exists "Users can insert own generations"
  on public.voice_generations;

create policy "Users can insert own generations"
  on public.voice_generations
  for insert
  with check (clerk_user_id = (auth.uid())::text);

drop policy if exists "Users can update own generations"
  on public.voice_generations;

create policy "Users can update own generations"
  on public.voice_generations
  for update
  using (clerk_user_id = (auth.uid())::text);
