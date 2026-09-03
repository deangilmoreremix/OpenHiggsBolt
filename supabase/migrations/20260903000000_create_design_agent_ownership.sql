-- Design Agent ownership registry
--
-- Persists the mapping between SmartVideo GO users and their Design Agent
-- sessions/jobs so ownership can be enforced server-side across stateless
-- requests. Each row records that `clerk_user_id` owns `session_id` and/or
-- `job_id`.

create table if not exists public.design_agent_ownership (
  id text primary key default gen_random_uuid()::text,
  clerk_user_id text not null,
  session_id text not null,
  job_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint design_agent_ownership_session_id_key unique (session_id),
  constraint design_agent_ownership_job_id_key unique (job_id)
);

create index if not exists design_agent_ownership_clerk_user_id_idx
  on public.design_agent_ownership(clerk_user_id);

-- Only the owning user may read/update/delete their rows.
alter table public.design_agent_ownership enable row level security;

create policy "Users can view own ownership rows"
  on public.design_agent_ownership for select
  using (clerk_user_id = current_setting('app.clerk_user_id', true));

create policy "Users can insert own ownership rows"
  on public.design_agent_ownership for insert
  with check (clerk_user_id = current_setting('app.clerk_user_id', true));

create policy "Users can update own ownership rows"
  on public.design_agent_ownership for update
  using (clerk_user_id = current_setting('app.clerk_user_id', true));
