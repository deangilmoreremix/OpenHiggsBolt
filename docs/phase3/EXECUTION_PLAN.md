# Phase 3 — Execution Plan (multi-agent)

**Base:** `ef13ab9bc` (branch `feature/remotion-personalization-phase-2`) · `origin/main` = `7ebc20967`
**Status:** plan only — nothing in this document has been executed yet.
**Supersedes:** the Phase 2 backlog in `docs/REMOTION_PHASE_2_REPORT.md` §13.

---

## 1. Scope — the 13 outstanding items, classified

Grounded in the Phase 2 report §12 (defects), §13 (backlog) and direct inspection of the tree.

| # | Item | Nature | Grounded at | Risk if shipped as-is |
|---|---|---|---|---|
| 1 | `400 MISSING_PROJECT_ID` on every authenticated modal open | **product bug** | `DemoPersonalizeProvider.tsx:1708` → `supabaseProjectPersistence.ts:191-197` → `app/api/personalization/project/route.ts:64-65,109` | durable Supabase restore never happens; a 400 logged per open; "my project wasn't saved" tickets |
| 2 | C11 font: data-URI vs same-origin `public/` | **decision** | `templates/typography.ts`, A6 §6 C11 vs A10 | two incompatible readings on record; the zero-network property is currently advisory |
| 3 | Does the OFL attribution belong in the rendered credit line? | **decision** | A10 §8.3 | licence obligation could be missed in the shipped product |
| 4 | Customer font picker is non-deterministic (Inter/Georgia/Impact/Monospace) | **decision + fix** | `preview/presets.ts:254-275` | the customer can still force a per-OS font and break export fidelity |
| 5 | Remaining studio consumers need their own provider mount / trigger | **scale-out** | Brand Studio, Photo Studio, Academy, VFX Studio, Thumbnail Studio | the trigger silently disappears for any studio rendered outside `StandaloneShell.js` |
| 6 | z-index residuals above the new `z-[250]` | **product bug (visual)** | `MotionControlStudio.jsx:1467` `z-[300]`; `VFXGenerate.tsx:462` `zIndex: 2000`; `vfx-studio/components/ImageUrlModal.tsx:33` `zIndex: 1000` (found by the validator) | those modals still paint over the Personalization Modal. Toasters (`zIndex: 99999`) and dropdowns (`z-[80]`) are **intentionally** topmost and must not be lowered. |
| 7 | Export-proof the designs whose notes say "verify in an exported frame" | **verification gap** | `lower-third` (blur 14px), `visual-effect` (blur 20px + `mix-blend-mode: screen`), `logo-blur-reveal` (blur 40px); plus 4 uncompared Phase 1 designs and 14 uncompared Phase 2 designs | filter/blend behaviour is unproven in the encoder; only `animated-headline` was colour-compared |
| 8 | 29 test files / 36 tests fail repo-wide (all pre-existing) | **repo hygiene** | Phase 2 report §9 row 6 | `npm run test:unit` is useless as a gate |
| 9 | `PersonalizationModal` retry-button flake | **test hygiene** | `PersonalizationModal.test.tsx` | will keep flaking and mask real regressions |
| 10 | `packages/studio/dist` is git-tracked build output | **repo hygiene** | 29 tracked files | a source-controlled build product; already went stale once |
| 11 | CI/Netlify model | **decision** | owner's own `d3267cee9` vs `28a1c96d9` | the workflows get re-added by a future merge and CI stays red |
| 12 | 12 gallery-only designs with no twin | **blocked** | source not obtainable | — nothing to do |
| 13 | Fixed-SVG-id constraint declared but not enforced in the UI | **product gap** | `logo-mask-wipe`, `rve-circular-progress`, `logo-reveal` | a second instance is clipped by the first, with no warning |

**Item 12 is formally closed as not-actionable.** 11 items are in scope.

---

## 2. Decision agenda — 5 decisions, with the default each agent will implement

These belong to the owner, not to an agent. To keep work unblocked, each agent implements the
**recommended default** and records it in `docs/phase3/DECISIONS.md` with the exact revert cost.
Nothing is irreversible: every one of these is a one-file change.

