# P3-G — Test Debt Sweeper (Wave 3, lane `hygiene`)

**Item 8.** `npm run test:unit` reports **29 failed test files / 36 failed tests** repo-wide. Make it
a usable gate.

## Why you run ALONE
You are the only agent whose blast radius spans many subsystems, and you must not race the
personalization surface. Wave 1 and Wave 2 must be complete and validated before you start.

## Files you own
The failing test files **and** the specific source modules they cover, one subsystem at a time.
You may **NOT** touch:
- `src/shared/personalization/**` (owned by P3-A / P3-C)
- `packages/studio/**` (owned by P3-B / P3-D)
- `src/apps/vfx-studio/**` (owned by P3-B / P3-F)

## THE 29 FAILING FILES (from `docs/REMOTION_PHASE_2_REPORT.md` §"Row 6", proven pre-existing at
the pinned baseline `84a9d1586`)

```
packages/Vibe-Workflow/packages/workflow-builder/src/components/NodeFlow.test.jsx
src/access/__tests__/preview-mode.test.tsx
src/access/__tests__/stripe-webhook-gates.test.ts
src/reseller/__tests__/webhook-reseller-branch.test.ts
src/server/__tests__/zz-stripe-webhook-entitlements.test.ts
src/shared/personalization/__tests__/DiscoveredAssets.test.tsx   <-- see note below
tests/api-key-sanitization.test.js
tests/api-keys-integration.test.js
tests/api/brand-route.test.ts
tests/api/brands-route.test.ts
tests/auth-pages.test.js
tests/byok-enforcement.vitest.test.ts
tests/demo-routing.test.js
tests/design-agent-routes.test.js
tests/go-ai-viral/list-row-thumbnail.test.tsx
tests/go-ai-viral/seedance.test.ts
tests/localInferenceAssets.test.js
tests/localInferencePaths.test.js
tests/localInferenceProgress.test.js
tests/muapi-key-route.test.js
tests/muapiKeyCrypto.test.js
tests/netlify/functions-entitlement.test.ts
tests/openai-key-route.test.js
tests/rate-limit.test.js
tests/studio-demo-map.test.js
tests/template-banner.test.js
tests/templateData.test.js
tests/wan2gpModelAvailability.test.js
tests/withRetry.test.js
```

**Failure-kind breakdown of the 36 failed tests:**

| count | kind |
|---:|---|
| 24 | `AssertionError` (access / stripe-webhook / reseller / byok source-scan) |
| 16 | `Error: No test suite found in file …` — **Jest-style files collected by vitest** |
| 3 | `ReferenceError: document is not defined` |
| 3 | `TestingLibraryElementError: Unable to find an element with the text: …` |
| 2 | `Error: This module cannot be imported from a Client Component module.` |
| 1 | `Error: Expected a semicolon` |
| 1 | `Error: A React Element from an older version of React was rendered.` |

Note on `DiscoveredAssets.test.tsx`: it is inside `src/shared/personalization/**`, which you do NOT
own. It is the long-standing known pre-existing failure
(`imports selected person assets into identities`). **Report it; do not fix it.**

Note on `packages/Vibe-Workflow/...`: that is a **git submodule** (`packages/Vibe-Workflow` and
`packages/Open-Poe-AI` are gitlinks) and is not checked out in this worktree. A failing file inside
an uninitialised submodule cannot be fixed from here — **report it as an external blocker with the
proof** (`git submodule status`, the file's absence) rather than attempting a fix. It is also
outside your ownership.

**Hypothesis worth testing first (do not assume it):** a large share of the "failures" may be
**misconfiguration rather than product defects** — e.g. Jest-style test files (`describe`/`it` from
`@jest/globals` vs vitest globals), a vitest `environment` that is `node` where a test needs
`jsdom`, or a `test.include` glob that collects files that are not vitest tests at all. Read
`vitest.config.*` and the `npm run test:unit` script first and establish the **real** cause per
file. Fixing the *configuration* is a legitimate fix when the test's intent is preserved; changing
a test's expectations to match broken behaviour is **not**.

## Non-negotiable rules
- **Do NOT delete a test.**
- **Do NOT weaken an assertion** to obtain a passing result.
- **Do NOT hide a failure** — no `.skip`, no `it.only` left behind, no `try/catch` that swallows the
  error, no `expect(true)`, no commented-out block, no widening a tolerance to hide a real defect.
- **Fix the underlying defect** instead of changing the expectation.
- If a test's expectation is genuinely wrong (it asserts behaviour the product never had and the
  product's contract says otherwise), then **update it to the correct contract** and **state the
  reason explicitly in the handoff** — that is correcting the test, not weakening it. Every such
  change must be listed one by one.
- If a test cannot be fixed without touching a file you do not own, **post a REQUEST on the board**
  and move to the next file. Do not edit it.

## The pre-existing-failure proof rule — ADAPTED for Wave 3
In Wave 1 it was **suspended** because the tree was shared. In Wave 3 you run alone, so the
original rule applies — but note that the **baseline** for the Phase 2 proof was `84a9d1586` and the
current pin is `ef13ab9bc`, and your tree now carries Phase 3 changes:
```
git stash push -u   →  re-run the failing scope at the pinned baseline  →  git stash pop
```
Paste **both** outputs into the handoff. A failure that does **not** reproduce at the baseline is a
**new defect** — report it, never "fix it by adjusting the expectation".
**You are the only agent running in Wave 3, so `git stash` is safe for you — but only for you.**
Confirm no other agent is active (board read) before stashing.

## Host health gate — run before any suite
```
uptime                                   # load1 < 40
vm_stat | grep -E 'Pages (free|inactive)' # available > 1.5 GiB
```
If the gate fails, **delay and report it**. A suite result obtained under load is **discarded, not
trusted** — Phase 1 measured a *different* 2–4 failures per run at load 161–189, including whole
files failing to collect with no assertion. **Re-run any failing scope twice before changing code.**

## Build lock
You run alone, so you may hold the build lock yourself for `npm run test:unit`. Write your agent id
into `docs/phase3/BUILD_LOCK`, and reset it to `FREE` when done. **Do not commit, push, merge, or
deploy.**

## Validation
```
npm run test:unit
```
→ **0 failures**, or every remaining failure **proven pre-existing at the pinned baseline** and
listed individually with the proof. Each fixed test must have **kept its original intent**.

## Deliverables
1. **`docs/phase3/handoffs/P3-G.md`** — follow `docs/phase2/handoffs/TEMPLATE.md`. Paste **raw**
   output: the before/after `npm run test:unit` summaries, the per-file root cause, the proof runs
   for anything left failing, and a one-by-one list of every expectation you corrected (with the
   reason).
2. **A board post** — `board_post`, `to: "ALL"`, `type: "RESULT"`, body **at most 12 short lines**.

## Report back
The before/after failure counts, the per-file root cause, the list of corrected expectations with
reasons, and every remaining failure with its pre-existing proof or external blocker.
