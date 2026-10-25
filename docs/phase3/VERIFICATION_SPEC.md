# Phase 3 — Verification Spec (read before running anything)

Branch `feature/remotion-personalization-phase-2` · pinned base `ef13ab9bc` · `origin/main` `7ebc20967`

**Do NOT commit, push, open a PR, merge, or deploy.** Leave changes in the working tree.
**Do NOT fix a product bug you did not own** — report it precisely instead.
**Do NOT rebase, reset, or touch** `origin/main`, `netlify.toml`, `package.json`, lock files, `.github/`.

## Decisions you must implement (defaults, unless the owner says otherwise)

| # | Decision | DEFAULT TO IMPLEMENT |
|---|---|---|
| D1 | Font asset strategy | **Inline the woff2 as a base64 data URI** in `templates/typography.ts` (strict C11). Then extend `noNetworkDuringBrandRender.test.ts` with a **`FontFace.load()` spy** so zero font network requests is *enforceable*, not advisory. |
| D2 | OFL attribution in the rendered credit line | **Yes.** Extend the aggregated credit to include `Typeface: Inter (SIL OFL 1.1) © 2016 The Inter Project Authors`. `public/fonts/OFL.txt` must keep shipping. |
| D3 | Customer font picker determinism | **Reduce the picker to the single bundled face** ("Personalization Sans"); relabel the per-OS entries as unavailable rather than silently offering them. |
| D4 | `packages/studio/dist` | **Untrack it** (`git rm --cached`), keep it in `.gitignore`. |
| D5 | CI/Netlify model | **Change nothing.** Document the recommendation in `docs/phase3/DECISIONS.md`. The repo-wide red is a **billing lock**, not a workflow defect. |

Record what you implemented in `docs/phase3/DECISIONS.md` with its revert cost.

## Pre-existing-failure proof rule

The known pre-existing failure is
`src/shared/personalization/__tests__/DiscoveredAssets.test.tsx > imports selected person assets
into identities`. Any **other** failure must be **proven** pre-existing, not asserted:
`git stash push -u` → re-run the failing scope at the pinned base → `git stash pop` → paste
**both** outputs. A failure that does not reproduce at the base is a **new defect** — report it,
do not "fix" it by adjusting the expectation.

## Error taxonomy — what to do when something fails

| Code | Symptom | Recovery |
|---|---|---|
| E1 | You were killed / your final message was lost | **Your handoff file is the deliverable.** Write it first, then post to the board. If the orchestrator re-dispatches you, the handoff makes you resumable. |
| E2 | Your validation fails | Fix it **within your own files**. If it fails twice, stop and report the blocker with a proposed fallback — do not loop. |
| E3 | You need a file you do not own | Post a `REQUEST` on the board with the exact change you need. Do not edit the file. |
| E4 | The host is loaded | Check `uptime` + `vm_stat`. If load1 ≥ 40 or available memory < 1.5 GiB, **pause and report** rather than running a suite. |
| E5 | `origin/main` moved | Not your problem. The orchestrator rebases once, in Wave 4, and re-runs everything. |
| E6 | A test fails only intermittently | Re-run the scope twice. Classify by the proof rule, not by assumption. |
| E7 | A board post is rejected | The body is probably over ~4 KB. Retry with **at most 12 short lines**; the detail belongs in your handoff file. |

## The handoff contract (both are mandatory)

1. **`docs/phase3/handoffs/<ID>.md`** — follow `docs/phase2/handoffs/TEMPLATE.md`. Paste **raw**
   command output. A summary is not evidence. Write this file **before** you post to the board.
2. **A board post** — `board_post`, `to: "ALL"`, `type: "RESULT"`, body **at most 12 short lines
   (well under 3 KB)**. Detail goes in the handoff file.

## QA gates the final integrator (P3-H) enforces

QA-1 typecheck · QA-2 app build · QA-3 package build · QA-4 lint no worse than 1224 errors ·
QA-5 no new unit failures · QA-6 no `MISSING_PROJECT_ID` · QA-7 19/19 designs export-compared ·
QA-8 no modal ≥ z-250 except the upgrade gate · QA-9 zero font network requests ·
QA-10 every studio trigger has exactly one provider ancestor · QA-11 protected files untouched ·
QA-12 `origin/main` untouched · QA-13 no deploy · QA-14 the report is honest.
