# Feature Registry

One page per feature, kept in the same PR that ships it. Copy `_TEMPLATE.md` into `docs/features/<area>/<feature>.md`,
fill it in, then run `node scripts/build-feature-index.mjs` to refresh this table.
Use `--check` in CI or before committing to catch bad status values and dead code paths.
`added` is the date of the first commit that added the page's main file (a guide, not a release date). `TBD` marks anything not yet verified.

<!-- generated: do not edit below this line -->

| Feature | Area | Status | Where in app | Added | Details |
|---|---|---|---|---|---|
| Design fixes from the template sweep (KPI figures, light logos, sparse brands) | personalization | live | Personalize this demo > Step 4 > Designs | 2026-11-23 | [page](personalization/design-fixes-and-kpi-figures.md) |
| Opening and closing scenes (Personalization Step 4) | personalization | live | Personalize a video > Step 4 (Preview and approve) > Opening and closing scenes | 2026-11-20 | [page](personalization/opening-and-closing-scenes.md) |
| Saved assets library | studio | live | Any image or video studio > Library / Saved button in the prompt bar | 2026-11-07 | [page](studio/saved-assets-library.md) |
| Social Publishing | studio | live | Studio result > Publish | TBD | [page](studio/social-publishing.md) |
