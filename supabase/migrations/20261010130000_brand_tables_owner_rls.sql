-- =====================================================================
-- Brand Studio owner-scoped RLS (closes CRITICAL C1)
--
-- VERIFIED LIVE STATE BEFORE THIS MIGRATION (2026-10-12, project
-- bzxohkrxcwodllketcpz, Postgres 17.6.1.084): all five brand_* tables
-- existed with RLS already enabled and exactly four policies each —
-- `brand_dna_select`/`brand_dna_insert`/`brand_dna_update`/
-- `brand_dna_delete` (and the same four names per sibling table) — every
-- one defined as `is_workspace_member(workspace_id)`. Those policies were
-- created OUT-OF-BAND (Supabase dashboard / psql); they are NOT from any
-- migration in this repo. In particular the `public all {table}`
-- (`for all using (true) with check (true)`) policies that
-- 20260620121513_create_brand_tables.sql:87-91 creates are NOT live: they
-- were evidently replaced by the out-of-band workspace policies above.
--
-- WHY THE DROP LIST TARGETS THOSE NAMES: Postgres ORs per-command
-- permissive policies together. Dropping only the `public all {table}`
-- names (which no longer exist) would leave the 20 out-of-band
-- `{table}_{select,insert,update,delete}` policies in place, OR'd
-- alongside the new `*_owner_*` policies below — so a workspace member
-- would STILL see every row of the workspace and the owner scoping would
-- never take effect. Each table therefore also drops its four live
-- legacy policies by their exact verified names.
--
-- The four legacy policies per table are superseded by the per-user
-- (`clerk_user_id`) ownership model that the Netlify functions
-- (netlify/functions/*) and the Next.js brand routes actually enforce:
-- `is_workspace_member(workspace_id)` grants every member of a workspace
-- access to every workspace row, which is not the ownership boundary the
-- application implements.
--
-- AFTER: every brand_* row carries the owning Clerk user id and RLS only
--   exposes rows where `clerk_user_id` matches the request's
--   `app.clerk_user_id` setting (the same idiom used by
--   20260903000001_create_photo_studio_records.sql and
--   20260903000002_create_design_agent_ownership.sql, and by
--   src/lib/supabaseServer.ts:19-39 which sets it per request).
--
-- DESIGN DECISION — BACKFILL (option (a): leave legacy rows NULL).
--   None of these tables had an owner column, so there is no legitimate
--   owner source for rows that already exist: the creating session/caller
--   identity was never recorded. (Verified row counts when this migration
--   was written: brand_dna 2 — one of them with NULL workspace_id —,
--   brand_campaigns 1, brand_assets 0, brand_photoshoots 0,
--   brand_animations 0.) We therefore DO NOT invent an owner
--   (no shared 'admin'/'system' user, no copying from app_users).
--   Pre-existing rows keep `clerk_user_id IS NULL` and become invisible to
--   every anon/authenticated client: NULL never equals
--   current_setting('app.clerk_user_id', true), so the owner-scoped
--   `using` predicate rejects them. They remain reachable only through the
--   service-role key (SUPABASE_SERVICE_ROLE_KEY), which bypasses RLS and
--   is used exclusively server-side. This is intentional and safe: it is
--   fail-closed, it cannot leak cross-tenant data, and it preserves the
--   rows so an operator can attribute them later with real evidence.
--   A one-time, evidence-based attribution script can be added separately
--   if such evidence is ever found; it must stay idempotent
--   (`where clerk_user_id is null`).
--
-- IDEMPOTENT: `add column if not exists`, `create index if not exists` and
--   `drop policy if exists` before each `create policy` make this file safe
--   to re-apply.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Owner column (nullable so the migration cannot fail on existing rows)
-- ---------------------------------------------------------------------
alter table brand_dna         add column if not exists clerk_user_id text;
alter table brand_campaigns   add column if not exists clerk_user_id text;
alter table brand_assets      add column if not exists clerk_user_id text;
alter table brand_photoshoots add column if not exists clerk_user_id text;
alter table brand_animations  add column if not exists clerk_user_id text;

comment on column brand_dna.clerk_user_id is
  'Owning Clerk user id. NULL = pre-tenancy orphan row, service-role only.';
comment on column brand_campaigns.clerk_user_id is
  'Owning Clerk user id. NULL = pre-tenancy orphan row, service-role only.';
comment on column brand_assets.clerk_user_id is
  'Owning Clerk user id. NULL = pre-tenancy orphan row, service-role only.';
comment on column brand_photoshoots.clerk_user_id is
  'Owning Clerk user id. NULL = pre-tenancy orphan row, service-role only.';
comment on column brand_animations.clerk_user_id is
  'Owning Clerk user id. NULL = pre-tenancy orphan row, service-role only.';

-- ---------------------------------------------------------------------
-- 2. Owner indexes (match the `<table>_clerk_user_id_idx` naming used by
--    photo_studio_records / design_agent_ownership)
-- ---------------------------------------------------------------------
create index if not exists brand_dna_clerk_user_id_idx
  on brand_dna(clerk_user_id);
create index if not exists brand_campaigns_clerk_user_id_idx
  on brand_campaigns(clerk_user_id);
create index if not exists brand_assets_clerk_user_id_idx
  on brand_assets(clerk_user_id);
create index if not exists brand_photoshoots_clerk_user_id_idx
  on brand_photoshoots(clerk_user_id);
create index if not exists brand_animations_clerk_user_id_idx
  on brand_animations(clerk_user_id);

-- ---------------------------------------------------------------------
-- 3. Replace the LIVE owner policies. Per table the live set is exactly
--    `{table}_select` / `{table}_insert` / `{table}_update` /
--    `{table}_delete` (all `is_workspace_member(workspace_id)`, created
--    out-of-band — see the header). They are dropped here under those
--    exact names so they cannot OR with the new owner policies; the
--    `public all {table}` and `{table}_owner_*` drops are kept so the
--    file converges and stays re-runnable on a database in either state.
--
--    Reads and the `using` side of writes compare against
--    current_setting('app.clerk_user_id', true): when the setting is unset
--    (anon key, or a client that never called set_config) the expression
--    evaluates to NULL and no row passes — fail-closed by default.
--    The service-role key bypasses RLS entirely, so server-side code must
--    still filter on clerk_user_id explicitly (see netlify/functions/*).
-- ---------------------------------------------------------------------

-- brand_dna ------------------------------------------------------------
drop policy if exists "public all brand_dna" on brand_dna;
drop policy if exists "brand_dna_select" on brand_dna;
drop policy if exists "brand_dna_insert" on brand_dna;
drop policy if exists "brand_dna_update" on brand_dna;
drop policy if exists "brand_dna_delete" on brand_dna;
drop policy if exists "brand_dna_owner_select" on brand_dna;
drop policy if exists "brand_dna_owner_insert" on brand_dna;
drop policy if exists "brand_dna_owner_update" on brand_dna;
drop policy if exists "brand_dna_owner_delete" on brand_dna;

create policy "brand_dna_owner_select" on brand_dna
  for select
  using (clerk_user_id = current_setting('app.clerk_user_id', true));

create policy "brand_dna_owner_insert" on brand_dna
  for insert
  with check (clerk_user_id = current_setting('app.clerk_user_id', true));

create policy "brand_dna_owner_update" on brand_dna
  for update
  using (clerk_user_id = current_setting('app.clerk_user_id', true))
  with check (clerk_user_id = current_setting('app.clerk_user_id', true));

create policy "brand_dna_owner_delete" on brand_dna
  for delete
  using (clerk_user_id = current_setting('app.clerk_user_id', true));

-- brand_campaigns -------------------------------------------------------
drop policy if exists "public all brand_campaigns" on brand_campaigns;
drop policy if exists "brand_campaigns_select" on brand_campaigns;
drop policy if exists "brand_campaigns_insert" on brand_campaigns;
drop policy if exists "brand_campaigns_update" on brand_campaigns;
drop policy if exists "brand_campaigns_delete" on brand_campaigns;
drop policy if exists "brand_campaigns_owner_select" on brand_campaigns;
drop policy if exists "brand_campaigns_owner_insert" on brand_campaigns;
drop policy if exists "brand_campaigns_owner_update" on brand_campaigns;
drop policy if exists "brand_campaigns_owner_delete" on brand_campaigns;

create policy "brand_campaigns_owner_select" on brand_campaigns
  for select
  using (clerk_user_id = current_setting('app.clerk_user_id', true));

create policy "brand_campaigns_owner_insert" on brand_campaigns
  for insert
  with check (clerk_user_id = current_setting('app.clerk_user_id', true));

create policy "brand_campaigns_owner_update" on brand_campaigns
  for update
  using (clerk_user_id = current_setting('app.clerk_user_id', true))
  with check (clerk_user_id = current_setting('app.clerk_user_id', true));

create policy "brand_campaigns_owner_delete" on brand_campaigns
  for delete
  using (clerk_user_id = current_setting('app.clerk_user_id', true));

-- brand_assets ----------------------------------------------------------
drop policy if exists "public all brand_assets" on brand_assets;
drop policy if exists "brand_assets_select" on brand_assets;
drop policy if exists "brand_assets_insert" on brand_assets;
drop policy if exists "brand_assets_update" on brand_assets;
drop policy if exists "brand_assets_delete" on brand_assets;
drop policy if exists "brand_assets_owner_select" on brand_assets;
drop policy if exists "brand_assets_owner_insert" on brand_assets;
drop policy if exists "brand_assets_owner_update" on brand_assets;
drop policy if exists "brand_assets_owner_delete" on brand_assets;

create policy "brand_assets_owner_select" on brand_assets
  for select
  using (clerk_user_id = current_setting('app.clerk_user_id', true));

create policy "brand_assets_owner_insert" on brand_assets
  for insert
  with check (clerk_user_id = current_setting('app.clerk_user_id', true));

create policy "brand_assets_owner_update" on brand_assets
  for update
  using (clerk_user_id = current_setting('app.clerk_user_id', true))
  with check (clerk_user_id = current_setting('app.clerk_user_id', true));

create policy "brand_assets_owner_delete" on brand_assets
  for delete
  using (clerk_user_id = current_setting('app.clerk_user_id', true));

-- brand_photoshoots -----------------------------------------------------
drop policy if exists "public all brand_photoshoots" on brand_photoshoots;
drop policy if exists "brand_photoshoots_select" on brand_photoshoots;
drop policy if exists "brand_photoshoots_insert" on brand_photoshoots;
drop policy if exists "brand_photoshoots_update" on brand_photoshoots;
drop policy if exists "brand_photoshoots_delete" on brand_photoshoots;
drop policy if exists "brand_photoshoots_owner_select" on brand_photoshoots;
drop policy if exists "brand_photoshoots_owner_insert" on brand_photoshoots;
drop policy if exists "brand_photoshoots_owner_update" on brand_photoshoots;
drop policy if exists "brand_photoshoots_owner_delete" on brand_photoshoots;

create policy "brand_photoshoots_owner_select" on brand_photoshoots
  for select
  using (clerk_user_id = current_setting('app.clerk_user_id', true));

create policy "brand_photoshoots_owner_insert" on brand_photoshoots
  for insert
  with check (clerk_user_id = current_setting('app.clerk_user_id', true));

create policy "brand_photoshoots_owner_update" on brand_photoshoots
  for update
  using (clerk_user_id = current_setting('app.clerk_user_id', true))
  with check (clerk_user_id = current_setting('app.clerk_user_id', true));

create policy "brand_photoshoots_owner_delete" on brand_photoshoots
  for delete
  using (clerk_user_id = current_setting('app.clerk_user_id', true));

-- brand_animations ------------------------------------------------------
drop policy if exists "public all brand_animations" on brand_animations;
drop policy if exists "brand_animations_select" on brand_animations;
drop policy if exists "brand_animations_insert" on brand_animations;
drop policy if exists "brand_animations_update" on brand_animations;
drop policy if exists "brand_animations_delete" on brand_animations;
drop policy if exists "brand_animations_owner_select" on brand_animations;
drop policy if exists "brand_animations_owner_insert" on brand_animations;
drop policy if exists "brand_animations_owner_update" on brand_animations;
drop policy if exists "brand_animations_owner_delete" on brand_animations;

create policy "brand_animations_owner_select" on brand_animations
  for select
  using (clerk_user_id = current_setting('app.clerk_user_id', true));

create policy "brand_animations_owner_insert" on brand_animations
  for insert
  with check (clerk_user_id = current_setting('app.clerk_user_id', true));

create policy "brand_animations_owner_update" on brand_animations
  for update
  using (clerk_user_id = current_setting('app.clerk_user_id', true))
  with check (clerk_user_id = current_setting('app.clerk_user_id', true));

create policy "brand_animations_owner_delete" on brand_animations
  for delete
  using (clerk_user_id = current_setting('app.clerk_user_id', true));

-- ---------------------------------------------------------------------
-- 4. Belt and braces: the RLS flag is already set by
--    20260620121513_create_brand_tables.sql, but re-assert it so the
--    guarantee holds on any database where it was somehow disabled.
-- ---------------------------------------------------------------------
alter table brand_dna         enable row level security;
alter table brand_campaigns   enable row level security;
alter table brand_assets      enable row level security;
alter table brand_photoshoots enable row level security;
alter table brand_animations  enable row level security;
