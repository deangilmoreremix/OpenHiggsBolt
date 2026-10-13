-- 20260929000001_voice_storage_buckets
--
-- RECOVERED RECONSTRUCTION of an already-applied production migration.
--
-- This migration was applied to the production database (Supabase project
-- bzxohkrxcwodllketcpz, "VideoRemix Product"; recorded in
-- supabase_migrations.schema_migrations as version 20260929000001) but was
-- never committed to source control, so production could not be reproduced
-- from the repo. The definition below is reconstructed from the LIVE schema
-- (the source of truth), introspected on 2026-10-12 through the Supabase
-- Management API (storage.buckets rows and the storage.objects policies in
-- pg_policies). The nine buckets were created 2026-09-30 12:34:01 UTC, which
-- matches this migration's position in the applied history.
--
-- DO NOT treat this as a new change: re-running it against the live database
-- is intended to be a no-op. The bucket inserts use `on conflict (id) do
-- nothing`, and every policy is dropped with `if exists` before being
-- recreated, so existing buckets are never modified and policies are
-- recreated with byte-identical definitions.
--
-- Recreated objects: nine PRIVATE storage buckets (public = false, no
-- file_size_limit, no allowed_mime_types restriction, owner null):
--   voice-reference-audio, voice-uploads, voice-generated-speech,
--   voice-transcripts, voice-dubbing-source, voice-dubbing-exports,
--   voice-audiobook-outputs, voice-covers, voice-intermediate-assets
-- plus four owner-scoped policies on storage.objects
-- (voice_storage_user_select/insert/update/delete) that match files whose
-- first path segment is the caller's auth.uid().

insert into storage.buckets (id, name, public)
values ('voice-reference-audio', 'voice-reference-audio', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('voice-uploads', 'voice-uploads', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('voice-generated-speech', 'voice-generated-speech', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('voice-transcripts', 'voice-transcripts', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('voice-dubbing-source', 'voice-dubbing-source', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('voice-dubbing-exports', 'voice-dubbing-exports', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('voice-audiobook-outputs', 'voice-audiobook-outputs', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('voice-covers', 'voice-covers', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('voice-intermediate-assets', 'voice-intermediate-assets', false)
on conflict (id) do nothing;

drop policy if exists "voice_storage_user_select" on storage.objects;

create policy "voice_storage_user_select"
  on storage.objects
  for select
  using (
    bucket_id = any (array[
      'voice-reference-audio',
      'voice-uploads',
      'voice-generated-speech',
      'voice-transcripts',
      'voice-dubbing-source',
      'voice-dubbing-exports',
      'voice-audiobook-outputs',
      'voice-covers',
      'voice-intermediate-assets'
    ])
    and (auth.uid())::text = (storage.foldername(name))[1]
  );

drop policy if exists "voice_storage_user_insert" on storage.objects;

create policy "voice_storage_user_insert"
  on storage.objects
  for insert
  with check (
    bucket_id = any (array[
      'voice-reference-audio',
      'voice-uploads',
      'voice-generated-speech',
      'voice-transcripts',
      'voice-dubbing-source',
      'voice-dubbing-exports',
      'voice-audiobook-outputs',
      'voice-covers',
      'voice-intermediate-assets'
    ])
    and (auth.uid())::text = (storage.foldername(name))[1]
  );

drop policy if exists "voice_storage_user_update" on storage.objects;

create policy "voice_storage_user_update"
  on storage.objects
  for update
  using (
    bucket_id = any (array[
      'voice-reference-audio',
      'voice-uploads',
      'voice-generated-speech',
      'voice-transcripts',
      'voice-dubbing-source',
      'voice-dubbing-exports',
      'voice-audiobook-outputs',
      'voice-covers',
      'voice-intermediate-assets'
    ])
    and (auth.uid())::text = (storage.foldername(name))[1]
  );

drop policy if exists "voice_storage_user_delete" on storage.objects;

create policy "voice_storage_user_delete"
  on storage.objects
  for delete
  using (
    bucket_id = any (array[
      'voice-reference-audio',
      'voice-uploads',
      'voice-generated-speech',
      'voice-transcripts',
      'voice-dubbing-source',
      'voice-dubbing-exports',
      'voice-audiobook-outputs',
      'voice-covers',
      'voice-intermediate-assets'
    ])
    and (auth.uid())::text = (storage.foldername(name))[1]
  );
