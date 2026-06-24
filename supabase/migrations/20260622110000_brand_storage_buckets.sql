-- Brand Studio storage bucket
-- Stores generated images (og:image mirrors, DALL-E 3 assets, product photos)

insert into storage.buckets (id, name, public)
values ('brand-assets', 'brand-assets', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('brand-photoshoots', 'brand-photoshoots', true)
on conflict (id) do nothing;

-- Public read access for all files in these buckets
drop policy if exists "public read brand-assets" on storage.objects;
create policy "public read brand-assets"
  on storage.objects for select
  using (bucket_id in ('brand-assets', 'brand-photoshoots'));

-- Public write access (for service role / edge functions with anon uploads)
drop policy if exists "public write brand-assets" on storage.objects;
create policy "public write brand-assets"
  on storage.objects for insert
  with check (bucket_id in ('brand-assets', 'brand-photoshoots'));

drop policy if exists "public update brand-assets" on storage.objects;
create policy "public update brand-assets"
  on storage.objects for update
  using (bucket_id in ('brand-assets', 'brand-photoshoots'))
  with check (bucket_id in ('brand-assets', 'brand-photoshoots'));
