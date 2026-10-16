-- Personalization saved projects: dedicated table + atomic ownership RPCs.
--
-- H6 follow-up: the existing public.personalization_projects table is owned by
-- a different feature (profile-scan driven generation). Verified live before
-- writing this migration:
--   * user_id uuid NOT NULL  FOREIGN KEY auth.users(id)   -- the Supabase auth
--     table, unused by this app (Clerk is the identity provider), so a Clerk
--     user id can never satisfy it;
--   * mode / status carry CHECK constraints
--     (mode IN ('cold-email','video-email','proposal','sales-page','thumbnail',
--      'content-campaign','agency-pitch','lead-summary'),
--      status IN ('draft','generating','complete','failed')) that the
--     personalization route's values do not satisfy;
--   * scan_id uuid FOREIGN KEY profile_scan_results(id);
--   * 0 rows, RLS disabled, one inert `auth.uid() = user_id` policy.
-- app/api/personalization/project/route.ts selects clerk_user_id, source,
-- client, assets, prompt, output_type, generation and error_message -- none of
-- which exist there -- so it fails with PostgREST 42703 today.
--
-- Rather than relaxing another feature's NOT NULL columns, foreign keys and
-- CHECK constraints (which would silently widen that feature's accepted
-- input), the personalization feature gets its own table. The existing
-- personalization_projects table, its constraints, its rows and its policy are
-- left byte-for-byte untouched, and 20261010160100_personalization_projects_owner_rls.sql
-- stays a documented no-op for it.
--
-- The ownership model uses the Clerk identity (clerk_user_id text), matching
-- every other personalization table in this repo.
--
-- OWNERSHIP IS ENFORCED IN THE DATABASE, ATOMICALLY. The route previously ran
--   await supabase.rpc('set_config', {setting:'app.clerk_user_id', is_local:true})
--   await supabase.from(...).select(...)
-- as two separate HTTP round-trips. PostgREST serves each request from a
-- connection pool, so `set_config(..., is_local => true)` is scoped to the
-- *first* request's transaction and is discarded before the second one runs;
-- the GUC the RLS policies read is therefore empty and the policies match
-- nothing. The functions below accept the identity as an explicit parameter and
-- call set_config inside the SAME transaction as the protected operation, so
-- the ownership check is both atomic and correct.

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------

create table if not exists public.personalization_saved_projects (
  id             uuid primary key default gen_random_uuid(),
  clerk_user_id  text not null,
  source         jsonb not null default '{}'::jsonb,
  client         jsonb not null default '{}'::jsonb,
  assets         jsonb not null default '{}'::jsonb,
  prompt         jsonb not null default '{}'::jsonb,
  generation     jsonb not null default '{}'::jsonb,
  output_type    text not null default 'prompt',
  mode           text,
  status         text not null default 'idle',
  error_message  text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint personalization_saved_projects_status_check
    check (status in ('idle', 'generating', 'complete', 'failed', 'error'))
);

comment on table public.personalization_saved_projects is
  'Saved personalization projects, owned by a Clerk user id. See app/api/personalization/project/route.ts.';

