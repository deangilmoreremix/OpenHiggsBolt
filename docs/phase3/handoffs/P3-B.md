# P3-B — Layering Engineer — handoff (Wave 1)

**Agent:** P3-B · **Lane:** `ui` · **Item:** 6
**Branch:** `feature/remotion-personalization-phase-2` @ pin `ef13ab9bc` · **Committed:** no (working tree)
**Dispatch note:** dispatched three times; every session was killed by a model-usage cap before
writing a handoff. The file work was complete — this handoff was written by the orchestrator after
auditing the tree and running the pre-registered validation.

## Files changed (ownership ledger row only)

| File | Change |
|---|---|
| `packages/studio/src/components/MotionControlStudio.jsx` | `z-[300]` → `z-[240]` (fullscreen media modal) |
| `src/apps/vfx-studio/components/ImageUrlModal.tsx` | `zIndex: 1000` → `240` |
| `src/apps/vfx-studio/pages/VFXGenerate.tsx` | `zIndex: 2000` → `240` |
| `packages/studio/src/components/__tests__/studioLayering.test.jsx` | NEW — the regression guard, rewritten with a wider detector + non-vacuity proofs |

**No other file touched.** No commit, no rebase, no deploy. **Only z-index values were changed** —
no DOM structure, layout, positioning, prop or behaviour change in any component.

## 1. The rule

The **Personalization Modal** (`src/shared/personalization/PersonalizationModal.tsx:1451`,
`fixed inset-0 z-[250]`) is the reference layer. No other modal-shaped overlay may sit at or above
250. Exactly two layers are allowed above/at it, and only at their exact values:

- the **upgrade gate** — `src/access/UpgradeModal.tsx:77`, `fixed inset-0 z-[300]` (allowed by design);
- the **Personalization Modal** itself, at exactly 250.

Two tiers are **intentionally topmost** and were NOT lowered:
- **toasts** — `zIndex: 99999` in 9 studio components;
- **dropdowns** — `z-[80]` in `packages/studio/src/components/UniversalMediaUploader.jsx:327`.

## 2. The full inventory — every layer ≥ 250 in the whole app

Command (whole app, not just the studios):
```
grep -rnE "z-\[[0-9]{2,4}\]|zIndex: *['\"]?[0-9]{2,5}" src app components packages/studio/src \
  | grep -vE "node_modules|/\.next/|/dist/" \
  | grep -E "z-\[(2[5-9][0-9]|[3-9][0-9]{2})\]|zIndex: *['\"]?(2[5-9][0-9]|[3-9][0-9]{3})" | sort
```

| # | File:line | Value | Classification | Action |
|---|---|---|---|---|
| 1 | `packages/studio/src/components/AiInfluencerStudio.jsx:588` | `zIndex: 99999` | toast container | **LEFT** (intentionally topmost) |
| 2 | `packages/studio/src/components/CinemaStudio.jsx:842` | `zIndex: 99999` | toast container | **LEFT** |
| 3 | `packages/studio/src/components/ClippingStudio.jsx:529` | `zIndex: 99999` | toast container | **LEFT** |
| 4 | `packages/studio/src/components/MarketingStudio.jsx:509` | `zIndex: 99999` | toast container | **LEFT** |
| 5 | `packages/studio/src/components/RecastStudio.jsx:749` | `zIndex: 99999` | toast container | **LEFT** |
| 6 | `packages/studio/src/components/VibeMotionStudio.jsx:362` | `zIndex: 99999` | toast container | **LEFT** |
| 7 | `packages/studio/src/components/VideoStudio.jsx:3176` | `zIndex: 99999` | toast container | **LEFT** |
| 8 | `packages/studio/src/components/VideoStudioParity.jsx:635` | `zIndex: 99999` | toast container | **LEFT** |
| 9 | `src/access/UpgradeModal.tsx:77` | `z-[300]` | **upgrade gate** | **LEFT** (the one allowed exception) |
| 10 | `src/shared/personalization/PersonalizationModal.tsx:1451` | `z-[250]` | **the reference modal itself** | **LEFT** |

