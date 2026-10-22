-- Lead Finder lead management: per-user shortlist with pipeline stages.
--
-- WHY A DEDICATED TABLE
-- There is no lead/shortlist/prospect persistence anywhere in this repo yet:
-- the Lead Finder search results are recomputed from OpenStreetMap on every
-- request and thrown away, so a user cannot keep a shortlist, move a lead
-- through a pipeline, or annotate it. This migration adds that storage
-- without touching any existing table, because every other personalization
-- table in this schema carries constraints that belong to a different
-- feature (see 20261013000000_personalization_saved_projects.sql for the
-- same reasoning applied to saved projects).
--
-- The ownership model uses the Clerk identity (clerk_user_id text), matching
-- every other personalization table in this repo. There is no FK to
-- auth.users: Clerk is the identity provider here, so a Clerk user id can
-- never satisfy a Supabase auth.uid() reference.
--
-- OWNERSHIP IS ENFORCED IN THE DATABASE, ATOMICALLY. A route that ran
--   await supabase.rpc('set_config', {setting:'app.clerk_user_id', is_local:true})
--   await supabase.from(...).select(...)
-- as two separate HTTP round-trips would be broken: PostgREST serves each
-- request from a connection pool, so `set_config(..., is_local => true)` is
-- scoped to the *first* request's transaction and is discarded before the
-- second one runs; the GUC the RLS policies read is therefore empty and the
-- policies match nothing. The functions below accept the identity as an
-- explicit parameter and call set_config inside the SAME transaction as the
-- protected operation, so the ownership check is both atomic and correct.
--
-- A lead is identified by its OpenStreetMap record id (`business_id`, e.g.
-- 'osm-node-123') scoped to the owner, which is what the UNIQUE constraint
-- encodes: re-saving the same business updates the existing lead instead of
-- creating a duplicate. The full BusinessDiscoveryRecord snapshot is stored
-- in `business` so a saved lead still renders (and stays scorable) after the
-- upstream OpenStreetMap response changes.
--
-- The `stage` vocabulary is duplicated in exactly one other place:
-- src/shared/personalization/leadStages.ts. The CHECK constraint below is the
-- backstop that rejects an unknown stage even when the API is bypassed.

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------

create table if not exists public.lead_finder_leads (
  id            uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  -- OpenStreetMap record id of the prospect (e.g. 'osm-node-123').
  business_id   text not null,
  -- Full BusinessDiscoveryRecord snapshot taken when the lead was saved.
  business      jsonb not null default '{}'::jsonb,
  stage         text not null default 'New',
  notes         text,
  starred       boolean not null default false,
  niche         text,
  location      text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint lead_finder_leads_stage_check
    check (stage in ('New', 'Qualified', 'Shortlisted', 'Demo Created',
                     'Contacted', 'Responded', 'Converted', 'Not Interested')),
  -- Re-saving the same business updates the existing lead instead of
  -- duplicating it. The owner is part of the key: two users may legitimately
  -- shortlist the same business.
  constraint lead_finder_leads_owner_business_key
    unique (clerk_user_id, business_id)
);

comment on table public.lead_finder_leads is
  'Lead Finder shortlist and pipeline, owned by a Clerk user id. See app/api/personalization/leads/route.ts.';

-- The list view is "this owner's leads, most recently touched first".
create index if not exists lead_finder_leads_clerk_updated_at_idx
  on public.lead_finder_leads (clerk_user_id, updated_at desc);

-- The pipeline view filters by stage for one owner.
create index if not exists lead_finder_leads_clerk_stage_idx
  on public.lead_finder_leads (clerk_user_id, stage);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.lead_finder_leads enable row level security;

-- The Clerk idiom used by every other personalization table in this repo. The
-- GUC is set inside the RPCs below (same transaction), so it is populated for
-- every route call. For a direct PostgREST call from a browser the GUC is
-- absent, the predicate evaluates to NULL, and the row is invisible -- the
-- fail-closed default, which is why the browser never writes this table
-- directly (the server route is the only writer).
drop policy if exists "lead_finder_leads_select_own" on public.lead_finder_leads;
create policy "lead_finder_leads_select_own"
  on public.lead_finder_leads for select
  using (clerk_user_id = nullif(current_setting('app.clerk_user_id', true), ''));

drop policy if exists "lead_finder_leads_insert_own" on public.lead_finder_leads;
create policy "lead_finder_leads_insert_own"
  on public.lead_finder_leads for insert
  with check (clerk_user_id = nullif(current_setting('app.clerk_user_id', true), ''));

drop policy if exists "lead_finder_leads_update_own" on public.lead_finder_leads;
create policy "lead_finder_leads_update_own"
  on public.lead_finder_leads for update
  using (clerk_user_id = nullif(current_setting('app.clerk_user_id', true), ''))
  with check (clerk_user_id = nullif(current_setting('app.clerk_user_id', true), ''));

drop policy if exists "lead_finder_leads_delete_own" on public.lead_finder_leads;
create policy "lead_finder_leads_delete_own"
  on public.lead_finder_leads for delete
  using (clerk_user_id = nullif(current_setting('app.clerk_user_id', true), ''));

-- ---------------------------------------------------------------------------
-- Ownership RPCs (SECURITY DEFINER, atomic identity + protected operation)
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER is required so the function can set the GUC and the
-- statement still resolves the RLS policies against it; search_path is pinned
-- to prevent search-path hijacking of the unqualified names.

