-- =====================================================================
-- APPLICATION: OpenHiggsBolt (a.k.a. "SmartVideo GO")
-- ---------------------------------------------------------------------
-- This migration belongs to the OpenHiggsBolt app. The `app_users` table is
-- SHARED across multiple applications, so these columns are explicitly
-- namespaced/labelled for OpenHiggsBolt to avoid confusion with other apps
-- that may also store provider keys on the same table.
--
-- Purpose: persist each OpenHiggsBolt user's OpenAI key against their account
-- so it survives sign-out / sign-in and follows them across browsers/devices.
-- The value is stored encrypted at rest (AES-256-GCM) by the app layer,
-- reusing the same scheme as muapi_key. `openai_key_updated_at` records when
-- the key was last set/cleared (audit trail), independently of `updated_at`
-- (which also changes on workspace edits).
--
-- Idempotent — can be safely re-applied.
-- =====================================================================

alter table app_users
  add column if not exists openai_key text;

alter table app_users
  add column if not exists openai_key_updated_at timestamptz;

-- Persistent schema labels so other applications sharing `app_users` can see
-- exactly which app owns these columns (and what they contain).
comment on column app_users.openai_key is
  'OpenHiggsBolt (SmartVideo GO): user-supplied OpenAI API key, encrypted at rest by the app layer (AES-256-GCM). Not used by other applications.';

comment on column app_users.openai_key_updated_at is
  'OpenHiggsBolt (SmartVideo GO): timestamp the OpenHiggsBolt openai_key was last set/cleared.';
