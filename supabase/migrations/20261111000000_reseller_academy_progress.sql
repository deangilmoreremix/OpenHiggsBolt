-- Reseller Academy learning progress (EDUCATIONAL ACTIVITY ONLY).
--
-- This table stores which lessons a signed-in learner has completed. It is NOT
-- an entitlement store: no code path reads it to decide access, and it must
-- never be joined to user_entitlements / reseller_purchases for access rules.
--
-- Applied to the shared Supabase project "VideoRemix Product" on 2026-11-13.
--
-- This database is shared by several apps: every object created here carries the
-- [openhiggsbolt-academy] label in its table comment so it can be told apart.

create table if not exists public.reseller_academy_progress (
  clerk_user_id text primary key,
  state jsonb not null default '{}'::jsonb,
  selected_app_id text,
  updated_at timestamptz not null default now(),
  constraint reseller_academy_progress_state_size check (pg_column_size(state) <= 32768)
);

alter table public.reseller_academy_progress enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'reseller_academy_progress'
      and policyname = 'Users can view own academy progress'
  ) then
    create policy "Users can view own academy progress"
      on public.reseller_academy_progress for select
      using (clerk_user_id = current_setting('app.clerk_user_id', true));
  end if;
end $$;

-- Writes go through the server API route using the service role (same pattern
-- as the existing reseller tables); no anon/authenticated write policy exists.

comment on table public.reseller_academy_progress is '[openhiggsbolt-academy] OpenHiggsBolt / SmartVideo GO Reseller Academy: per-learner lesson progress and selected app, keyed by Clerk user id. Educational activity only, never read for access decisions (not an entitlement store). Writes are service-role only via the server API route.';
