-- =====================================================================
-- Persist each user's MuAPI key against their account so it survives
-- sign-out / sign-in and follows them across browsers and devices.
-- The value is stored encrypted at rest (AES-256-GCM) by the app layer.
-- Idempotent — can be safely re-applied.
-- =====================================================================

alter table app_users
  add column if not exists muapi_key text;
