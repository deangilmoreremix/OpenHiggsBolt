-- Brand Studio storage bucket RLS policies
-- Note: current upload paths do not embed workspace_id in the object name,
-- so these policies keep the existing public access for brand-assets and
-- brand-photoshoots. Backend uploads go through service role and bypass RLS;
-- table-level RLS on brand_dna/brand_campaigns/brand_assets/brand_photoshoots
-- provides the actual cross-tenant data isolation.

drop policy if exists "public read brand-assets" on storage.objects;
drop policy if exists "public write brand-assets" on storage.objects;
drop policy if exists "public update brand-assets" on storage.objects;

create policy "public read brand-assets"
  on storage.objects for select
  using (bucket_id in ('brand-assets', 'brand-photoshoots'));

create policy "public write brand-assets"
  on storage.objects for insert
  with check (bucket_id in ('brand-assets', 'brand-photoshoots'));

create policy "public update brand-assets"
  on storage.objects for update
  using (bucket_id in ('brand-assets', 'brand-photoshoots'))
  with check (bucket_id in ('brand-assets', 'brand-photoshoots'));
