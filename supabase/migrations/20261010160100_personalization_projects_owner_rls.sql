-- H6 (High, suspected): personalization_projects RLS state unverifiable from source.
--
-- No migration in supabase/migrations/ creates public.personalization_projects
-- or its policies. The table exists only as an out-of-band object (created
-- directly in the Supabase dashboard / console when the persistence feature was
-- built; the older docs/personalization-mismatch-classification-report.md:299
-- still lists "Introduce a personalization_projects Supabase table" as a
-- recommendation), and the live RLS state cannot be audited from this repo.
--
-- The risk: the API route app/api/personalization/project/route.ts filters by
-- clerk_user_id, but the browser bundles the public anon key
-- (src/lib/supabase.ts -> NEXT_PUBLIC_SUPABASE_ANON_KEY). If the table lacks
-- Row Level Security in the live database, that anon key grants full table
-- access to anyone (read, insert, overwrite, delete every user's projects).
--
-- SAFETY — this migration deliberately does NOT create or alter the table:
--   * No `create table`: the live shape may have drifted from what the route
--     expects (route reads columns id, clerk_user_id, source, client, assets,
--     prompt, output_type, mode, status, error_message, created_at, updated_at)
--     and inventing a guessed schema could break a live table.
--   * No column is altered or dropped.
--   * The `alter table` below uses `if exists`, so it is a safe no-op when the
--     table is absent.
--   * Policy creation is wrapped in a DO block that only runs when the table
--     AND its clerk_user_id column both exist; otherwise it raises a notice
--     and skips. When the table exists but the guard skips policies, RLS is
--     still enabled with zero policies, which denies all access (fail closed)
--     instead of failing open.
--   * Each policy is dropped with `drop policy if exists` before creation, so
--     the migration is re-runnable and converges on the Clerk owner-scoped
--     idiom, even if an out-of-band policy with the same name already exists.
--
-- The idiom matches 20260905000000_create_personalization_outputs.sql: identity
-- comes from Clerk via set_config('app.clerk_user_id', userId, true)
-- (src/lib/supabaseServer.ts:19-39), so `auth.uid()` is never used — it is
-- always NULL under Clerk and would make policies inert.

alter table if exists public.personalization_projects enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'personalization_projects'
  ) then
    raise notice 'H6: table public.personalization_projects does not exist; RLS guard skipped (nothing to protect).';
    return;
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_attribute a
    where a.attrelid = 'public.personalization_projects'::regclass
      and a.attname = 'clerk_user_id'
      and a.attnum > 0
      and not a.attisdropped
  ) then
    raise notice 'H6: public.personalization_projects exists but has no clerk_user_id column; owner-scoped policies skipped (RLS enabled with no policies = deny all, fail closed).';
    return;
  end if;

  execute 'drop policy if exists "Users can view own personalization projects" on public.personalization_projects';
  execute 'drop policy if exists "Users can insert own personalization projects" on public.personalization_projects';
  execute 'drop policy if exists "Users can update own personalization projects" on public.personalization_projects';
  execute 'drop policy if exists "Users can delete own personalization projects" on public.personalization_projects';

  execute $policy$
    create policy "Users can view own personalization projects"
      on public.personalization_projects for select
      using (clerk_user_id = current_setting('app.clerk_user_id', true))
  $policy$;

  execute $policy$
    create policy "Users can insert own personalization projects"
      on public.personalization_projects for insert
      with check (clerk_user_id = current_setting('app.clerk_user_id', true))
  $policy$;

  execute $policy$
    create policy "Users can update own personalization projects"
      on public.personalization_projects for update
      using (clerk_user_id = current_setting('app.clerk_user_id', true))
      with check (clerk_user_id = current_setting('app.clerk_user_id', true))
  $policy$;

  execute $policy$
    create policy "Users can delete own personalization projects"
      on public.personalization_projects for delete
      using (clerk_user_id = current_setting('app.clerk_user_id', true))
  $policy$;
end
$$;
