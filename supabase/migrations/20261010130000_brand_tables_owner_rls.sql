-- =====================================================================
-- 20261010130000_brand_tables_owner_rls.sql
--
-- H4 (Critical): brand cross-tenant exposure. All five brand_* tables are
-- owner-scoped by clerk_user_id and protected by owner-only RLS policies,
-- replacing the four out-of-band `is_workspace_member(workspace_id)` policies
-- per table that Postgres would otherwise OR with these.
--
-- ORDERING GUARD: the five brand_* tables are created out-of-band (dashboard /
-- psql), not by any migration in this repository, so this file has a hard
-- ordering dependency on databases where they exist. Without the guard the
-- column-add statements abort with
-- `relation "brand_dna" does not exist` on a fresh database -- which is what
-- made a Supabase branch replay of this repository's migration set fail.
-- When any of the five tables is absent this migration is a documented
-- no-op so the full set replays cleanly; when all five exist (production)
-- every statement below runs exactly as before.
--
-- IDEMPOTENT: every column-add, index-create and policy-create is guarded, and
-- every policy is dropped before it is created, so the file converges on any
-- re-application.
-- =====================================================================

do $$
begin
  if to_regclass('public.brand_dna') is null
     or to_regclass('public.brand_campaigns') is null
     or to_regclass('public.brand_assets') is null
     or to_regclass('public.brand_photoshoots') is null
     or to_regclass('public.brand_animations') is null then
    raise notice 'brand RLS migration: one or more brand_* tables do not exist yet; nothing to protect.';
    return;
  end if;

  -- 1. owner column
  execute $mig$alter table brand_dna add column if not exists clerk_user_id text;$mig$;
  execute $mig$comment on column brand_dna.clerk_user_id is 'Owning Clerk user id. NULL = pre-tenancy orphan row, service-role only.';$mig$;

  -- 1. owner column
  execute $mig$alter table brand_campaigns add column if not exists clerk_user_id text;$mig$;
  execute $mig$comment on column brand_campaigns.clerk_user_id is 'Owning Clerk user id. NULL = pre-tenancy orphan row, service-role only.';$mig$;

  -- 1. owner column
  execute $mig$alter table brand_assets add column if not exists clerk_user_id text;$mig$;
  execute $mig$comment on column brand_assets.clerk_user_id is 'Owning Clerk user id. NULL = pre-tenancy orphan row, service-role only.';$mig$;

  -- 1. owner column
  execute $mig$alter table brand_photoshoots add column if not exists clerk_user_id text;$mig$;
  execute $mig$comment on column brand_photoshoots.clerk_user_id is 'Owning Clerk user id. NULL = pre-tenancy orphan row, service-role only.';$mig$;

  -- 1. owner column
  execute $mig$alter table brand_animations add column if not exists clerk_user_id text;$mig$;
  execute $mig$comment on column brand_animations.clerk_user_id is 'Owning Clerk user id. NULL = pre-tenancy orphan row, service-role only.';$mig$;

  -- 2. owner indexes
  execute $mig$create index if not exists brand_dna_clerk_user_id_idx on brand_dna (clerk_user_id);$mig$;
  execute $mig$create index if not exists brand_campaigns_clerk_user_id_idx on brand_campaigns (clerk_user_id);$mig$;
  execute $mig$create index if not exists brand_assets_clerk_user_id_idx on brand_assets (clerk_user_id);$mig$;
  execute $mig$create index if not exists brand_photoshoots_clerk_user_id_idx on brand_photoshoots (clerk_user_id);$mig$;
  execute $mig$create index if not exists brand_animations_clerk_user_id_idx on brand_animations (clerk_user_id);$mig$;

  -- 3. owner-only RLS policies
  --    Drops the live `{table}_{select,insert,update,delete}` policies (all
  --    `is_workspace_member(workspace_id)`, created out-of-band) so they cannot
  --    OR with the new owner policies, plus the `public all {table}` and
  --    `{table}_owner_*` names so the file converges in either state.

  execute $mig$drop policy if exists "brand_dna_select" on brand_dna;$mig$;
  execute $mig$drop policy if exists "brand_dna_insert" on brand_dna;$mig$;
  execute $mig$drop policy if exists "brand_dna_update" on brand_dna;$mig$;
  execute $mig$drop policy if exists "brand_dna_delete" on brand_dna;$mig$;
  execute $mig$drop policy if exists "public all brand_dna" on brand_dna;$mig$;
  execute $mig$drop policy if exists "brand_dna_owner_select" on brand_dna;$mig$;
  execute $mig$drop policy if exists "brand_dna_owner_insert" on brand_dna;$mig$;
  execute $mig$drop policy if exists "brand_dna_owner_update" on brand_dna;$mig$;
  execute $mig$drop policy if exists "brand_dna_owner_delete" on brand_dna;$mig$;

  execute $mig$create policy "brand_dna_owner_select" on brand_dna for select using (clerk_user_id = current_setting('app.clerk_user_id', true));$mig$;
  execute $mig$create policy "brand_dna_owner_insert" on brand_dna for insert with check (clerk_user_id = current_setting('app.clerk_user_id', true));$mig$;
  execute $mig$create policy "brand_dna_owner_update" on brand_dna for update using (clerk_user_id = current_setting('app.clerk_user_id', true)) with check (clerk_user_id = current_setting('app.clerk_user_id', true));$mig$;
  execute $mig$create policy "brand_dna_owner_delete" on brand_dna for delete using (clerk_user_id = current_setting('app.clerk_user_id', true));$mig$;

  execute $mig$drop policy if exists "brand_campaigns_select" on brand_campaigns;$mig$;
  execute $mig$drop policy if exists "brand_campaigns_insert" on brand_campaigns;$mig$;
  execute $mig$drop policy if exists "brand_campaigns_update" on brand_campaigns;$mig$;
  execute $mig$drop policy if exists "brand_campaigns_delete" on brand_campaigns;$mig$;
  execute $mig$drop policy if exists "public all brand_campaigns" on brand_campaigns;$mig$;
  execute $mig$drop policy if exists "brand_campaigns_owner_select" on brand_campaigns;$mig$;
  execute $mig$drop policy if exists "brand_campaigns_owner_insert" on brand_campaigns;$mig$;
  execute $mig$drop policy if exists "brand_campaigns_owner_update" on brand_campaigns;$mig$;
  execute $mig$drop policy if exists "brand_campaigns_owner_delete" on brand_campaigns;$mig$;

  execute $mig$create policy "brand_campaigns_owner_select" on brand_campaigns for select using (clerk_user_id = current_setting('app.clerk_user_id', true));$mig$;
  execute $mig$create policy "brand_campaigns_owner_insert" on brand_campaigns for insert with check (clerk_user_id = current_setting('app.clerk_user_id', true));$mig$;
  execute $mig$create policy "brand_campaigns_owner_update" on brand_campaigns for update using (clerk_user_id = current_setting('app.clerk_user_id', true)) with check (clerk_user_id = current_setting('app.clerk_user_id', true));$mig$;
  execute $mig$create policy "brand_campaigns_owner_delete" on brand_campaigns for delete using (clerk_user_id = current_setting('app.clerk_user_id', true));$mig$;

  execute $mig$drop policy if exists "brand_assets_select" on brand_assets;$mig$;
  execute $mig$drop policy if exists "brand_assets_insert" on brand_assets;$mig$;
  execute $mig$drop policy if exists "brand_assets_update" on brand_assets;$mig$;
  execute $mig$drop policy if exists "brand_assets_delete" on brand_assets;$mig$;
  execute $mig$drop policy if exists "public all brand_assets" on brand_assets;$mig$;
  execute $mig$drop policy if exists "brand_assets_owner_select" on brand_assets;$mig$;
  execute $mig$drop policy if exists "brand_assets_owner_insert" on brand_assets;$mig$;
  execute $mig$drop policy if exists "brand_assets_owner_update" on brand_assets;$mig$;
  execute $mig$drop policy if exists "brand_assets_owner_delete" on brand_assets;$mig$;

  execute $mig$create policy "brand_assets_owner_select" on brand_assets for select using (clerk_user_id = current_setting('app.clerk_user_id', true));$mig$;
  execute $mig$create policy "brand_assets_owner_insert" on brand_assets for insert with check (clerk_user_id = current_setting('app.clerk_user_id', true));$mig$;
  execute $mig$create policy "brand_assets_owner_update" on brand_assets for update using (clerk_user_id = current_setting('app.clerk_user_id', true)) with check (clerk_user_id = current_setting('app.clerk_user_id', true));$mig$;
  execute $mig$create policy "brand_assets_owner_delete" on brand_assets for delete using (clerk_user_id = current_setting('app.clerk_user_id', true));$mig$;

  execute $mig$drop policy if exists "brand_photoshoots_select" on brand_photoshoots;$mig$;
  execute $mig$drop policy if exists "brand_photoshoots_insert" on brand_photoshoots;$mig$;
  execute $mig$drop policy if exists "brand_photoshoots_update" on brand_photoshoots;$mig$;
  execute $mig$drop policy if exists "brand_photoshoots_delete" on brand_photoshoots;$mig$;
  execute $mig$drop policy if exists "public all brand_photoshoots" on brand_photoshoots;$mig$;
  execute $mig$drop policy if exists "brand_photoshoots_owner_select" on brand_photoshoots;$mig$;
  execute $mig$drop policy if exists "brand_photoshoots_owner_insert" on brand_photoshoots;$mig$;
  execute $mig$drop policy if exists "brand_photoshoots_owner_update" on brand_photoshoots;$mig$;
  execute $mig$drop policy if exists "brand_photoshoots_owner_delete" on brand_photoshoots;$mig$;

  execute $mig$create policy "brand_photoshoots_owner_select" on brand_photoshoots for select using (clerk_user_id = current_setting('app.clerk_user_id', true));$mig$;
  execute $mig$create policy "brand_photoshoots_owner_insert" on brand_photoshoots for insert with check (clerk_user_id = current_setting('app.clerk_user_id', true));$mig$;
  execute $mig$create policy "brand_photoshoots_owner_update" on brand_photoshoots for update using (clerk_user_id = current_setting('app.clerk_user_id', true)) with check (clerk_user_id = current_setting('app.clerk_user_id', true));$mig$;
  execute $mig$create policy "brand_photoshoots_owner_delete" on brand_photoshoots for delete using (clerk_user_id = current_setting('app.clerk_user_id', true));$mig$;

  execute $mig$drop policy if exists "brand_animations_select" on brand_animations;$mig$;
  execute $mig$drop policy if exists "brand_animations_insert" on brand_animations;$mig$;
  execute $mig$drop policy if exists "brand_animations_update" on brand_animations;$mig$;
  execute $mig$drop policy if exists "brand_animations_delete" on brand_animations;$mig$;
  execute $mig$drop policy if exists "public all brand_animations" on brand_animations;$mig$;
  execute $mig$drop policy if exists "brand_animations_owner_select" on brand_animations;$mig$;
  execute $mig$drop policy if exists "brand_animations_owner_insert" on brand_animations;$mig$;
  execute $mig$drop policy if exists "brand_animations_owner_update" on brand_animations;$mig$;
  execute $mig$drop policy if exists "brand_animations_owner_delete" on brand_animations;$mig$;

  execute $mig$create policy "brand_animations_owner_select" on brand_animations for select using (clerk_user_id = current_setting('app.clerk_user_id', true));$mig$;
  execute $mig$create policy "brand_animations_owner_insert" on brand_animations for insert with check (clerk_user_id = current_setting('app.clerk_user_id', true));$mig$;
  execute $mig$create policy "brand_animations_owner_update" on brand_animations for update using (clerk_user_id = current_setting('app.clerk_user_id', true)) with check (clerk_user_id = current_setting('app.clerk_user_id', true));$mig$;
  execute $mig$create policy "brand_animations_owner_delete" on brand_animations for delete using (clerk_user_id = current_setting('app.clerk_user_id', true));$mig$;

  -- 4. re-assert the RLS flag
  execute $mig$alter table brand_dna enable row level security;$mig$;
  execute $mig$alter table brand_campaigns enable row level security;$mig$;
  execute $mig$alter table brand_assets enable row level security;$mig$;
  execute $mig$alter table brand_photoshoots enable row level security;$mig$;
  execute $mig$alter table brand_animations enable row level security;$mig$;

end $$;