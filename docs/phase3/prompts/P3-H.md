# P3-H — Integration, QA & Report Engineer (Wave 4, lane `integration`)

**You are the only agent allowed to touch every lane.** You integrate Waves 1–3, run the full
validation matrix, perform the 14 QA gates and the seven-point independent audit, fix what you find,
and write the Phase 3 report.

## Files you own
Everything. `docs/phase3/**`, `docs/REMOTION_PHASE_3_REPORT.md`, and any source file whose fix is
required to close a QA gate. **Except**: `netlify.toml`, `package.json`, `pnpm-lock.yaml`,
`package-lock.json`, `.github/**` and `origin/main` — nobody may touch those, including you
(QA-11 and QA-12 are checked *because* they are untouched).

## Context you must read
- `docs/phase3/EXECUTION_PLAN.md` — especially §5.4 (the QA gates) and §5.5 (the seven-point audit)
- `docs/phase3/OWNERSHIP.md`, `docs/phase3/VERIFICATION_SPEC.md`, `docs/phase3/DECISIONS.md`
- `docs/phase3/BUILD_LOCK`, `docs/phase3/validate.sh`
- `docs/phase3/WAVE1_AUDIT.md`
- `docs/phase3/handoffs/P3-{A,B,C,D,E,F,G}.md` — **all seven**, in full. This is your input.
- `docs/REMOTION_PHASE_2_REPORT.md` — its §13 backlog must be marked item-by-item
- `docs/phase3/prompts/` — the dispatch prompts for the waves you are integrating

## Step 1 — the seven-point independent audit (this is the point of the wave)
Phase 2 shipped a defect class that passing tests did not catch. Audit for it explicitly:
1. every assertion that was **weakened** rather than correctly updated;
2. every registry entry that is **registered but never rendered**;
3. every render prop that is **passed but never supplied**;
4. every capability claimed in `capabilities.notes` that is **not enforced or tested**;
5. every import that **crosses a package boundary** (especially `packages/studio/**` importing from
   the app root — that breaks the published tarball);
6. every new optional field that is **not preserved** by `normalizeLayer` / `normalizePreviewSettings`
   (e.g. `textSlotOverrides` from A4's `INTERFACE-slots.md` contract — verify it actually survives a
   save/reload round trip);
7. every licence or **attribution obligation** that is documented but not shipped (the OFL notice for
   the bundled typeface, the MIT notices for both upstream repositories).

For each finding: fix it, or record it with the evidence and the reason it is not fixed.

## Step 2 — rebase once, then re-run the FULL matrix
- `git fetch origin` and check `git rev-list --count <pin>..origin/main`. If there is drift, **rebase
  once** onto the then-current `origin/main` and re-run the **entire** matrix on the rebased tree. No
  agent rebases; you are the one who may.
- Never rebase if the working tree is dirty — land the work first.

## Step 3 — the 14 QA gates
Run `docs/phase3/validate.sh P3-H` as the orchestrator's script, and additionally prove each gate:

| # | Gate | Evidence required |
|---|---|---|
| QA-1 | Typecheck clean | `npm run typecheck` exit 0 |
| QA-2 | App build succeeds | `npm run build` exit 0 |
| QA-3 | Package build succeeds | `npm run build:packages` exit 0 |
| QA-4 | Lint does not regress | `npx next lint` ≤ the Phase 2 baseline (**1224 errors**); `next lint` skips `packages/` and `e2e/` |
| QA-5 | No new unit failures | `npm run test:unit` failures ≤ the Phase 2 set, each new one proven pre-existing |
| QA-6 | The 400 is gone | a real authenticated request carries a valid `id`/`list` param; the server logs **no** `MISSING_PROJECT_ID` |
| QA-7 | 19/19 designs export-compared | each design's encoded frame differs from its control **only inside its box**, and carries its credit line — see `docs/phase3/EXPORT_MATRIX.md` |
| QA-8 | The modal is never occluded | no modal ≥ `z-[250]` except the upgrade gate |
| QA-9 | Zero network during render | the `FontFace.load` spy asserts zero font fetches |
| QA-10 | Every studio trigger has exactly one provider ancestor | a structural check over the studio render tree |
| QA-11 | Protected files untouched | `git diff origin/main -- netlify.toml package.json pnpm-lock.yaml .github/` is **empty** |
| QA-12 | `origin/main` untouched | `git ls-remote origin refs/heads/main` unchanged |
| QA-13 | No deploy | Netlify not triggered; no publish job run |
| QA-14 | The report is honest | every claim in `docs/REMOTION_PHASE_3_REPORT.md` has raw output behind it; unproven items are listed as unproven |

