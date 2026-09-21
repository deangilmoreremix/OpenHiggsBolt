-- Brand Studio tables RLS policies
-- Scoped to workspace membership via is_workspace_member(workspace_id)

-- brand_dna
alter table brand_dna enable row level security;

drop policy if exists "brand_dna_select" on brand_dna;
drop policy if exists "brand_dna_insert" on brand_dna;
drop policy if exists "brand_dna_update" on brand_dna;
drop policy if exists "brand_dna_delete" on brand_dna;

create policy "brand_dna_select" on brand_dna
  for select to authenticated
  using (is_workspace_member(workspace_id));

create policy "brand_dna_insert" on brand_dna
  for insert to authenticated
  with check (is_workspace_member(workspace_id));

create policy "brand_dna_update" on brand_dna
  for update to authenticated
  using (is_workspace_member(workspace_id))
  with check (is_workspace_member(workspace_id));

create policy "brand_dna_delete" on brand_dna
  for delete to authenticated
  using (is_workspace_member(workspace_id));

-- brand_campaigns
alter table brand_campaigns enable row level security;

drop policy if exists "brand_campaigns_select" on brand_campaigns;
drop policy if exists "brand_campaigns_insert" on brand_campaigns;
drop policy if exists "brand_campaigns_update" on brand_campaigns;
drop policy if exists "brand_campaigns_delete" on brand_campaigns;

create policy "brand_campaigns_select" on brand_campaigns
  for select to authenticated
  using (is_workspace_member(workspace_id));

create policy "brand_campaigns_insert" on brand_campaigns
  for insert to authenticated
  with check (is_workspace_member(workspace_id));

create policy "brand_campaigns_update" on brand_campaigns
  for update to authenticated
  using (is_workspace_member(workspace_id))
  with check (is_workspace_member(workspace_id));

create policy "brand_campaigns_delete" on brand_campaigns
  for delete to authenticated
  using (is_workspace_member(workspace_id));

-- brand_assets
alter table brand_assets enable row level security;

drop policy if exists "brand_assets_select" on brand_assets;
drop policy if exists "brand_assets_insert" on brand_assets;
drop policy if exists "brand_assets_update" on brand_assets;
drop policy if exists "brand_assets_delete" on brand_assets;

create policy "brand_assets_select" on brand_assets
  for select to authenticated
  using (is_workspace_member(workspace_id));

create policy "brand_assets_insert" on brand_assets
  for insert to authenticated
  with check (is_workspace_member(workspace_id));

create policy "brand_assets_update" on brand_assets
  for update to authenticated
  using (is_workspace_member(workspace_id))
  with check (is_workspace_member(workspace_id));

create policy "brand_assets_delete" on brand_assets
  for delete to authenticated
  using (is_workspace_member(workspace_id));

-- brand_photoshoots
alter table brand_photoshoots enable row level security;

drop policy if exists "brand_photoshoots_select" on brand_photoshoots;
drop policy if exists "brand_photoshoots_insert" on brand_photoshoots;
drop policy if exists "brand_photoshoots_update" on brand_photoshoots;
drop policy if exists "brand_photoshoots_delete" on brand_photoshoots;

create policy "brand_photoshoots_select" on brand_photoshoots
  for select to authenticated
  using (is_workspace_member(workspace_id));

create policy "brand_photoshoots_insert" on brand_photoshoots
  for insert to authenticated
  with check (is_workspace_member(workspace_id));

create policy "brand_photoshoots_update" on brand_photoshoots
  for update to authenticated
  using (is_workspace_member(workspace_id))
  with check (is_workspace_member(workspace_id));

create policy "brand_photoshoots_delete" on brand_photoshoots
  for delete to authenticated
  using (is_workspace_member(workspace_id));

-- brand_animations
alter table brand_animations enable row level security;

drop policy if exists "brand_animations_select" on brand_animations;
drop policy if exists "brand_animations_insert" on brand_animations;
drop policy if exists "brand_animations_update" on brand_animations;
drop policy if exists "brand_animations_delete" on brand_animations;

create policy "brand_animations_select" on brand_animations
  for select to authenticated
  using (is_workspace_member(workspace_id));

create policy "brand_animations_insert" on brand_animations
  for insert to authenticated
  with check (is_workspace_member(workspace_id));

create policy "brand_animations_update" on brand_animations
  for update to authenticated
  using (is_workspace_member(workspace_id))
  with check (is_workspace_member(workspace_id));

create policy "brand_animations_delete" on brand_animations
  for delete to authenticated
  using (is_workspace_member(workspace_id));
