# Phase 2 — Verification Spec (read this before running anything)

Branch: `feature/remotion-personalization-phase-2` · Baseline: `84a9d1586`
**Do NOT commit, push, open a PR, merge, or deploy.** Leave everything in the working tree.
**Do NOT fix product bugs** — report them.

## The build lock
`docs/phase2/BUILD_LOCK` names the single agent allowed to run `npm run build`,
`npm run build:packages`, `npm run build:studio`, `npm run test:unit`, `npx playwright test`.
Take it by writing your id into it; release it by setting `**Status:** FREE` and
`**Holder:** — (released by <id>)`. `npm run typecheck`, `npx tsc --noEmit`,
`npx next lint` and single-file `npx vitest run <file>` need no lock.

**Host warning:** this machine has been rebooting under the agents and its load average reached
348. Before believing a failure, check `uptime` and `vm_stat | grep 'Pages free'`. A suite that
disagrees with the previous run is a **load** symptom until proven otherwise. Prefer
`--workers=1`/`--pool=forks` on a loaded box.

## Port / server hygiene
- **Turbopack is broken in this worktree** (`next dev --turbopack` → "Next.js package not found").
  Use `npx next start --port 3111` against a production build. `next dev` overwrites `.next`.
- Check `lsof -ti :3111` first. Reuse a running server, or start one and clean it up with
  `lsof -ti :3111 | xargs kill -9`. **Never kill a process you did not start.**
- Playwright's `webServer` config would start the broken Turbopack dev server — so start
  `next start` on 3111 yourself first and Playwright will reuse it.

## Pre-existing-failure proof rule
The known pre-existing failure is
`src/shared/personalization/__tests__/DiscoveredAssets.test.tsx > imports selected person assets
into identities`. Any **other** failure must be **proven** pre-existing, not asserted:
`git stash push -u` → re-run the failing test at the pinned baseline → `git stash pop` → paste
**both** outputs. A failure that does not reproduce at the baseline is a **new defect** — report
it, do not fix it.

## Matrix (every row, raw output)

| # | Gate | Command | Pass condition |
|---|---|---|---|
| 1 | Typecheck | `npm run typecheck` | exit 0 |
| 2 | App build | `npm run build` | exit 0 |
| 3 | Package build | `git submodule update --init --recursive && npm run build:packages` | exit 0. A5 could not run this — the `packages/Vibe-Workflow` / `packages/Open-Poe-AI` submodules were not checked out. If the submodule fetch fails, say so explicitly and report `npm run build:studio` alone as a fallback with its raw output. |
| 4 | Lint delta | `npx next lint` | Phase 1 baseline was **1719 findings / 1224 errors / 495 warnings**. Phase 1 introduced 2 warnings which A11 removed. Report the exact delta and confirm **no new finding in any file Phase 2 touched**. |
| 5 | Unit — personalization | `npx vitest run src/shared/personalization` | 0 failures other than the proven pre-existing one |
| 6 | Unit — repo-wide | `npm run test:unit` | report honestly; prove which failures are pre-existing |
| 7 | E2E Step 4 (Phase 1) | `npx playwright test e2e/personalization-step4-remotion-designs.spec.ts` | 4/4 |
| 8 | E2E export (A1) | `npx playwright test e2e/personalization-step4-remotion-export.spec.ts` | 3/3 — real encoded MP4 with the design in the pixels |
| 9 | E2E all designs | `npx playwright test e2e/personalization-step4-remotion-designs-all.spec.ts` | all 19 designs selectable + render |
| 10 | E2E studio handoff | `npx playwright test e2e/personalization-studio-handoff.spec.ts` | the studio trigger opens the modal with the studio's media |

## Facts you can rely on (verified)
- **19 designs** are registered: 5 Phase 1 (`animated-headline`, `logo-reveal`, `lower-third`,
  `promo-cta`, `visual-effect`), 10 batch 1 in `catalog.ts`, 4 batch 2 in
  `templates/designs/rveCatalogEntries.ts` (registered via `REMOTION_DESIGN_BATCH2_TEMPLATES`).
- 21 upstream dirs under `templates/_upstream/` (20 designs + README.md + ADAPTER-SPEC.md).
- The 5 original layout pills (`Business Introduction`, `Product Showcase`,
  `Service Promotion`, `Special Offer`, `Branded Ending`) must be **unchanged**.
- To reach Step 4 in the browser: navigate to `/personalization-demo?test=true`, click the
  **"Step 4"** wizard button, then click **"Compare"** — the default toggle mode mounts only the
  original video, so the personalized composition is not in the DOM.
- A design layer renders as `[data-remotion-design-id="<id>"]` inside the
  "After: personalized preview" region; every design also draws
  `[data-remotion-design-credit]`.
- 10 studios now receive a `renderPersonalizeAction` prop from `components/StandaloneShell.js`
  (Video, Image, Clipping, VibeMotion, MotionControl, LipSync, Cinema, Marketing, Recast,
  AiInfluencer).

## Handoff contract
Write `docs/phase2/handoffs/<ID>.md` using `docs/phase2/handoffs/TEMPLATE.md`, with **raw**
command output. Also post a board message: `board_post` with `to: "ALL"`, `type: "RESULT"`,
body **at most 12 short lines (well under 3 KB)** — detail goes in the handoff file, not the
board body. (A previous agent's over-long board post was rejected as malformed and the agent
was aborted.)
