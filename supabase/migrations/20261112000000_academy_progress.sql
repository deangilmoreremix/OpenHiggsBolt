-- Academy course progress (EDUCATIONAL ACTIVITY ONLY).
--
-- Stores where a signed-in learner is in the Academy courses (current lesson and
-- step, steps gone through, checklist ticks, lessons marked complete) so it
-- follows them across devices. It is NOT an entitlement store: no code path reads
-- it to decide access. Signed-out visitors keep progress in their browser only.
--
-- Applied to the shared Supabase project "VideoRemix Product" on 2026-11-13. Until it is
-- applied the app keeps working: progress is saved in the browser and the UI says so.
--
-- This database is shared by several apps: every object created here carries the
-- [openhiggsbolt-academy] label in its table comment so it can be told apart.

create table if not exists public.academy_progress (
  clerk_user_id text primary key,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint academy_progress_state_size check (pg_column_size(state) <= 65536)
);

alter table public.academy_progress enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'academy_progress'
      and policyname = 'Users can view own academy course progress'
  ) then
    create policy "Users can view own academy course progress"
      on public.academy_progress for select
      using (clerk_user_id = current_setting('app.clerk_user_id', true));
  end if;
end $$;

-- Writes go through the server API route (app/api/academy/progress) using the
-- service role; no anon/authenticated write policy exists.

comment on table public.academy_progress is '[openhiggsbolt-academy] OpenHiggsBolt / SmartVideo GO Academy: per-learner course progress (current lesson and step, checklist ticks, completed lessons), keyed by Clerk user id. Educational activity only, never read for access decisions. Writes are service-role only via app/api/academy/progress.';
