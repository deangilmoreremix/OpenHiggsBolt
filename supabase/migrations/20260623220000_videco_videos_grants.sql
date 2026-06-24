-- Grant base table privileges required for RLS policies to take effect.
-- Without these, anon/authenticated requests get 401/permission denied.

grant select on videco_videos to anon, authenticated;
grant insert, update, delete on videco_videos to authenticated;

-- Allow authenticated role to use the sequence for generated primary keys.
grant usage, select on all sequences in schema public to authenticated;
