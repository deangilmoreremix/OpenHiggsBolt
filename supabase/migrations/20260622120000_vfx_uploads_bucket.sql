-- VFX uploads storage bucket
-- Stores user-uploaded images for VFX generation workflows

insert into storage.buckets (id, name, public)
values ('vfx-uploads', 'vfx-uploads', true)
on conflict (id) do nothing;

-- Public read access
drop policy if exists "public read vfx-uploads" on storage.objects;
create policy "public read vfx-uploads"
  on storage.objects for select
  using (bucket_id = 'vfx-uploads');

-- Public write access (for service role / edge functions / anon uploads)
drop policy if exists "public write vfx-uploads" on storage.objects;
create policy "public write vfx-uploads"
  on storage.objects for insert
  with check (bucket_id = 'vfx-uploads');

drop policy if exists "public update vfx-uploads" on storage.objects;
create policy "public update vfx-uploads"
  on storage.objects for update
  using (bucket_id = 'vfx-uploads')
  with check (bucket_id = 'vfx-uploads');
