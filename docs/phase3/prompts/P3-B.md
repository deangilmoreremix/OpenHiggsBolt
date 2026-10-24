# P3-B — Layering Engineer (Wave 1, lane `ui`)

**Item 6.** Close the z-index residuals so nothing paints over the Personalization Modal (`z-[250]`).

## ALREADY DONE (do NOT redo — verify and build on it)

| File | Change already landed |
|---|---|
| `packages/studio/src/components/MotionControlStudio.jsx` | `z-[300]` → `z-[240]` |
| `src/apps/vfx-studio/components/ImageUrlModal.tsx` | `zIndex: 1000` → `240` |
| `src/apps/vfx-studio/pages/VFXGenerate.tsx` | `zIndex: 2000` → `240` |
| `packages/studio/src/components/__tests__/studioLayering.test.jsx` | NEW — a regression guard, but its detector is too narrow (see below) |

`docs/phase3/WAVE1_AUDIT.md` §2.2 records the defect that remains.

## Files you own EXCLUSIVELY
- `packages/studio/src/components/MotionControlStudio.jsx`
- `src/apps/vfx-studio/**`
- `src/apps/**` — **modal z-index values only** (the hand survey spans every studio)
- `packages/studio/src/components/__tests__/studioLayering.test.jsx`

Do not edit any other file. If you need one, post a board message `type: "ASK"`, `to: "ALL"`.

## Context you must read
`docs/phase3/EXECUTION_PLAN.md` (§1 item 6, §4 Wave 1) · `docs/phase3/OWNERSHIP.md` ·
`docs/phase3/VERIFICATION_SPEC.md` · `docs/phase3/DECISIONS.md` · `docs/phase3/WAVE1_AUDIT.md`
(§0, the P3-B row of §1, **§2.2**, §3, §4, §5) · `docs/phase3/validate.sh` (the P3-B case).

## THE DEFECT YOU MUST FIX (audit §2.2)
`docs/phase3/validate.sh P3-B` only scanned three directories. The **hand survey** must cover the
**whole app**: `src/**`, `app/**`, `components/**`, `packages/studio/src/**`. The plan requires this
because the validator cannot see a bare `zIndex: 2000` far from its modal context.

The landed test's `looksLikeModal()` only matches `fixed inset-0` (a Tailwind class). It therefore
**misses**:
- `position: 'fixed'` written as an inline style object — exactly how the vfx-studio modals are written;
- `inset: 0` written as a style-object key;
- `top-0 left-0 right-0 bottom-0` (the four-value form);
- a `position: fixed` container whose `zIndex` sits on a *child* element.

## Hard constraints — do not break existing behaviour
- **Toasters (`zIndex: 99999`) are intentionally topmost — DO NOT lower them.**
- **Dropdowns (`z-[80]` in `packages/studio/src/components/UniversalMediaUploader.jsx`) are
  intentionally topmost — DO NOT lower them.**
- The **upgrade gate** (`z-[300]`) is the single allowed modal at ≥ 250 — locate it, confirm it is the
  upgrade gate, and **do not lower it**.
- Modals must end up **strictly below 250**. The landed convention is `240`; keep each file's own
  convention (inline `zIndex: N` → `240`; Tailwind `z-[N]` → `z-[240]`).
- **Only change z-index values.** Do not change DOM structure, layout, positioning, props, or
  behaviour. The user's explicit requirement: *fix modal layering without breaking toast or dropdown
  behavior.*
- Non-modal layers (sticky headers, side panels, menus, badges) stay exactly as they are unless they
  are a full-screen modal-shaped overlay that would occlude the Personalization Modal.
- Do not **raise** anything.

## Method — evidence, not guesswork
1. Inventory: `grep -rnE "z-\[[0-9]{2,4}\]|zIndex: *['\"]?[0-9]{2,5}" src app components packages/studio/src`
   — collect **every** layer ≥ 250.
2. For each hit, read ±10 lines and classify: modal-shaped overlay · toast · dropdown · upgrade gate ·
   sticky chrome · other. **Record the decision for EVERY hit** in the handoff as a table, including
   the ones you deliberately left alone. A hit you do not classify is a miss.
3. Lower only the modal-shaped ones to < 250.
4. Re-run the inventory and show that the only remaining layers ≥ 250 are the upgrade gate, toasts and
   dropdowns.

## Test — `packages/studio/src/components/__tests__/studioLayering.test.jsx`
Extend it so it:
- scans the **whole app tree** (`src/**`, `app/**`, `components/**`, `packages/studio/src/**`),
  skipping `node_modules`, `dist`, `.next`;
- detects inline `position: 'fixed'` modals, style-object `inset: 0`, the four-value
  `top-0 left-0 right-0 bottom-0` form, and Tailwind `z-[N]`;
- still asserts toasts keep `zIndex: 99999` and the dropdown keeps `z-[80]`;
- asserts the upgrade gate still exists at `z-[300]`.

**Prove the guard bites:** export the detector helper and unit-test it against a **synthetic** source
string containing `zIndex: 2000` next to `position: 'fixed'`, and a `z-[300]` modal that is *not* the
upgrade gate. A detector that cannot fail is worthless.

## Validation (scoped only)
```
npx vitest run packages/studio/src/components/__tests__/studioLayering.test.jsx --maxWorkers=1 --reporter=dot
```
Run it **5 consecutive times** and show the output is identical every time.

**Do NOT run** `npm run build`, `build:packages`, `build:studio`, `test:unit`, `playwright` — the
build lock is held by the orchestrator for all of Wave 1. **Do NOT run `npx tsc --noEmit`** — the
orchestrator runs it centrally. If something fails twice, stop and report the blocker with a
proposed fallback instead of looping.

**Host note:** this host has been heavily loaded (load1 206 at one point). A failure that vanishes on
a re-run is host noise — re-run before changing code, and never weaken an assertion because of a
failure you could not reproduce.

## CRITICAL SAFETY RULE
The working tree is **shared with other agents**. **NEVER** run `git stash`, `git checkout`,
`git reset`, `git clean`, `git restore` — the pre-existing-failure proof rule is **suspended** for
Wave 1 (prove read-only with `git show ef13ab9bc:<path>` and record that method). Only `git status`,
`git diff`, `git show`, `git ls-files` are allowed. **Do not commit, push, merge, or deploy.**

## Deliverables
1. **`docs/phase3/handoffs/P3-B.md`** — follow `docs/phase2/handoffs/TEMPLATE.md` (read it). Paste
   **raw** command output, never a summary. Must include the **full z-index inventory table with a
   decision for every hit ≥ 250**, the raw grep output, and the raw 5× test output.
2. **A board post** — `board_post`, `to: "ALL"`, `type: "RESULT"`, body **at most 12 short lines**.

## Report back
The full inventory (file:line → value → classification → action), the files you changed, the raw
test output, and any layer you deliberately left above 250 with your justification.
