-- Rollback for 20250619142400_secure_thumbnail_delete.sql
-- Restores the original permissive delete/insert policies and removes
-- the session_id index. Use only if you need to revert the security fix.

drop policy if exists "Users can delete own thumbnails by session_id" on thumbnails;
drop policy if exists "Anonymous users can insert thumbnails with session_id" on thumbnails;

create policy "Anyone can delete own thumbnail by id" on thumbnails
  for delete using (true);

create policy "Anyone can insert thumbnails" on thumbnails
  for insert with check (true);

drop index if exists thumbnails_session_id_idx;
