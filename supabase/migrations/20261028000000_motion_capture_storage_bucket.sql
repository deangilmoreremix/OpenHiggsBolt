-- Motion Director page capture stores its screenshots and background-job records here.
-- The code used to point at a bucket that does not exist in this project ("Bucket not found"), so no capture
-- could ever be saved. Public: the pictures are referenced by URL from the film; paths contain the user id and a random id.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('motion-capture', 'motion-capture', true, 20971520, array['image/jpeg','image/png','application/json'])
on conflict (id) do nothing;
