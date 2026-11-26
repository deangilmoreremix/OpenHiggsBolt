# Feature Registry

One page per feature, kept in the same PR that ships it. Copy `_TEMPLATE.md` into `docs/features/<area>/<feature>.md`,
fill it in, then run `node scripts/build-feature-index.mjs` to refresh this table.
Use `--check` in CI or before committing to catch bad status values and dead code paths.
`added` is the date of the first commit that added the page's main file (a guide, not a release date). `TBD` marks anything not yet verified.

<!-- generated: do not edit below this line -->

| Feature | Area | Status | Where in app | Added | Details |
|---|---|---|---|---|---|
| Captions in the personalization editor (Caption Studio) | personalization | live | Personalize > Step 3 Personalize > Captions (optional); Personalize > Advanced Editing > Step 4 Preview and approve > Captions | 2026-11-23 | [page](personalization/captions-studio.md) |
| Design fixes from the template sweep (KPI figures, light logos, sparse brands) | personalization | live | Personalize this demo > Step 4 > Designs | 2026-11-23 | [page](personalization/design-fixes-and-kpi-figures.md) |
| Free branded render for visitors, and AI generation on your own keys | personalization | live | Personalize a video > Step 4 (Preview and approve) > Render branded video / Generate with AI | 2026-11-23 | [page](personalization/free-branded-render-and-ai-keys.md) |
| Opening and closing scenes (Personalization Step 4) | personalization | live | Personalize a video > Step 4 (Preview and approve) > Opening and closing scenes | 2026-11-20 | [page](personalization/opening-and-closing-scenes.md) |
| Caption Studio | studio | live | Clipping Studio > clip > Captions; Personalization > Captions > Studio | 2026-11-20 | [page](studio/caption-studio.md) |
| Saved assets library | studio | live | Any image or video studio > Library / Saved button in the prompt bar | 2026-11-07 | [page](studio/saved-assets-library.md) |
| Social Publishing | studio | live | Studio result > Publish | TBD | [page](studio/social-publishing.md) |
| Video Outreach link | studio | live | Studio tab bar > Video Outreach | 2026-11-25 | [page](studio/video-outreach-link.md) |
| Video Pages | studio | live | Top bar > Video Pages; any studio's result > Landing page; Video Pages window > My pages | 2026-11-25 | [page](studio/video-pages.md) |
