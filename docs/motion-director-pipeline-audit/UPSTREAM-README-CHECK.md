# Motion Director vs upstream video-shotcraft README (HEAD 6700db2)

Method: upstream cloned and compared file-by-file with the vendored skill and `demosrc/`; export settings read from `webRenderer.ts` / `ExportButton.tsx`; the no-AI evidence MP4 probed with ffprobe. No new live run was made.

| README claim | Result | Evidence |
|---|---|---|
| 124 cards / 10 categories (11/10/15/22/21/11/5/15/8/6) | MATCH | `references/shots` per category identical to upstream; `diff -rq` of `references/shots`, `template/src`, `SKILL.md` is empty |
| Implementations in `demos/<cat>/<card>/` | MATCH + 2 extras | all upstream demo dirs present; ours adds BrandInkOpen and DocumentTypewriterReveal |
| `ClipCardLooping` | NOT A GAP | upstream's own `workbench.md` excludes it (needs a real mp4, not a card); we ship media clip cards instead |
| MP4 1920x1080 30 fps h264 + audio | MATCH by default | export default `scale = 1` on a 1920x1080 project; Draft = 720p. Our saved no-AI evidence MP4 is the draft: h264 1280x720 30 fps + aac |
| Real page capture -> storyboard with cards -> Remotion -> frame QA | MATCH (code); AI planning unverified live | pipeline stages in `UPSTREAM-CREATION-PARITY.md`; the no-AI path ran end to end on connections.com |
| Ink Press template | MATCH | `inkPressPlan`, explicit offer in chat |
| Named cards ("deck-deal-flyin and row-embed", "inspired by spotlight-hero-card") | MATCH in code (single mode, user-picked recipes kept by the storyboard gate); not re-run in this check |
| Motion Workbench | MATCH | opens from the chat, workbench-loop spec |
| Beat sync + sound design | PARTIAL | bundled SFX/music library; no Freesound sourcing (known upstream difference) |
| JianYing draft export, social publishing | NOT IMPLEMENTED | out of scope, never built |
| Remotion project export | NOT IMPLEMENTED | browser MP4 export only |

Open: live AI behaviour (BLOCKED - NO AUTHORIZED KEY); the four README prompts were not each re-driven through the chat in this pass.

---
# Step-by-step comparison with the upstream workflow (SKILL.md + references/pipeline.md, read in full)