| # | Decision | Recommended default | Revert cost |
|---|---|---|---|
| D1 | Font asset strategy | **Inline the woff2 as a base64 data URI** in `templates/typography.ts` (the strict C11 reading). Makes the zero-network render property genuinely airtight, not advisory. Then extend `noNetworkDuringBrandRender.test.ts` with a `FontFace.load()` spy so the property is **enforceable**. | one file |
| D2 | OFL attribution in the rendered credit line | **Yes** — extend the aggregated credit to `Typeface: Inter (SIL OFL 1.1) © 2016 The Inter Project Authors`. `public/fonts/OFL.txt` must keep shipping regardless. | one file |
| D3 | Customer font picker | **Reduce the picker to the single bundled face** ("Personalization Sans"), and relabel the existing per-OS entries as unavailable rather than silently offering them. | one file + picker UI |
| D4 | `packages/studio/dist` | **Untrack it** (`git rm --cached`), keep it in `.gitignore`. Netlify builds from source; a tracked `dist` is a stale artefact waiting to happen (it already went stale once in Phase 1). | one git operation |
| D5 | CI/Netlify model | **Do not change `.github/workflows/` in this phase.** Record the recommendation to re-apply the owner's own `d3267cee9` retirement. The repo-wide red is a **billing lock**, not a workflow defect, so removing the workflows would hide the real problem rather than fix it. | n/a — no code change |

**If the owner wants a different default for D1–D4, say so before Wave 1 and the agents will
implement the alternative instead.** No agent may silently deviate from these defaults.

---

## 3. Orchestrator protocol (Wave 0) — ~15 minutes, before any agent starts

1. **Pin the baseline.** Record `ef13ab9bc` and `origin/main` = `7ebc20967`. Agents work from the
   pin. Only the orchestrator rebases, and only once, in Wave 4.
2. **Host health gate.** Record `uptime` and `vm_stat` free pages. If load > 60 or free pages
   < 30 000, **delay Wave 1** — a saturated host produces phantom test failures (measured: load
   161–189 produced a *different* 2–4 failures per run, whole files failing to collect with no
   assertion).
3. **Create the control plane** `docs/phase3/`:
   - `OWNERSHIP.md` — the file→agent→wave ledger and the exclusive lanes
   - `BUILD_LOCK` — the single-writer lock for heavy commands
   - `VERIFICATION_SPEC.md` — the shared matrix, the server hygiene rules, the failure taxonomy
   - `DECISIONS.md` — the decision log (D1–D5), written by agents as they implement
   - `handoffs/TEMPLATE.md` — the fixed handoff template
   - `raw/` — raw command output, one file per matrix row
4. **Write the machine validator** `docs/phase3/validate.sh`. It runs a named command set per
   agent and emits PASS/FAIL per check. **The orchestrator runs it; agents never self-certify.**
5. **Post the roster and the decision agenda to the board** (≤12 lines — the harness rejects
   longer bodies and aborts the posting agent).
6. **Re-check `origin/main` drift** immediately before releasing Wave 1, and report it.

---

## 4. Agent roster

Nine agents, four waves. Lanes: `persistence`, `catalog`, `ui`, `core`, `provider`, `e2e`,
`hygiene`, `integration`. One holder per lane at a time.

### Wave 1 — 4 agents in parallel, disjoint files, no heavy commands

