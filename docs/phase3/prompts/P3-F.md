# P3-F — Studio Coverage Engineer (Wave 2, lane `provider`)

**Item 5.** The Personalize trigger silently disappears for any studio rendered outside
`components/StandaloneShell.js`. Give the remaining studios a provider mount and a trigger.

## Files you own EXCLUSIVELY
- `app/(brand-studio)/**`
- `app/academy/**`
- `app/vfx/**`
- `src/apps/vfx-studio/**` — **the provider-mount half only** (the z-index half belongs to P3-B and
  **must be preserved**; it already landed, do not revert it)
- `src/apps/thumbnail-studio/**`
- `components/StandaloneShell.js` — **additive only**
- `e2e/**` — only for the new coverage spec; you do **not** own `e2e/personalization-step4-remotion-export.spec.ts`
  (that is P3-E's) and must not edit it

Do not edit any other file. If you need one, post a board message `type: "ASK"`, `to: "ALL"`.

## Context you must read
- `docs/phase3/EXECUTION_PLAN.md` (§1 item 5, §4 Wave 2 table)
- `docs/phase3/OWNERSHIP.md`
- `docs/phase3/VERIFICATION_SPEC.md`
- `docs/phase3/WAVE1_AUDIT.md`
- `docs/phase3/validate.sh` (the P3-F case)
- `docs/phase2/handoffs/A9.md` and `docs/phase2/handoffs/A11.md` — the established pattern

## The established pattern (do not invent a new one)
Nine studios were wired in Phase 2 through a **render prop**, so the studio package never imports
across the package boundary:
- each studio component in `packages/studio/src/components/**` accepts an optional
  `renderPersonalizeAction` prop and renders it next to its media chip;
- `components/StandaloneShell.js` imports `PersonalizeVideoAction` from
  `@/components/PersonalizeVideoAction` and injects it at each studio call site
  (lines ~710–732), using three visual variants:
  `renderPersonalizeAction` / `renderPersonalizeActionVideo` / `renderPersonalizeActionOverlay`;
- `components/PersonalizeVideoAction.js` renders `PersonalizeStep` from
  `@/shared/personalization/studioEntry`.

The provider (`DemoPersonalizeProvider`) is currently mounted only in:
`app/demo/page.tsx`, `app/demo/[slug]/page.tsx`, `app/personalization-demo/page.tsx`,
`components/landing/LandingPage.js`, `components/StandaloneShell.js`.

## The five studios that are missing
Route groups confirmed to exist:
- `app/(brand-studio)/brand-studio/**` — **Brand Studio**
- `app/(brand-studio)/photo-studio/**` — **Photo Studio**
- `app/academy/**` — **Academy**
- `app/vfx/**` (+ `src/apps/vfx-studio/**`) — **VFX Studio**
- `src/apps/thumbnail-studio/**` — **Thumbnail Studio**

**Verify the exact route structure yourself** (the route group `(brand-studio)` holds a `layout.tsx`
at `app/(brand-studio)/layout.tsx` — check what that layout already provides before adding another
provider mount; a **second** `DemoPersonalizeProvider` ancestor is a defect, not a feature).

## The contract
- **Every studio that renders a Personalize trigger must have exactly ONE `DemoPersonalizeProvider`
  ancestor.** Exactly one — not zero, not two. A nested second provider breaks context.
- The trigger must actually appear and work in each of the five studios.
- Do not change the visual design of any studio beyond adding the trigger, and use the **existing**
  `PERSONALIZE_TRIGGER_CLASS` / `..._VIDEO` / `..._OVERLAY` variants so the new triggers match the
  nine existing ones exactly.
- Do not introduce a **cross-package import**: `packages/studio/**` must not import from the app
  root. The studio package's published entry is `src/index.js` and it ships `src/` — an import of
  `@/...` there would break the published tarball. The app root injects the component; the package
  only accepts the render prop.
- Preserve P3-B's z-index edits in `src/apps/vfx-studio/**` exactly.

## Validation
```
npx tsc --noEmit
```
plus a **structural check** (write it as a script, not prose — it is an invariant) proving that every
studio rendering a Personalize trigger has exactly one `DemoPersonalizeProvider` ancestor, and a
**Playwright spec** proving the trigger appears in the newly-wired studios. Put the Playwright spec
at `e2e/personalization-studio-triggers.spec.ts` (new — you own it).

## Build lock and browser
- **P3-E holds the build lock and the browser for the whole of Wave 2.** You must **NOT** run
  `npm run build`, `npm run build:packages`, `npm run build:studio`, `npm run test:unit`, or
  `npx playwright test` while P3-E is in its window. If you need the browser, coordinate on the
  board with P3-E and the orchestrator, and **never** kill a server you did not start.
- One dev server per worktree. Check `lsof -ti :3111` before starting one.

## Host health gate
```
uptime                                   # load1 < 40
vm_stat | grep -E 'Pages (free|inactive)' # available > 1.5 GiB
```
If the gate fails, delay and report it. A result obtained under load is discarded, not trusted.

## CRITICAL SAFETY RULE
The working tree is **shared with other agents**. **NEVER** run `git stash`, `git checkout`,
`git reset`, `git clean`, or `git restore`. Only `git status`, `git diff`, `git show`,
`git ls-files` are allowed. **Do not commit, push, merge, or deploy.**

## Deliverables
1. **`docs/phase3/handoffs/P3-F.md`** — follow `docs/phase2/handoffs/TEMPLATE.md`. Paste **raw**
   command output: the structural check output, the tsc output, and the Playwright run output.
2. **A board post** — `board_post`, `to: "ALL"`, `type: "RESULT"`, body **at most 12 short lines**.

## Report back
The five studios and the exact file/route where each provider mount and trigger landed, the
exactly-one-ancestor check output, the tsc result, and the Playwright result.
