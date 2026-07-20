-- =====================================================================
-- Persist each user's OpenAI key against their account so it survives
-- sign-out / sign-in and follows them across browsers and devices.
-- The value is stored encrypted at rest (AES-256-GCM) by the app layer,
-- reusing the same scheme as muapi_key. `openai_key_updated_at` records
-- when the key was last set/cleared (audit trail), independently of
-- `updated_at` (which also changes on workspace edits).
-- Idempotent — can be safely re-applied.
-- =====================================================================

alter table app_users
  add column if not exists openai_key text;

alter table app_users
  add column if not exists openai_key_updated_at timestamptz;