Basis: upstream `SKILL.md` (286 lines) and `references/pipeline.md` (382 lines) were read in full; the vendored copy is byte-identical to upstream HEAD 6700db2. Our side was checked in code (greps and earlier rounds' tests). "Not run live" means the AI path (no OpenAI key here).

## Modes (SKILL.md)
| Upstream rule | Ours | Status |
|---|---|---|
| Three modes: Ink Press / autonomous / co-creation; do not merge them | `inkpress`, `autonomous`, `cocreate` (+ `single`, + our extra `local` = no AI) | MATCH (+1 extra mode) |
| Naming Ink Press = mode already chosen, no question | "make a launch film ... with the Ink Press template" goes straight to Ink Press | MATCH |
| Naming shot cards = shot constraint, only ask autonomous vs co-creation | user-named recipes are kept by the storyboard gate; single shot goes direct | MATCH in code, not re-run live |
| Without a mode: read-only product check, then recommend a mode with reasons and ask | chat shows an offer stage with Ink Press / director / no-AI choices; the recommendation text is lighter than upstream's (no per-mode fit reasons) | PARTIAL |
| Co-creation: confirmations at brief, decisions, direction, mapping, storyboard; "you decide" switches to autonomous | real approval boundaries; "you decide" switches mode keeping the brief | MATCH (tested offline) |

## Stages 0-7 (pipeline.md)
| Stage | Upstream | Ours | Status |
|---|---|---|---|
| 0 product understanding | brief + requirement-to-decision table, data-safety rules | `productBrief.ts` (business kind, decision table); real sites captured; no sensitive-data handling beyond the site's public pages | MATCH (AI brief not run live; deterministic fallback tested) |
| 1 direction + HTML styleframes (<=3 directions, motion-personality tokens) | directions + styleframes rendered before mapping | `styleframes.ts`, direction stage recorded | MATCH structure; the brand-to-motion preset table (6 presets) is not a coded lookup |
| 2 feature -> shot map, one technique used once as hero | `requestMapping`, release check | MATCH (AI map not run live) |
| 3 storyboard, hold/rest budgets (wordmark hold >=1 s, 0.5 s rest, opener >=3 s), `sequences/` bridge templates, energy arc | `shotRules` (R4 whole-frame hits capped at 3, arc order), `fitNativeLengths` | PARTIAL: hit cap and arc exist; I found no explicit hold-budget rule and no use of `references/sequences` templates in code |
| 4 final asset capture: 2x full page, element cutouts, layout.json, empty backplate | capture route returns screens, crops, layout, empty plate, logo, brand, assets (real run on connections.com) | MATCH |
| 5 per shot: read card + exact demo TSX, keep tuned values, stills at 2 frames, deterministic, workbench manifest | cards + sources fetched and given to adaptation, `adaptLoop` gate, scene QA at entering/peak/settled (stricter than 2 frames), plain recipes keep upstream motion code untouched | MATCH (adaptation not run live); no `workbench.ts` parity script needed (Workbench is our own) |
| 6 sound: Freesound SFX per project, relative pinned frames, BGM with/without versions | bundled SFX/BGM library, cues pinned to events (`soundRecord`), beat sync for supplied music | PARTIAL: no Freesound sourcing or credits file; with/without-music export exists as a user choice, upstream always delivers both |
| 7 independent review in a clean context with brief, mapping, storyboard, frames; fixes loop back to stage 3/5/6 | `finalReview` + `filmFix`; a missing reviewer = `needs-review`, never "passed"; fingerprint ties review to the film | MATCH by design; not run live |
| Delivery: open Workbench first | "Open in Motion Workbench" | MATCH |
| Delivery: JianYing export, publishing, author/showcase prompts | not built | NOT IMPLEMENTED (optional upstream extras) |

## Verdict
For the steps that need no model, ours follows upstream (capture, library, Ink Press, single shot, storyboard rules, Workbench, MP4 specs). Real gaps against upstream's own text: (1) hold/rest frame budgets and `sequences/` templates are not enforced by code, (2) the mode-recommendation step is thinner, (3) sound is the bundled library not Freesound, (4) one-click two-version (with/without BGM) delivery, (5) JianYing/publishing. Everything model-driven (stages 0-2 AI, adaptation, review) is the same method but **not verified live**.

Suggested follow-ups, only if you want them (not started): enforce the hold budgets in the storyboard gate with a unit test; fill the mode-recommendation text from the capture; add a one-click "export both versions".

---
# Addendum: the remaining upstream reference files

**Correction to the wording above.** "Read in full" covers upstream's `README.md`, `SKILL.md` and `references/pipeline.md`. The five reference files below were read afterwards: `final-review.md`, `guided-free-creation.md` and `sound-design.md` in full; `music-beat-sync.md` and `workbench.md` by their structure and the rules that map to code. `jianying-export.md`, `publish-upload-post.md`, `sfx-sourcing.md`, `aesthetic-rules.md` and `sequences/` were not compared line by line (the first three describe features we do not build).

| Upstream file | What it asks | Ours | Status |
|---|---|---|---|
| `final-review.md` | Independent review with groups P F V S B D A Q, every item with a frame number; B3 holds (wordmark >= 1 s, 0.5 s rest) | Review requires P F V S B D Q (`REQUIRED_REVIEW_GROUPS`); the audio group A is not required because a reviewer looking at stills cannot hear; hold budgets are reported by the storyboard gate (item H1) | PARTIAL |
| `final-review.md` A8 | Deliver a with-music and a without-music version from one timeline | "Render both versions" button renders both; not automatic | PARTIAL |
| `final-review.md` A10 | Every SFX from Freesound with page, author, licence, hash, credits file | Bundled library; no provenance manifest or credits file | NOT BUILT |
| `guided-free-creation.md` | Brief table, decision table, <= 3 directions, styleframes, feature-to-shot map, storyboard confirmation, each with a recommendation first | Present (`coCreate.ts`, `styleframes.ts`) | MATCH |
| `guided-free-creation.md` | Fixed reply format per round (stage / confirmed / to confirm / delivered after); at most 1-3 questions a round | Not enforced in code | PARTIAL |
| `guided-free-creation.md` §5 | `card · style` name parsing; "reference only" and "no preview" styles gated | No such parsing; the catalogue has previews for all 150 recipes so no such style surfaces | N/A here |
| `sound-design.md` §4.6 | Compensate each sound for its own source peak lag and the output track offset | `SFX_PEAKS` per-file lag and `OUTPUT_AUDIO_OFFSET_F = 1.4` (upstream measured 1.28; marked "re-measure per pipeline") in `buildFilm.ts` | MATCH |
| `sound-design.md` §4.6 | Re-measure the offset on the rendered track by cross-correlation | Not automated (`renderedAudio.ts` checks clipping and peaks only) | NOT BUILT |
| `sound-design.md` §1-3 | Sound from Freesound per project, credits and manifest saved | Not built (known difference) | NOT BUILT |
| `music-beat-sync.md` | Beat grid, drum classes, cuts within 3 frames, re-test on the rendered track | `beatSync.ts`: tempo by autocorrelation, hit picking, drum classes, `syncReport` with a 3-frame tolerance. A lighter method than upstream's librosa grid fit; no render-track retest | PARTIAL |
| `workbench.md` | Project manifest + parity script for upstream's workbench | Motion Director ships its own Workbench; editing, saving, reopening and export are covered by its browser specs | N/A |

Result: no new defect and no regression. The differences are method (JavaScript beat analysis, bundled sound library) and the features we do not build (Freesound provenance, JianYing, publishing, Remotion project export).