create index if not exists personalization_saved_projects_clerk_user_id_idx
  on public.personalization_saved_projects (clerk_user_id, updated_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.personalization_saved_projects enable row level security;

-- The Clerk idiom used by every other personalization table in this repo. The
-- GUC is set inside the RPCs below (same transaction), so it is populated for
-- every route call. For a direct PostgREST call from a browser the GUC is
-- absent, the predicate evaluates to NULL, and the row is invisible -- the
-- fail-closed default, which is why the browser never writes this table
-- directly (the server route is the only writer).
drop policy if exists "personalization_saved_projects_select_own" on public.personalization_saved_projects;
create policy "personalization_saved_projects_select_own"
  on public.personalization_saved_projects for select
  using (clerk_user_id = nullif(current_setting('app.clerk_user_id', true), ''));

drop policy if exists "personalization_saved_projects_insert_own" on public.personalization_saved_projects;
create policy "personalization_saved_projects_insert_own"
  on public.personalization_saved_projects for insert
  with check (clerk_user_id = nullif(current_setting('app.clerk_user_id', true), ''));

drop policy if exists "personalization_saved_projects_update_own" on public.personalization_saved_projects;
create policy "personalization_saved_projects_update_own"
  on public.personalization_saved_projects for update
  using (clerk_user_id = nullif(current_setting('app.clerk_user_id', true), ''))
  with check (clerk_user_id = nullif(current_setting('app.clerk_user_id', true), ''));

drop policy if exists "personalization_saved_projects_delete_own" on public.personalization_saved_projects;
create policy "personalization_saved_projects_delete_own"
  on public.personalization_saved_projects for delete
  using (clerk_user_id = nullif(current_setting('app.clerk_user_id', true), ''));

-- ---------------------------------------------------------------------------
-- Ownership RPCs (SECURITY DEFINER, atomic identity + protected operation)
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER is required so the function can set the GUC and the
-- statement still resolves the RLS policies against it; search_path is pinned
-- to prevent search-path hijacking of the unqualified names.

create or replace function public.personalization_saved_projects_list(p_clerk_user_id text)
returns setof public.personalization_saved_projects
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_clerk_user_id is null or p_clerk_user_id = '' then
    raise exception 'personalization_saved_projects_list: clerk_user_id is required'
      using errcode = '28000';
  end if;
  perform set_config('app.clerk_user_id', p_clerk_user_id, true);
  return query
    select * from public.personalization_saved_projects
    where clerk_user_id = p_clerk_user_id
    order by updated_at desc
    limit 50;
end;
$$;

create or replace function public.personalization_saved_projects_get(
  p_id uuid,
  p_clerk_user_id text
)
returns setof public.personalization_saved_projects
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_clerk_user_id is null or p_clerk_user_id = '' then
    raise exception 'personalization_saved_projects_get: clerk_user_id is required'
      using errcode = '28000';
  end if;
  perform set_config('app.clerk_user_id', p_clerk_user_id, true);
  return query
    select * from public.personalization_saved_projects
    where id = p_id
      and clerk_user_id = p_clerk_user_id;
end;
$$;

-- Insert-or-update. Ownership is asserted on the existing row before any
-- update, so a caller who supplies another user's id updates zero rows and
-- gets 404 rather than silently succeeding or leaking the row's existence.
create or replace function public.personalization_saved_projects_upsert(
  p_id uuid,
  p_clerk_user_id text,
  p_source jsonb default '{}'::jsonb,
  p_client jsonb default '{}'::jsonb,
  p_assets jsonb default '{}'::jsonb,
  p_prompt jsonb default '{}'::jsonb,
  p_generation jsonb default '{}'::jsonb,
  p_output_type text default 'prompt',
  p_mode text default null,
  p_status text default 'idle',
  p_error_message text default null
)
returns public.personalization_saved_projects
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row public.personalization_saved_projects;
begin
  if p_clerk_user_id is null or p_clerk_user_id = '' then
    raise exception 'personalization_saved_projects_upsert: clerk_user_id is required'
      using errcode = '28000';
  end if;
  perform set_config('app.clerk_user_id', p_clerk_user_id, true);

  if p_id is null then
    insert into public.personalization_saved_projects
      (clerk_user_id, source, client, assets, prompt, generation,
       output_type, mode, status, error_message)
    values
      (p_clerk_user_id,
       coalesce(p_source, '{}'::jsonb),
       coalesce(p_client, '{}'::jsonb),
       coalesce(p_assets, '{}'::jsonb),
       coalesce(p_prompt, '{}'::jsonb),
       coalesce(p_generation, '{}'::jsonb),
       coalesce(p_output_type, 'prompt'),
       p_mode,
       coalesce(p_status, 'idle'),
       p_error_message)
    returning * into v_row;
  else
    -- Ownership must be re-checked here, not taken on trust from the caller.
    if not exists (
      select 1 from public.personalization_saved_projects
      where id = p_id and clerk_user_id = p_clerk_user_id
    ) then
      raise exception 'personalization_saved_projects_upsert: project % not owned by caller', p_id
        using errcode = '42501';
    end if;

    update public.personalization_saved_projects
    set source = coalesce(p_source, '{}'::jsonb),
        client = coalesce(p_client, '{}'::jsonb),
        assets = coalesce(p_assets, '{}'::jsonb),
        prompt = coalesce(p_prompt, '{}'::jsonb),
        generation = coalesce(p_generation, '{}'::jsonb),
        output_type = coalesce(p_output_type, 'prompt'),
        mode = p_mode,
        status = coalesce(p_status, 'idle'),
        error_message = p_error_message,
        updated_at = now()
    where id = p_id and clerk_user_id = p_clerk_user_id
    returning * into v_row;
  end if;

  return v_row;
end;
$$;

create or replace function public.personalization_saved_projects_delete(
  p_id uuid,
  p_clerk_user_id text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_deleted int;
begin
  if p_clerk_user_id is null or p_clerk_user_id = '' then
    raise exception 'personalization_saved_projects_delete: clerk_user_id is required'
      using errcode = '28000';
  end if;
  perform set_config('app.clerk_user_id', p_clerk_user_id, true);

  delete from public.personalization_saved_projects
  where id = p_id and clerk_user_id = p_clerk_user_id;
  get diagnostics v_deleted = row_count;

  return v_deleted > 0;
end;
$$;

-- Grant execute to the server-side roles only. The anon/authenticated browser
-- roles intentionally receive nothing: the server route (service role) is the
-- only writer, and a browser that could call these with an arbitrary
-- clerk_user_id would bypass the session check in the route.
revoke all on function public.personalization_saved_projects_list(text) from public, anon, authenticated;
revoke all on function public.personalization_saved_projects_get(uuid, text) from public, anon, authenticated;
revoke all on function public.personalization_saved_projects_upsert(uuid, text, jsonb, jsonb, jsonb, jsonb, jsonb, text, text, text, text) from public, anon, authenticated;
revoke all on function public.personalization_saved_projects_delete(uuid, text) from public, anon, authenticated;
