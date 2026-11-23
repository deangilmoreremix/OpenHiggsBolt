# P3-D — Repo Hygiene Engineer — handoff (Wave 1)

**Agent:** P3-D · **Lane:** `hygiene` · **Items:** 9, 10 · **Decision:** D4
**Branch:** `feature/remotion-personalization-phase-2` @ pin `ef13ab9bc` · **Committed:** no (working tree)
**Dispatch note:** dispatched twice; both sessions were killed by a model-usage cap before writing
their handoff. The **file work was complete** — this handoff was written by the orchestrator after
auditing the tree and running the pre-registered validation.

## Files changed (ownership ledger row only)

| File | Change |
|---|---|
| `.gitignore` | +6 — explicit `packages/studio/dist/` rule (comment explains why: it went stale once in Phase 1) |
| `packages/studio/dist/**` (29 files) | removed from the git index (`git rm --cached`) — the working-tree files are left in place so the build can still produce them |
| `src/shared/personalization/__tests__/PersonalizationModal.test.tsx` | the three fixed-sleep races replaced with a bounded deterministic wait |

**No other file touched.** No commit, no rebase, no deploy.

## Item 10 — the tracked build artefact (D4)

`packages/studio/dist` was 29 git-tracked **build output** — a source-controlled build product that
had already gone stale once (Phase 1 changed `packages/studio/src/components/VideoStudio.jsx` and the
committed `dist` kept the old cross-package import). It is now untracked, with an explicit ignore rule
so a future `npm run build:studio` output is ignored rather than re-committed.

Raw evidence:

```
$ git ls-files packages/studio/dist | wc -l
0

$ git status --short packages/studio/dist | head -3
D  packages/studio/dist/components/AgentStudio.js
D  packages/studio/dist/components/AiInfluencerStudio.js
D  packages/studio/dist/components/AudioStudio.js

$ grep -n "packages/studio/dist" .gitignore
19:packages/studio/dist/
```

The deletions are **staged index removals only** — the files themselves are untouched on disk, so
`npm run build:studio` still produces a working `dist/`.

**Note (revert cost: one git operation).** The generic `dist` rule at `.gitignore:14` already
matched this path; the new rule is explicit and commented, which is why it was added rather than
relying on the generic one. If the owner prefers the build output to stay tracked, `git add -f
packages/studio/dist` restores it.

## Item 9 — the retry-button flake

### Root cause
Three assertions in this file waited for an async-settled DOM with a **fixed sleep**:

```js
await act(async () => { await new Promise((r) => setTimeout(r, 100)) })   // business-research retry
await act(async () => { await new Promise((r) => setTimeout(r, 50)) })    // thumb-upload retry
await act(async () => { await new Promise((r) => setTimeout(r, 50)) })    // find-business results
```

A fixed sleep is a race: the sleep expires and the assertion runs **before** the provider's async
chain (mock fetch → awaited state update → React re-render) has settled. The window is wide on a
loaded host — this machine ran at load1 194–330 during the phase — so the file flaked
intermittently while the feature was correct. The business-research case is the one recorded as
item 9; the other two share the identical defect and were fixed together.

### The fix (race removed, assertions untouched)
A bounded, deterministic wait helper was added to the file:

```js
async function waitForElement(
  query: () => HTMLElement | null,
  description: string,
  timeoutMs = 5000,
): Promise<HTMLElement> {
  const deadline = Date.now() + timeoutMs
  for (;;) {
    const found = query()
    if (found) return found
    if (Date.now() > deadline) {
      throw new Error(`waitForElement: "${description}" never appeared within ${timeoutMs}ms`)
    }
    await act(async () => { await new Promise((r) => setTimeout(r, 10)) })
  }
}
```

Each of the three sites now waits for the settled state **using the same query the assertion uses**,
so the wait and the assertion cannot drift apart, and the original assertion still runs unchanged:

| Site | Before | After |
|---|---|---|
| business-research retry | `sleep(100)` → `expect(screen.getByText('Research failed: Server error')).toBeTruthy()` | `waitForElement(() => screen.queryByText('Research failed: Server error'), …)` → **same assertion unchanged** |
| thumb-upload retry | `sleep(50)` → `expect(screen.getAllByText('Retry').length).toBeGreaterThanOrEqual(1)` | `waitForElement(() => screen.queryAllByText('Retry')[0] ?? null, …)` → **same assertion unchanged** |
| find-business results | `sleep(50)` → `expect(screen.getByText('Sunset Realty')).toBeTruthy()` | `waitForElement(() => screen.queryByText('Sunset Realty'), …)` → **same assertion unchanged** |

**Not done, deliberately:** no test was deleted, no assertion was weakened, no expected string was
changed, no tolerance was widened, no `.skip`/`.only` was introduced, and no failure was swallowed.
The three assertions are byte-identical to the originals; only the *wait* changed — from "hope 100 ms
is enough" to "wait until it is, or fail loudly with a diagnostic naming what never appeared".

The wait is also **faster** in the common case: it exits on the first 10 ms tick in which the state
has settled, instead of always paying the full sleep.

### Raw validation — 5 consecutive runs, all clean

```
run 1:  Test Files  1 passed (1)      Tests  12 passed (12)
run 2:  Test Files  1 passed (1)      Tests  12 passed (12)     Duration 48.02s
run 3:  Test Files  1 passed (1)      Tests  12 passed (12)     Duration 20.34s
run 4:  Test Files  1 passed (1)      Tests  12 passed (12)     Duration 25.43s
run 5:  Test Files  1 passed (1)      Tests  12 passed (12)     Duration 37.53s
```

Host load during runs 2–5: load1 194 → 31 → 32 → 194. The runs at load1 194 (runs 2 and 4) are the
meaningful ones: **the flake reproduced under exactly the load that used to cause it, and no longer
does.**

### Orchestrator validation

```
$ docs/phase3/validate.sh P3-D
== P3-D Hygiene ==
  PASS  packages/studio/dist untracked
  PASS  PersonalizationModal.test.tsx: 5/5 consecutive clean runs

P3-D: ALL CHECKS PASSED
```

## Residuals

- **`npm run build:studio` was NOT run by P3-D** — the build lock is held by the orchestrator for all
  of Wave 1. The orchestrator runs it after Wave 1 and records the raw output, confirming that
  `dist/` is still produced and that it is untracked. This is the one item of P3-D's pre-registered
  validation still owed, and it is an orchestrator obligation, not a P3-D defect.
- No pre-existing-failure proof was needed: no scope failed.
- `git status` (verified lane-clean):

```
 M .gitignore                                     (P3-D)
 M app/api/personalization/project/route.ts       (P3-A)
 M packages/studio/src/components/MotionControlStudio.jsx  (P3-B)
 M src/apps/vfx-studio/components/ImageUrlModal.tsx       (P3-B)
 M src/apps/vfx-studio/pages/VFXGenerate.tsx              (P3-B)
 M src/shared/personalization/supabaseProjectPersistence.ts (P3-A)
 M src/shared/personalization/templates/typography.ts        (P3-C)
 M src/shared/personalization/__tests__/PersonalizationModal.test.tsx (P3-D)
```
