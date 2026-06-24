-- videco_videos RLS for public client-side reads (anon key)
-- Inserts/updates/deletes remain blocked for anon; only authenticated users can DML.

alter table if exists videco_videos
  enable row level security;

create policy "allow_anon_select_videco_videos"
  on videco_videos
  for select
  to anon
  using (true);

create policy "allow_authenticated_insert_videco_videos"
  on videco_videos
  for insert
  to authenticated
  with check (true);

create policy "allow_authenticated_update_videco_videos"
  on videco_videos
  for update
  to authenticated
  using (true)
  with check (true);

create policy "allow_authenticated_delete_videco_videos"
  on videco_videos
  for delete
  to authenticated
  using (true);