| ID | Role | Owns (exclusive) | Lane | Item(s) | Pre-registered validation (orchestrator-run) |
|---|---|---|---|---|---|
| **P3-A** | **Persistence Contract Engineer** — fix the `MISSING_PROJECT_ID` 400 and make project restore actually work | `src/shared/personalization/supabaseProjectPersistence.ts`, `app/api/personalization/project/route.ts`, `src/shared/personalization/DemoPersonalizeProvider.tsx` (the `loadProject` call site only), `src/shared/personalization/__tests__/projectPersistence.test.ts` (new) | `persistence` | 1 | `npx vitest run src/shared/personalization/__tests__/projectPersistence.test.ts` · `npx tsc --noEmit` · **no request may reach the server without an `id` or `list` param** |
| **P3-B** | **Layering Engineer** — close the z-index residuals so nothing paints over the Personalization Modal | `packages/studio/src/components/MotionControlStudio.jsx`, `src/apps/vfx-studio/**` | `ui` | 6 | `npx tsc --noEmit` · **no modal in the app may use a z-index ≥ 250 except the upgrade gate (`z-[300]`)** — `validate.sh P3-B` locks the scale, but **P3-B must also survey by hand** (grep `z-\[` and `zIndex:`) because the validator cannot see a bare `zIndex: 2000` far from its modal context. Toasters (`zIndex: 99999`) and dropdowns (`z-[80]`) are intentionally topmost — do **not** lower them. |
| **P3-C** | **Credit, Font & Capability Engineer** — the font decision, the OFL credit, the deterministic picker, and the SVG-id warning | `src/shared/personalization/templates/typography.ts`, `src/shared/personalization/templates/catalog.ts`, `src/shared/personalization/guided/StepPreviewApprove.tsx`, `src/shared/personalization/preview/presets.ts` (the font-picker block only), `src/shared/personalization/__tests__/noNetworkDuringBrandRender.test.ts`, `public/fonts/**` | `catalog` + `ui` | 2, 3, 4, 13 | `npx vitest run src/shared/personalization/templates src/shared/personalization/__tests__/noNetworkDuringBrandRender.test.ts` · `npx tsc --noEmit` · **a `FontFace.load` spy must assert zero font network requests** · **the SVG-id warning must render in the Step 4 UI** |
| **P3-D** | **Repo Hygiene Engineer** — untrack the build artefact and make the flaky test deterministic | `packages/studio/dist/**` (git untrack), `.gitignore`, `src/shared/personalization/__tests__/PersonalizationModal.test.tsx` (the flaky case only) | `hygiene` | 9, 10 | `git ls-files packages/studio/dist` → **0** · `npx vitest run src/shared/personalization/__tests__/PersonalizationModal.test.tsx` **× 5 consecutive runs, 0 flakes** · `npm run build:studio` still succeeds and `dist/` is produced but untracked |

**Wave 1 coordination notes**
- P3-C owns `presets.ts`; **P3-A must not touch `presets.ts`.** If P3-A needs it, it posts a
  `REQUEST` and the orchestrator sequences it after P3-C.
- P3-B and P3-D both touch `packages/studio` but different files (source vs `dist`).
- None of the four may run `npm run build`, `npm run build:packages`, `npm run test:unit` or
  `npx playwright test` — no build lock needed, none held.

### Wave 2 — 2 agents in parallel (after Wave 1 validates)

