-- Reseller app source bundles storage bucket (PRIVATE)
--
-- Stores the 38 Apps Studio reseller source bundles + setup docs.
-- Buckets must NEVER be public: downloads are minted exclusively as
-- short-lived signed URLs by the service role in
-- app/api/reseller/download/route.ts (src/lib/resellerStorage.ts),
-- after a per-caller entitlement check (apps_studio_diy /
-- apps_studio_training). No public read policy is created here.

insert into storage.buckets (id, name, public)
values ('reseller-app-bundles', 'reseller-app-bundles', false)
on conflict (id) do nothing;

-- Defense in depth: the bucket stays private even if someone flips
-- `public` in the dashboard, by denying anon/authenticated reads on
-- storage.objects. The service role (used server-side only) bypasses
-- these policies and is the only path that can create signed URLs.
drop policy if exists "deny public read reseller bundles" on storage.objects;
create policy "deny public read reseller bundles"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id <> 'reseller-app-bundles');
