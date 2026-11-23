# Agent notes

## Feature Registry

When you add or change a user-facing feature, add or update its page in `docs/features/<area>/` (copy `docs/features/_TEMPLATE.md`), then run `node scripts/build-feature-index.mjs`. Each page records what the feature does, where it lives in the app, and its key code paths.
