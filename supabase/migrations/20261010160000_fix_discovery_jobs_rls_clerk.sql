-- H5 (High): personalization_discovery_jobs RLS policies are inert under Clerk auth.
--
-- The original migration (20260928000000_create_personalization_discovery_jobs.sql)
-- scoped all three policies to `clerk_user_id = auth.uid()::text`. This project
-- authenticates with Clerk, NOT Supabase Auth:
--   * The browser anon key (src/lib/supabase.ts, NEXT_PUBLIC_SUPABASE_ANON_KEY)
--     never carries a Supabase JWT, so `auth.uid()` is always NULL.
--   * `clerk_user_id = NULL` is never true, so the three policies below matched
--     ZERO rows. The table behaved as if it had no owner-scoped policies at all.
--
-- Applied migrations are immutable and this repo forbids editing them, so this
-- new migration DROPS the three broken policies and recreates them with the
-- correct Clerk idiom, copied verbatim from the reference migration
-- 20260905000000_create_personalization_outputs.sql:
--
--   clerk_user_id = current_setting('app.clerk_user_id', true)
--
-- The request user is established by calling
--   set_config('app.clerk_user_id', <clerk user id>, true)
-- on the session — see src/lib/supabaseServer.ts:19-39 and the
-- `set_config` RPC calls in app/api/personalization/project/route.ts:69-73.
-- The `true` second argument makes a missing setting return NULL (fail closed),
-- so unauthenticated anon clients match no rows instead of erroring.
--
-- Re-runnable: every statement below is idempotent (enable is a no-op when the
-- table already has RLS; each policy is dropped with `if exists` first).

alter table public.personalization_discovery_jobs enable row level security;

drop policy if exists "Users can view own discovery jobs"
  on public.personalization_discovery_jobs;

drop policy if exists "Users can insert own discovery jobs"
  on public.personalization_discovery_jobs;

drop policy if exists "Users can update own discovery jobs"
  on public.personalization_discovery_jobs;

create policy "Users can view own discovery jobs"
  on public.personalization_discovery_jobs
  for select
  using (clerk_user_id = current_setting('app.clerk_user_id', true));

create policy "Users can insert own discovery jobs"
  on public.personalization_discovery_jobs
  for insert
  with check (clerk_user_id = current_setting('app.clerk_user_id', true));

create policy "Users can update own discovery jobs"
  on public.personalization_discovery_jobs
  for update
  using (clerk_user_id = current_setting('app.clerk_user_id', true))
  with check (clerk_user_id = current_setting('app.clerk_user_id', true));
