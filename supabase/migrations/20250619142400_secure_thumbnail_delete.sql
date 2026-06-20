-- Migration: secure thumbnail delete by session_id
-- Replaces the permissive "FOR DELETE USING (true)" policy with a
-- session-based check. The client must send the browser's session_id
-- in the 'x-session-id' request header when calling delete.

-- Drop the old permissive delete policy.
drop policy if exists "Anyone can delete own thumbnail by id" on thumbnails;

-- Delete only rows whose session_id matches the request header.
create policy "Users can delete own thumbnails by session_id" on thumbnails
  for delete
  using (
    session_id is not null
    and session_id = current_setting('request.headers', true)::json->>'x-session-id'
  );

-- Tighten insert so every row has an owning session_id.
drop policy if exists "Anyone can insert thumbnails" on thumbnails;

create policy "Anonymous users can insert thumbnails with session_id" on thumbnails
  for insert
  with check (session_id is not null);

-- Index to keep session-based lookups fast.
create index if not exists thumbnails_session_id_idx on thumbnails(session_id);