**That is the complete list.** There is no other layer ≥ 250 anywhere in `src/`, `app/`,
`components/` or `packages/studio/src/`.

A second, paranoid sweep was run to catch forms the first pattern can miss — any digit count in
`z-[…]`, any `zIndex` value ≥ 100, and the `zIndex : N` spacing variant:

```
$ grep -rnoE "zIndex: *['\"]?[0-9]+" src app components packages/studio/src \
    | awk -F'zIndex: *' '{v=$2; gsub(/[^0-9]/,"",v); if (v+0>=100) print}' | sort -u
packages/studio/src/components/AiInfluencerStudio.jsx:588:zIndex: 99999
packages/studio/src/components/CinemaStudio.jsx:842:zIndex: 99999
packages/studio/src/components/ClippingStudio.jsx:529:zIndex: 99999
packages/studio/src/components/MarketingStudio.jsx:509:zIndex: 99999
packages/studio/src/components/RecastStudio.jsx:200:zIndex: 100
packages/studio/src/components/RecastStudio.jsx:749:zIndex: 99999
packages/studio/src/components/VibeMotionStudio.jsx:362:zIndex: 99999
packages/studio/src/components/VideoStudio.jsx:3176:zIndex: 99999
packages/studio/src/components/VideoStudioParity.jsx:635:zIndex: 99999
src/apps/vfx-studio/components/BottomInputBar.tsx:252:zIndex: 100
src/apps/vfx-studio/components/ImageUrlModal.tsx:33:zIndex: 240
src/apps/vfx-studio/pages/VFXGenerate.tsx:462:zIndex: 240

$ grep -rnE "zIndex *: *[0-9]{3,}" src app components packages/studio/src | grep -vE "zIndex: *(240|99999|100)"
(none — no spacing variants)
```

`zIndex: 100` (`RecastStudio.jsx:200`, `BottomInputBar.tsx:252`) are inline input-bar layers, far
below the ceiling. The two `240`s are the fixes.

For completeness, every **modal-shaped** layer in the app is now at or below the ceiling:
`z-[240]` (MotionControlStudio, ImageUrlModal, VFXGenerate), `z-[200]` (ApiKeyModal,
VibeMotionStudio, and the three `fixed top-4` banners), `z-[120]` (DrawModal.js, ImageEditorModal),
`z-[110]` (VideoCreateTargetPicker), `z-[100]` (Cinema, DrawModal, ImageStudio, LipSync,
Marketing, Recast, VideoStudio, VideoStudioParity, WorkflowStudio, DemoPromptModal,
StandaloneShell drop-zone). The `z-[80]` dropdown stays. **Nothing was raised.**

## 3. The regression guard — and the two defects in the first version of it

The first version of `studioLayering.test.jsx` had two defects, both found and fixed:

**(a) The detector was too narrow.** `looksLikeModal()` matched only the Tailwind class
`fixed inset-0`, so it **missed the vfx-studio modals entirely** — they are written as inline style
objects (`position: 'fixed'`), which is exactly the form the audit flagged. The detector now
matches `fixed inset-0`, `fixed inset…`, `position: 'fixed'` (quoted or not), `inset: 0`, `inset-0`,
and the four-value `top-0 left-0 right-0 bottom-0`.

**(b) The scan resolved to the wrong root, so the "no offenders" test passed *vacuously*.**
`import.meta.dirname` is `<repo>/packages/studio/src/components/__tests__`; `../../../../` lands in
`<repo>/packages`, so every scan directory did not exist, the scan collected **zero** files, and the
guard reported "no offenders" for a tree it had never read. Fixed to `../../../../..`, and — more
importantly — the test now **proves it is not vacuous**:

- `scans a real tree — the ceiling check is not vacuous` asserts the scan collected **> 100 files**
  and that it really reached `packages/studio/src/components/MotionControlStudio.jsx`,
  `src/shared/personalization/PersonalizationModal.tsx`, `src/access/UpgradeModal.tsx` and
  `src/apps/vfx-studio/**`;
