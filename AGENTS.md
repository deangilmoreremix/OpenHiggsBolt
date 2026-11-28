# Agent notes

## Feature Registry

When you add or change a user-facing feature, add or update its page in `docs/features/<area>/` (copy `docs/features/_TEMPLATE.md`), then run `node scripts/build-feature-index.mjs`. Each page records what the feature does, where it lives in the app, and its key code paths.

## Keep the README in step (studios, pages, apps and features)

The studio list, the feature registry table, the page-route table and the bundled-apps table in `README.md` must always match what the app ships. In the same change that adds, renames or removes any of them:

- **Studio**: add or update its entry in `src/data/studioKnowledgeBase.json` (and its tab in `components/StandaloneShell.js`).
- **Feature**: add its `docs/features/` page (above).
- **Page route** (a new folder under `app/`) or **app** (a new folder under `apps/`): add a row to "Beyond the Studio Shell" in `README.md`.
- Then run `node scripts/build-feature-index.mjs && npm run docs:readme`. That rewrites the generated blocks of `README.md`.

`npm run check:readme` (also run by `npm run lint`) fails if any of this is missing. Run it before opening a pull request.
