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
