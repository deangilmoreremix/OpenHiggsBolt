-- Rollback: remove the persisted MuAPI key + audit columns.
alter table app_users
  drop column if exists key_updated_at;

alter table app_users
  drop column if exists muapi_key;
