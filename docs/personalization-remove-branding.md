# Personalization: Remove branding with AI (paid)

Step 4 ("Preview and approve") has a **Remove branding (AI)** button for signed-in users. It runs a paid MuAPI job
that erases logos, watermarks and captions already baked into the source video (for example the "MINIMAX | Hailuo AI"
mark in the corner of the perfume demo). Overlays cannot remove those; the Layout Quality Check says so.

## It is never free and never automatic

- The button only opens a confirmation. The job starts only from that dialog's **Remove branding** button, which stays
  disabled until the person ticks that they have the right to edit the video.
- The confirmation states that it uses credits, shows MuAPI's live cost estimate for this video (`estimateV2VCost`) and the
  account balance (`getUserBalance`), and says the original video is kept.
- Nothing else starts it: not the layout auto-placement, not opening the editor, not a re-render.
- The same rights gate as the render applies: while the clip's rights are unconfirmed the button is disabled.

## Setting the price

`REMOVE_BRANDING_CREDITS` in `guided/brandingRemoval.ts` is `null` by default. While it is `null` the dialog shows the live
estimate ("about 0.12 USD") or just "uses credits"; it never invents a number. Set it to the real credits-per-video price and
the button label, the dialog and the affordability check use it (the balance is in credits, so it is only compared with this
constant, never with the currency estimate).

## What it does to the project

- Model: `video-watermark-remover` through `processV2V` (the model the Edit Studio "Watermark Remover" tool uses).
- The cleaned video becomes the preview video (`kind: 'recast'`, title "Branding removed") and keeps the previous video in
  `beforeRecast`, so **Use original video** (and the existing "Use original video" in Advanced Editing) switches back.
- A failed job, or a job that returns no video, changes nothing and reports the error. **Stop waiting** cannot recall a job
  that the provider has already accepted; the UI says it may still use credits and ignores the late result.

## Tests

`guided/__tests__/brandingRemoval.test.ts`, `useBrandingRemoval.test.tsx` and `RemoveBrandingControl.test.tsx` use a fake
service (the network calls are injected), so no test can submit a real job. No real paid job has been run for this feature;
the first real run should be a short clip, checked by hand for cost and quality.

The control only renders for signed-in users, so it cannot be driven by the offline `/personalization-demo` harness
(which is anonymous); it was verified with component tests.