create or replace function public.lead_finder_leads_list(p_clerk_user_id text)
returns setof public.lead_finder_leads
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_clerk_user_id is null or p_clerk_user_id = '' then
    raise exception 'lead_finder_leads_list: clerk_user_id is required'
      using errcode = '28000';
  end if;
  perform set_config('app.clerk_user_id', p_clerk_user_id, true);
  -- The cap keeps a single request from streaming an unbounded pipeline
  -- board; the route paginates by narrowing, not by offsetting.
  return query
    select * from public.lead_finder_leads
    where clerk_user_id = p_clerk_user_id
    order by updated_at desc
    limit 200;
end;
$$;

-- Insert-or-update. Ownership is asserted on the existing row before any
-- update, so a caller who supplies another user's id updates zero rows and
-- gets 404 rather than silently succeeding or leaking the row's existence.
--
-- A NULL argument means "not specified": on the update path the stored value
-- is preserved, so a partial PATCH (stage only) never wipes the business
-- snapshot, the notes, or the star flag. Only the insert path substitutes
-- the defaults.
create or replace function public.lead_finder_leads_upsert(
  p_id uuid,
  p_clerk_user_id text,
  p_business_id text,
  p_business jsonb default null,
  p_stage text default null,
  p_notes text default null,
  p_starred boolean default null,
  p_niche text default null,
  p_location text default null
)
returns public.lead_finder_leads
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row public.lead_finder_leads;
begin
  if p_clerk_user_id is null or p_clerk_user_id = '' then
    raise exception 'lead_finder_leads_upsert: clerk_user_id is required'
      using errcode = '28000';
  end if;
  -- Defense in depth: the CHECK constraint also rejects an unknown stage,
  -- but validating here yields a precise error instead of a constraint
  -- violation.
  if p_stage is not null and p_stage not in (
    'New', 'Qualified', 'Shortlisted', 'Demo Created',
    'Contacted', 'Responded', 'Converted', 'Not Interested'
  ) then
    raise exception 'lead_finder_leads_upsert: invalid stage %', p_stage
      using errcode = '22023';
  end if;
  perform set_config('app.clerk_user_id', p_clerk_user_id, true);

  if p_id is null then
    if p_business_id is null or p_business_id = '' then
      raise exception 'lead_finder_leads_upsert: business_id is required'
        using errcode = '22023';
    end if;

    insert into public.lead_finder_leads as lfl
      (clerk_user_id, business_id, business, stage, notes, starred, niche, location)
    values
      (p_clerk_user_id,
       p_business_id,
       coalesce(p_business, '{}'::jsonb),
       coalesce(p_stage, 'New'),
       p_notes,
       coalesce(p_starred, false),
       p_niche,
       p_location)
    on conflict (clerk_user_id, business_id) do update
      set business = excluded.business,
          -- A re-save that did not mention a stage (or a star flag) must not
          -- reset what the user already set on the lead.
          stage = case when p_stage is null then lfl.stage else excluded.stage end,
          notes = case when p_notes is null then lfl.notes else excluded.notes end,
          starred = case when p_starred is null then lfl.starred else excluded.starred end,
          niche = case when p_niche is null then lfl.niche else excluded.niche end,
          location = case when p_location is null then lfl.location else excluded.location end,
          updated_at = now()
    returning * into v_row;
  else
    -- Ownership must be re-checked here, not taken on trust from the caller.
    if not exists (
      select 1 from public.lead_finder_leads
      where id = p_id and clerk_user_id = p_clerk_user_id
    ) then
      raise exception 'lead_finder_leads_upsert: lead % not owned by caller', p_id
        using errcode = '42501';
    end if;

    update public.lead_finder_leads
    set business_id = coalesce(p_business_id, business_id),
        business = coalesce(p_business, business),
        stage = coalesce(p_stage, stage),
        notes = coalesce(p_notes, notes),
        starred = coalesce(p_starred, starred),
        niche = coalesce(p_niche, niche),
        location = coalesce(p_location, location),
        updated_at = now()
    where id = p_id and clerk_user_id = p_clerk_user_id
    returning * into v_row;
  end if;

  return v_row;
end;
$$;

create or replace function public.lead_finder_leads_delete(
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
    raise exception 'lead_finder_leads_delete: clerk_user_id is required'
      using errcode = '28000';
  end if;
  perform set_config('app.clerk_user_id', p_clerk_user_id, true);

  delete from public.lead_finder_leads
  where id = p_id and clerk_user_id = p_clerk_user_id;
  get diagnostics v_deleted = row_count;

  return v_deleted > 0;
end;
$$;

-- Grant execute to the server-side roles only. The anon/authenticated browser
-- roles intentionally receive nothing: the server route (service role) is the
-- only writer, and a browser that could call these with an arbitrary
-- clerk_user_id would bypass the session check in the route.
revoke all on function public.lead_finder_leads_list(text) from public, anon, authenticated;
revoke all on function public.lead_finder_leads_upsert(uuid, text, text, jsonb, text, text, boolean, text, text) from public, anon, authenticated;
revoke all on function public.lead_finder_leads_delete(uuid, text) from public, anon, authenticated;

-- CREATE FUNCTION grants EXECUTE to PUBLIC by default, and `service_role` is a
-- member of PUBLIC, so the revokes above would leave the server route unable
-- to call the RPCs on a fresh environment. Grant it back explicitly.
grant execute on function public.lead_finder_leads_list(text) to service_role;
grant execute on function public.lead_finder_leads_upsert(uuid, text, text, jsonb, text, text, boolean, text, text) to service_role;
grant execute on function public.lead_finder_leads_delete(uuid, text) to service_role;
