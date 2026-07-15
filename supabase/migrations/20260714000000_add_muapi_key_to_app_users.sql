-- =====================================================================
-- Persist each user's MuAPI key against their account so it survives
-- sign-out / sign-in and follows them across browsers and devices.
-- The value is stored encrypted at rest (AES-256-GCM) by the app layer.
-- `key_updated_at` records when the key was last set/cleared (audit trail),
-- independently of `updated_at` (which also changes on workspace edits).
-- Idempotent — can be safely re-applied.
-- =====================================================================

alter table app_users
  add column if not exists muapi_key text;

alter table app_users
  add column if not exists key_updated_at timestamptz;
