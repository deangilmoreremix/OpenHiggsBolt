-- H6 (High): personalization_projects RLS state unverifiable from source.
--
-- VERIFIED LIVE SCHEMA MISMATCH — READ BEFORE APPLYING (verified 2026-10-12
-- against project bzxohkrxcwodllketcpz, Postgres 17.6.1.084):
--   * public.personalization_projects EXISTS with RLS DISABLED. Its live
--     columns are: id (uuid), user_id (uuid NOT NULL), app_id (text NOT
--     NULL), mode (text NOT NULL), target_name (text NOT NULL),
--     target_company, manual_notes, scan_id (uuid), status, created_at,
--     updated_at. There is NO `clerk_user_id` column. Its one live policy
--     `Users can manage own projects` (FOR ALL, `auth.uid() = user_id`) is
--     inert under Clerk because auth.uid() is always NULL.
--   * The app route app/api/personalization/project/route.ts selects and
--     writes `clerk_user_id, source, client, assets, prompt, output_type,
--     generation, error_message` — NONE of those columns exist on the live
--     table — so the route is ALREADY failing in production today with
--     PostgREST 42703 "column does not exist".
--
-- CONSEQUENCE: this migration MUST NOT be applied until the route and the
-- table are reconciled. Reconciling them (rename user_id to clerk_user_id,
-- keep user_id and add clerk_user_id, or reshape both) is an app/schema
-- redesign decision for the repo owner and is deliberately NOT attempted
-- here — this file never creates or alters the table and never adds or
-- drops a column.
--
-- WHAT THIS FILE DOES NOW: it REFUSES TO RUN on the current live schema.
-- When the table exists WITHOUT `clerk_user_id`, the DO block below raises
-- a hard EXCEPTION naming the missing column. Because migrations are
-- applied inside a single transaction, the exception aborts this migration
-- before any statement takes effect: the live table keeps its
-- RLS-disabled state, its one legacy policy, and its current columns —
-- i.e. applying this file changes NOTHING and cannot silently enable RLS
-- with zero policies (the old, silent behaviour) on a table whose shape
-- the route does not match. When the table does not exist at all, the
-- file remains a no-op (notice only — nothing to protect). Only when the
-- table exists AND has `clerk_user_id` does the file enable RLS and
-- create the owner-scoped policies.
--
-- IDEMPOTENT: every drop uses `if exists`, the enable is a no-op when RLS
--   is already on, and the guard re-checks the schema on every run, so the
--   file is re-runnable and converges on the Clerk owner-scoped idiom used
--   by 20260905000000_create_personalization_outputs.sql: identity comes
--   from Clerk via set_config('app.clerk_user_id', userId, true)
--   (src/lib/supabaseServer.ts), so `auth.uid()` is never used — it is
--   always NULL under Clerk and would make policies inert.

do $$
begin
  if not exists (
    select 1
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'personalization_projects'
  ) then
    raise notice 'H6: table public.personalization_projects does not exist; nothing to protect, migration is a no-op.';
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
    raise exception 'H6 REFUSING TO RUN: public.personalization_projects exists but has NO clerk_user_id column (live columns: id, user_id, app_id, mode, target_name, target_company, manual_notes, scan_id, status, created_at, updated_at). The route app/api/personalization/project/route.ts already fails with PostgREST 42703 because it references clerk_user_id, source, client, assets, prompt, output_type, generation and error_message, none of which exist. Reconcile the route and the table first (an app/schema redesign decision for the repo owner), then re-run this migration. No changes were made to the database.';
  end if;

  execute 'alter table public.personalization_projects enable row level security';

  execute 'drop policy if exists "Users can manage own projects" on public.personalization_projects';
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
