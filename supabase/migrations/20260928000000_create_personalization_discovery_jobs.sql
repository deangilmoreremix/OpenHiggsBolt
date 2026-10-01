-- Personalization discovery background jobs
create table if not exists public.personalization_discovery_jobs (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  website_url text not null,
  status text not null default 'queued',
  fast_result_json jsonb,
  browser_result_json jsonb,
  final_result_json jsonb,
  telemetry_json jsonb,
  error_code text,
  error_message text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  expires_at timestamptz not null default now() + interval '7 days'
);

create index if not exists idx_personalization_discovery_jobs_user
  on public.personalization_discovery_jobs (clerk_user_id, created_at desc);

create index if not exists idx_personalization_discovery_jobs_status
  on public.personalization_discovery_jobs (status, created_at);

alter table public.personalization_discovery_jobs enable row level security;

create policy "Users can view own discovery jobs"
  on public.personalization_discovery_jobs
  for select
  using (clerk_user_id = auth.uid()::text);

create policy "Users can insert own discovery jobs"
  on public.personalization_discovery_jobs
  for insert
  with check (clerk_user_id = auth.uid()::text);

create policy "Users can update own discovery jobs"
  on public.personalization_discovery_jobs
  for update
  using (clerk_user_id = auth.uid()::text);