**QA-3 caveat (known, pre-existing):** `npm run build:packages` chains with `&&` and stops at
step 1 because the `packages/Vibe-Workflow` and `packages/Open-Poe-AI` **submodules are not checked
out** in this worktree (`npm: 'No workspaces found'`), so `build:studio` never runs. Run
`git submodule update --init --recursive` first. If the submodules still cannot be fetched, record
it as an **external blocker with the proof** — do not silently report QA-3 as passed.

**QA-4 caveat:** the baseline is 1224 errors. `next lint` skips `packages/` and `e2e/`, so a delta
there is invisible to the linter — check those trees separately.

## Step 4 — the report
`docs/REMOTION_PHASE_3_REPORT.md` with:
- the 13 items, each marked **closed / deferred-with-reason / still-open-with-evidence**;
- the Phase 2 report's §13 backlog marked item-by-item;
- every QA gate with its **raw** command output behind it;
- the seven-point audit results;
- the raw export matrix;
- the test-debt ledger;
- every residual and external blocker;
- **nothing claimed that is not backed by raw output.** If something is unproven, it is listed as
  unproven (QA-14).

## Host health gate
```
uptime                                   # load1 < 40
vm_stat | grep -E 'Pages (free|inactive)' # available > 1.5 GiB
```
Discard any suite result obtained under a failing gate — Phase 1 measured a *different* 2–4 failures
per run at load 161–189. Re-run before believing a failure.

## Build lock and browser — you are the single holder
Take `docs/phase3/BUILD_LOCK`, write your id into it, and reset it to `FREE` when done.
- Turbopack is broken in this worktree (`next dev --turbopack` → "Next.js package not found").
  Use `npx next start --port 3111` against a production build. `next dev` overwrites `.next`.
- Check `lsof -ti :3111` before starting a server; **never kill a process you did not start**.

## Release handling
- Commit the completed work to the assigned feature branch.
- Integrate the Phase 3 implementation.
- Verify the final build and browser behaviour.
- **Prepare** the production deployment, but **do not unlock production and do not deploy** without
  the owner's explicit authorization. There is an existing production publishing lock — respect it.
- Do not modify unrelated projects or other active worktrees.

## CRITICAL SAFETY RULE
**NEVER** run `git checkout`, `git reset --hard`, `git clean`, or a destructive cleanup against
uncommitted work. Inspect the filesystem and `git status` before any destructive operation, and
never against another agent's files. Only `git stash` **after** confirming via a board read that no
other agent is active.

## Deliverables
1. **`docs/phase3/handoffs/P3-H.md`** — follow `docs/phase2/handoffs/TEMPLATE.md`. Paste **raw**
   output for every gate.
2. **`docs/REMOTION_PHASE_3_REPORT.md`** — as specified above.
3. **A board post** — `board_post`, `to: "ALL"`, `type: "RESULT"`, body **at most 12 short lines**.

## Report back
The QA-1…QA-14 table with PASS/FAIL/BLOCKED and the raw evidence reference for each, the
seven-point audit findings, the final commit SHA and branch, the PR status, every outstanding
external blocker, and the production release readiness assessment.
