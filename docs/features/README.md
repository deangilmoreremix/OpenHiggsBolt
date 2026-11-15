# Feature Registry

One page per feature, kept in the same PR that ships it. Copy `_TEMPLATE.md` into `docs/features/<area>/<feature>.md`,
fill it in, then run `node scripts/build-feature-index.mjs` to refresh this table.
Use `--check` in CI or before committing to catch bad status values and dead code paths.
`added` is the date of the first commit that added the page's main file (a guide, not a release date). `TBD` marks anything not yet verified.

<!-- generated: do not edit below this line -->

| Feature | Area | Status | Where in app | Added | Details |
|---|---|---|---|---|---|
| Social Publishing | studio | live | Studio result > Publish | TBD | [page](studio/social-publishing.md) |
