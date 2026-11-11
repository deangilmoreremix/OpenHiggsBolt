# connections.com film created WITHOUT AI

Real run of `e2e/motion-director-no-ai.spec.ts` through the Motion Director UI (button "Create without AI"): real capture of https://www.connections.com/, no Brand Kit, no uploads, browser web renderer, MP4 exported from the Workbench (draft 1280x720).

- **AI/paid services:** none. The test records every request and fails on any call to `/api/motion-studio/director` or `api.openai.com`: `ai-calls.json` = no requests. No key was configured.
- **MP4:** `connections-without-ai.mp4`, h264 1280x720, AAC audio, 25.0 s, 750 frames decode with no errors.
- **Technical QA:** frame QA passed (20 frames); shot-card checklist 15/15. AI creative review: **not performed** (labelled, not a prerequisite).
- **Workbench:** opened (`workbench.png`), all tracks editable.

| # | Recipe / card | Time | Content |
|---|---|---|---|
| 1 | `inkpress-title-card` | 0–2.5 s | site logo/name/words |
| 2 | `brand-gallery` | 2.53–5.5 s | site logo/name/words |
| 3 | `demo:MultiplaneReal` | 5.47–11.4 s | site pictures/crops/pages |
| 4 | `demo:FreezeAnnotateReal` | 11.37–17.3 s | site pictures/crops/pages |
| 5 | `demo:PageWaterfallWall` | 17.3–21.9 s | site pictures/crops/pages |
| 6 | `brand-logo-reveal` | 21.9–25.0 s | site logo/name/words |

Frames: `sceneNN-*-enter|peak|settled-fXX.png` (drawn by the export renderer) and `sheet-sceneNN.png` (the three side by side). Storyboard: `storyboard.txt/png`. Chat log: `chat-after-build.txt`.

## What still looks wrong
- Caption strips ("ASSESS & LEAD", "INITIATE & RELIEVE") are the template's mono caption style and sit over parts of the real page in some frames; headings used as captions come from the site's own section names (e.g. "Identify & Secure"), not full sentences.
- Several on-screen lines are generic ShotCraft category copy ("Up close on the details.", "On the beat.", "Every page, live."), not business facts.
- The pictures are the site's testimonial video thumbnails (with play buttons) and page screenshots; the site offered few other photographs.
- This path uses the original recipes through their supported inputs only; it does no source rewriting, no AI direction or review.