- `finds the two allowed layers and does not count them as offenders` asserts the scan actually sees
  the `z-[250]` reference and the `z-[300]` upgrade gate, so "no offenders" cannot mean "saw nothing".

### The guard provably bites

Not only synthetic sources — a **real regression** in the real tree:

```
$ sed -i '' 's/fixed inset-0 z-\[240\]/fixed inset-0 z-[300]/' packages/studio/src/components/MotionControlStudio.jsx
$ npx vitest run packages/studio/src/components/__tests__/studioLayering.test.jsx --maxWorkers=1 --reporter=dot

 FAIL  .../studioLayering.test.jsx > z-index ceiling — ... > has zero modal offenders at z >= 250 ...
Error: Unexpected high-z modals:
  packages/studio/src/components/MotionControlStudio.jsx:1467  z=300  className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"

 Test Files  1 failed (1)
      Tests  1 failed | 9 passed (10)

$ grep -n "z-\[240\]" packages/studio/src/components/MotionControlStudio.jsx
1467:  className="fixed inset-0 z-[240] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
```

The file was restored to `z-[240]` immediately afterwards (the `cp /tmp/mcs.bak` restore is visible
in the same transcript).

Synthetic-source proofs also run in the test: an inline-style modal at `zIndex: 2000` → 1 offender;
a Tailwind modal at `z-[300]` that is not the upgrade gate → 1 offender; the four-value inset form at
`z-[400]` → 1 offender; the upgrade gate at `z-[300]` → 0; the Personalization Modal at `z-[250]` → 0
but at `z-[400]` → 1.

### The 10 tests
1. scans a real tree — the ceiling check is not vacuous
2. has zero modal offenders at z >= 250 across the whole app tree
3. finds the two allowed layers and does not count them as offenders
4. detects a synthetic inline-style modal at zIndex 2000
5. detects a synthetic Tailwind modal at z-[300] that is not the upgrade gate
6. detects the four-value inset form (top-0 left-0 right-0 bottom-0)
7. allows the upgrade gate at z-[300]
8. allows the Personalization Modal at exactly z-[250] but not above it
9. does not lower toast containers (zIndex: 99999 must remain above all modals)
10. does not lower the UniversalMediaUploader dropdown (z-[80] must remain)

## 4. Raw validation — 5 consecutive runs, all identical

```
run 1:  Tests  10 passed (10)
run 2:  Tests  10 passed (10)
run 3:  Tests  10 passed (10)
run 4:  Tests  10 passed (10)
run 5:  Tests  10 passed (10)
```

```
$ docs/phase3/validate.sh P3-B
== P3-B Layering (modals only; toasts/dropdowns may legitimately be topmost) ==
  PASS  studioLayering.test.jsx: no modal at/above z-250 outside the allowed layers
  PASS  no shipped modal layer at/above z-250 (upgrade gate + Personalization Modal excluded)

P3-B: ALL CHECKS PASSED
```

**The validator was also corrected** (orchestrator-owned file). The previous P3-B case scanned only
three directories and, once widened to the whole app, matched the *synthetic strings inside the test
file* and the Personalization Modal's own reference value — it reported failures on code that was
correct. The case now (a) runs the regression test as the authoritative check and (b) runs an
independent script-level cross-check that excludes test files, `__tests__`, the upgrade gate, the
Personalization Modal, toasts and dropdowns.

## 5. Residuals

- **None.** Every layer ≥ 250 in the app is accounted for in the inventory above; the only two
  allowed ones are the upgrade gate and the reference modal itself.
- The toast tier (`99999`) and the dropdown tier (`z-[80]`) are explicitly asserted by tests 9 and
  10, so a future change that lowers them fails the suite — the user's "without breaking toast or
  dropdown behavior" requirement is enforced, not just intended.
- No pre-existing-failure proof was needed: no scope failed.
