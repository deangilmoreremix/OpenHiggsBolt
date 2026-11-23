# P3-E — Export Matrix Engineer (Wave 2, lane `e2e`)

**Item 7.** Close the verification gap: colour-compare **every** registered design in a real encoded
MP4, not just `animated-headline`.

## Files you own EXCLUSIVELY
- `e2e/personalization-step4-remotion-export.spec.ts` (extend)
- `docs/phase3/EXPORT_MATRIX.md` (new)
- `docs/screenshots/phase-3/**` (new)

Do not edit any other file. If you need one, post a board message `type: "ASK"`, `to: "ALL"`.

## Context you must read
- `docs/phase3/EXECUTION_PLAN.md` (§1 item 7, §4 Wave 2 table, §5)
- `docs/phase3/OWNERSHIP.md`
- `docs/phase3/VERIFICATION_SPEC.md`
- `docs/phase3/DECISIONS.md`
- `docs/phase3/WAVE1_AUDIT.md`
- `docs/phase3/BUILD_LOCK` ← **you hold the build lock and the browser for your whole window**
- `docs/phase3/validate.sh` (the P3-E case)
- `docs/REMOTION_PHASE_2_REPORT.md` (for the design list and the Phase 2 export evidence)

## The gap
`e2e/personalization-step4-remotion-export.spec.ts` has `ALL_DESIGNS` with only **5** entries
(`animated-headline`, `logo-reveal`, `lower-third`, `promo-cta`, `visual-effect`). The registry has
**19** designs: those 5 plus 14 Phase 2 designs — 10 in `src/shared/personalization/templates/catalog.ts`
(`starfield-warp`, `logo-bounce-drop`, `logo-mask-wipe`, `logo-split-reveal`, `brush-stroke-reveal`,
`text-mask-reveal`, `glitch-text`, `logo-blur-reveal`, `chapter-title`, `bar-chart-anim`) and 4 in
`src/shared/personalization/templates/designs/rveCatalogEntries.ts` (`rve-circular-progress`,
`rve-animated-text`, `rve-popping-text`, `rve-slide-text`). **Derive the list from the registry at
runtime** if you can — a hard-coded list that drifts is the defect this item exists to prevent.

The existing spec already has a `test('every registered design exports to a real encoded MP4')` that
iterates `ALL_DESIGNS` and asserts: real MP4 container (`ftyp`), an H.264 track (`avc1`), non-zero
size, a positive duration, 1920×1080, the design id present in the renderer DOM, and the MIT credit
line present in the DOM. **That test only covers 5 designs.** The *pixel* comparison
(`test('the design is in the encoded pixels, and the un-personalized render has none')`) covers only
`animated-headline`.

Three designs carry an explicit **"verify in an exported frame"** note and are the highest risk —
their effect is a CSS filter/blend the encoder may flatten:
- `lower-third` — `blur(14px)`
- `visual-effect` — `blur(20px)` + `mix-blend-mode: screen`
- `logo-blur-reveal` — `blur(40px)`

## What you must deliver
1. **Every one of the 19 designs** must be driven through the real browser export and checked in the
   **encoded pixels**, each against a **control render with the design removed** — the identical
   composition with the design layer hidden.
2. For each design, prove:
   - the encoded file is a real MP4 (container `ftyp`, H.264 `avc1`, non-zero size, positive duration,
     1920×1080);
   - the design's brand-primary pixels are **present** inside the design's box in the personalized
     render and **absent** from the same region of the control render;
   - the **only** difference between the two encoded frames lies **inside the design box** (the
     renders are frame-aligned and the design is the sole difference) — a difference *outside* the
     box is a failure;
   - the credit line is inside the **encoded frame**, not only in the DOM.
3. `docs/phase3/EXPORT_MATRIX.md` — one row per design: id, label, file name, byte size, container
   facts, duration, dimensions, brand-primary pixel count in the design box, changed-pixel count
   inside vs **outside** the box, credit-line present, and a PASS/FAIL verdict. This file is the
   evidence of record; it must be consistent with the raw artefacts.
4. `docs/screenshots/phase-3/**` — a screenshot per design (or per failure) as visual evidence.
5. The raw MP4s go to `test-results/remotion-export/` (git-ignored) — do not commit them.

**If a design genuinely cannot be pixel-compared** (e.g. it paints no brand-primary pixels, or the
encoder flattens a blend mode), do **not** silently skip it and do **not** weaken the assertion.
Record it in `EXPORT_MATRIX.md` with the measured evidence, the reason, and the exact residual —
and report it to the orchestrator as a blocker with a proposed alternative check (for example:
"the design's alpha/blend output differs from the control by N pixels inside the box" instead of
"the design is absent"). A design with no colour difference in the box is a **finding**, not a pass.

## Build lock and browser — you are the single holder
- **You** hold `docs/phase3/BUILD_LOCK` and the browser for the whole of your window. Write your
  agent id and the time into the lock file, and reset it to `FREE` when you are done.
- Only one dev server at a time. Check `lsof -ti :3111` first: reuse a running server, or start one
  and clean it up with `lsof -ti :3111 | xargs kill -9`. **Never kill a process you did not start.**
- **Turbopack is broken in this worktree** (`next dev --turbopack` → "Next.js package not found").
  Use `npx next start --port 3111` against a production build. `next dev` overwrites `.next`.
- The Playwright `webServer` config would start the broken Turbopack server, so start `next start`
  on 3111 yourself and Playwright will reuse it.
- You need a **production build** to export from. The orchestrator may have produced one; if not,
  take the build lock and run `npm run build` yourself, and paste the raw output.

## Host health gate — run before any suite
```
uptime                                   # load1 must be < 40
vm_stat | grep -E 'Pages (free|inactive)' # available must be > 1.5 GiB
```
If the gate fails, **delay and report it**. A suite result obtained under load is **discarded, not
trusted**. Phase 1 measured a *different* 2–4 failures per run at load 161–189, including whole
files failing to collect with no assertion.

## Validation
```
npx playwright test e2e/personalization-step4-remotion-export.spec.ts --project=chromium --reporter=list --retries=0 --workers=1
```
→ **19/19 designs encoded and pixel-compared.**

## CRITICAL SAFETY RULE
The working tree is **shared with other agents**. **NEVER** run `git stash`, `git checkout`,
`git reset`, `git clean`, or `git restore`. Prove a pre-existing failure read-only
(`git show ef13ab9bc:<path>`) and record that method. Only `git status`, `git diff`, `git show`,
`git ls-files` are allowed. **Do not commit, push, merge, or deploy.**

## Deliverables
1. **`docs/phase3/handoffs/P3-E.md`** — follow `docs/phase2/handoffs/TEMPLATE.md`. Paste **raw**
   command output: the playwright run, the per-design summary, and the `EXPORT_MATRIX.md` content.
2. **A board post** — `board_post`, `to: "ALL"`, `type: "RESULT"`, body **at most 12 short lines**.

## Report back
The 19/19 verdict per design, the file and byte size, the inside/outside box changed-pixel counts,
any design that could not be colour-compared with its measured residual, and the raw run output.