| ID | Role | Owns | Lane | Item(s) | Pre-registered validation |
|---|---|---|---|---|---|
| **P3-E** | **Export Matrix Engineer** — colour-compare **every** registered design in a real encoded MP4, not just `animated-headline` | `e2e/personalization-step4-remotion-export.spec.ts` (extend), `docs/phase3/EXPORT_MATRIX.md`, `docs/screenshots/phase-3/**` | `e2e` | 7 | `npx playwright test e2e/personalization-step4-remotion-export.spec.ts` → **19/19 designs encoded and pixel-compared**, each against a control render with the design removed |
| **P3-F** | **Studio Coverage Engineer** — give the remaining studios a provider mount and a trigger | `app/(brand-studio)/layout.tsx`, `app/brand-studio/**`, `app/academy/**`, `src/apps/vfx-studio/**` (the mount half only — the z-index half is P3-B's), `src/apps/thumbnail-studio/**`, `components/StandaloneShell.js` (additive only) | `provider` | 5 | `npx tsc --noEmit` · **every studio that renders a Personalize trigger must have exactly one `DemoPersonalizeProvider` ancestor** · a Playwright spec proving the trigger appears in the newly-wired studios |

**Wave 2 coordination notes**
- P3-E holds the build lock and the browser for its whole window; P3-F must not run a build.
- P3-B and P3-F both touch `src/apps/vfx-studio/**` — P3-B's z-index change lands in Wave 1, so
  by Wave 2 P3-F works on the same file with P3-B's change already in the tree. **This is an
  intentional serialisation, not a conflict**; P3-F must preserve P3-B's z-index edit.

### Wave 3 — 1 agent, alone (the test-debt sweep is the widest change)

| ID | Role | Owns | Item(s) | Pre-registered validation |
|---|---|---|---|---|
| **P3-G** | **Test Debt Sweeper** — make `npm run test:unit` a usable gate by fixing the 29 failing files / 36 tests | only the failing test files **and** the specific source modules they cover, one subsystem at a time, prioritised by customer impact. It may **not** touch** `src/shared/personalization/**` (owned by A/P3-C), `packages/studio/**`, or `src/apps/vfx-studio/**`. | 8 | `npm run test:unit` → **0 failures**, or every remaining failure **proven pre-existing at the pinned baseline** and listed. Each fixed test must have kept its original intent. |

**Why P3-G runs alone:** it is the only agent whose blast radius spans many subsystems, and it
must not race the personalization surface.

### Wave 4 — 1 agent, the only agent allowed to touch everything (the integrator)

| ID | Role | Owns | Deliverable |
|---|---|---|---|
| **P3-H** | **Integration, QA & Report Engineer** | everything (all lanes) | (a) an **independent review** of Waves 1–3, hunting for the class of defect A11 found in Phase 2 — weakened assertions, unwired registrations, unwired props, undeclared capabilities, import cycles; (b) fix whatever it finds; (c) rebase onto the then-current `origin/main`; (d) re-run the **full** matrix on the rebased tree; (e) `docs/REMOTION_PHASE_3_REPORT.md` with raw output; (f) the Phase 2 report's backlog marked item-by-item as closed / deferred / still-open |

---

## 5. Error handling, validation and QA

### 5.1 Failure taxonomy and recovery

| Code | Symptom | Detection | Recovery | Escalation |
|---|---|---|---|---|
| **E1** | Agent killed (host reboot, harness interrupt) | its handoff file is missing or stale | **audit the filesystem first** — the agent may have finished its file work. Recover from the files; do **not** re-dispatch. | If the files are absent, re-dispatch with the same prompt; the handoff file makes it resumable. |
| **E2** | Validation failure | the orchestrator's `validate.sh` exits non-zero for that agent | the agent fixes it **within its own files** | **2 strikes → stop.** The orchestrator picks a fallback (shrink scope, defer with a documented reason, or implement D-default differently). Never loop a third time. |
| **E3** | Lane conflict | a diff touches a file outside the agent's ledger row | the orchestrator's diff audit | the offending change is reverted and the item reassigned. |
| **E4** | Host degradation | load > 60 or free pages < 30 000 | the pre-flight check | **pause all suites**; re-run only after the host recovers. A suite result obtained under load is **discarded, not trusted**. |
| **E5** | Baseline drift | `git rev-list --count <pin>..origin/main` > 0 | the orchestrator's pre-wave fetch | the orchestrator rebases **once**, in Wave 4, and **re-runs the entire matrix** on the rebased tree. No agent rebases. |
| **E6** | A test fails only intermittently | two runs of the same scope disagree | re-run the scope **twice** | classify by the pre-existing-failure proof rule, not by assumption. |
| **E7** | A board post is rejected | the agent reports a `board_post` error | the agent retries with a **≤12-line** body | the handoff file is already written, so the agent is never lost. |

### 5.2 The pre-existing-failure proof rule (unchanged, and now enforced mechanically)

Any failure that is not the known one must be **proven** pre-existing, not asserted:

```
git stash push -u   →  re-run the failing scope at the pinned baseline  →  git stash pop
```
Both outputs are pasted into the handoff. A failure that does **not** reproduce at the baseline is
a **new defect** — it is reported, never "fixed by adjusting the expectation".

### 5.3 Validation is machine-checked, never self-declared

- Each agent's validation commands are **pre-registered** in `docs/phase3/OWNERSHIP.md` before
  the agent starts.
- `docs/phase3/validate.sh <AGENT-ID>` runs them and prints PASS/FAIL per check. **The
  orchestrator runs it.** An agent's claim of success in its handoff is never the evidence — the
  validator's output is.
- A check that is a **count or an invariant** (design count, z-index ceiling, zero tracked `dist`
  files, zero font network requests) is written as a script, not prose, so it cannot drift.

### 5.4 Quality-assurance gates (all must pass for Phase 3 to be called done)

| # | Gate | Enforcement |
|---|---|---|
| QA-1 | Typecheck clean | `npm run typecheck` exit 0 |
| QA-2 | App build succeeds | `npm run build` exit 0 |
| QA-3 | Package build succeeds | `npm run build:packages` exit 0 |
| QA-4 | Lint does not regress | `npx next lint` ≤ the Phase 2 baseline (1224 errors) |
| QA-5 | No new unit failures | `npm run test:unit` failures ≤ the Phase 2 set, each new one proven pre-existing |
| QA-6 | The 400 is gone | a real authenticated request carries a valid `id`/`list` param; the server logs no `MISSING_PROJECT_ID` |
| QA-7 | **19/19 designs export-compared** | each design's encoded frame differs from its control **only inside its box**, and carries its credit line |
| QA-8 | The modal is never occluded | no modal ≥ `z-[250]` except the upgrade gate |
| QA-9 | Zero network during render | the `FontFace.load` spy asserts zero font fetches |
| QA-10 | Every studio trigger has exactly one provider ancestor | a structural check over the studio render tree |
| QA-11 | Protected files untouched | `git diff origin/main -- netlify.toml package.json pnpm-lock.yaml .github/` is **empty** |
| QA-12 | `origin/main` untouched | `git ls-remote origin refs/heads/main` unchanged |
| QA-13 | No deploy | Netlify not triggered; no publish job run |
| QA-14 | The report is honest | every claim in `docs/REMOTION_PHASE_3_REPORT.md` has raw output behind it; unproven items are listed as unproven |

### 5.5 The QA pass that catches the Phase 2 failure class

P3-H is explicitly required to audit, **not just run tests**:

1. every assertion that was *weakened* rather than correctly updated;
2. every registry entry that is registered but never rendered;
3. every render prop that is passed but never supplied;
4. every capability claimed in `capabilities.notes` that is not enforced or tested;
5. every import that crosses a package boundary;
6. every new optional field that is **not** preserved by `normalizeLayer` / `normalizePreviewSettings`;
7. every licence or attribution obligation that is documented but not shipped.

---

## 6. Wave schedule and dependencies

```
Wave 0  Orchestrator gate .............. pin, host health, control plane, validator, roster
   │
Wave 1  P3-A  P3-B  P3-C  P3-D ......... parallel, disjoint files, no heavy commands
   │     └─ validate.sh per agent; 2 strikes → fallback
   │
Wave 2  P3-E (export matrix)  P3-F (studio coverage)   parallel
   │     P3-E holds the build lock + browser
   │
Wave 3  P3-G (test debt sweep) ......... alone, widest blast radius
   │
Wave 4  P3-H (integration + QA + report) ...... the only agent that touches everything
         └─ rebase onto current origin/main, then re-run the FULL matrix
```

**Critical path:** P3-C → P3-E → P3-H. Everything else is parallel slack.
**Longest pole:** P3-G (29 failing files) and P3-E (19 encoded exports).

---

## 7. Definition of done

Phase 3 is done only when all 11 in-scope items are closed, deferred-with-reason, or blocked-with-evidence;
QA-1…QA-14 all pass **on the rebased tree**; `docs/REMOTION_PHASE_3_REPORT.md` exists with raw
output behind every claim; the Phase 2 report's §13 backlog is marked item-by-item; a PR is open
with **no merge and no deploy**; and `origin/main`, `netlify.toml` and `.github/` are untouched.

---

## 8. What the owner must decide before Wave 1

D1–D4 in §2 have recommended defaults so the work is not blocked, and each agent will implement
the default and record it in `docs/phase3/DECISIONS.md` with its revert cost. **A different
preference should be stated before Wave 1 starts** — afterwards it is a one-file change per
decision, not a rework.

D5 requires no code change and no decision to unblock the work; it is recorded for the owner.
