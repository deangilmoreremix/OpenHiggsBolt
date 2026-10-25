# P3-F — Studio Coverage Engineer (Wave 2, lane `provider`)

**Agent:** P3-F
**Wave:** 2
**Status:** ⚠️ partial → structural check + typecheck GREEN; Playwright runtime run HELD (see
"Open questions / blockers" — stale 3111 build + host-load gate)
**Lane used:** `provider`
**Files changed:**

| File | Change |
|---|---|
| `app/(brand-studio)/layout.tsx` | **NEW provider mount** — `DemoPersonalizeProvider` mounted ONCE around the route content (wraps `{children}` in `<main>`). This is the exactly-one ancestor for every studio inside the `(brand-studio)` group. Import added: `{ DemoPersonalizeProvider } from '@/shared/personalization'` (the same import `components/landing/LandingPage.js` uses). |
| `app/(brand-studio)/brand/[id]/page.tsx` | **Brand Studio trigger** — builds a `StudioPersonalizeOptions` payload (originStudio `'brand-studio'`, media = `brand.screenshot_url`, aspectRatio 16:9, prompt = tagline/value proposition) and renders `PersonalizeVideoAction` in the header actions row, between "Photo Studio" and "Save", guarded on the screenshot existing. The trigger appears only when there is source media (`PersonalizeStep` renders nothing without `media.url`). |
| `app/(brand-studio)/photo-studio/page.tsx` | **Photo Studio trigger** — payload (originStudio `'photo-studio'`, media = newest product photo `result?.image_url \|\| history[0]?.image_url`, aspectRatio 1:1, prompt = selected style) and renders `PersonalizeVideoAction` in the header row next to the brand `<select>`, guarded on the media existing. |
| `app/academy/page.tsx` | **Academy provider mount + trigger** — the page (a route outside `StandaloneShell.js`) now wraps `AcademyCourse` in `DemoPersonalizeProvider` (exactly ONE) and renders a `PersonalizeVideoAction` trigger (fixed bottom-left) personalizing the FIRST bundled example media of the course manifest (`@/data/academyMediaManifest.json`, a data import, not a component). |
| `src/apps/vfx-studio/VFXStudio.tsx` | **Mount half only** — accepts the optional `renderPersonalizeAction` prop and forwards it to `VFXGenerate`. No z-index value touched. |
| `src/apps/vfx-studio/pages/VFXGenerate.tsx` | Accepts the optional `renderPersonalizeAction` prop, builds a plain options payload (originStudio `'vfx-studio'`, media = the uploaded/pasted source image `imageUrl`, aspectRatio, duration, prompt), and renders `{studioPersonalizeOptions.media.url ? renderPersonalizeAction?.(...) : null}` next to the "Upload" button in the always-visible toolbar row. **P3-B's `zIndex: 240` on the generation modal is preserved exactly.** |
| `src/apps/thumbnail-studio/ThumbnailStudio.tsx` | Accepts the optional `renderPersonalizeAction` prop, builds the payload (originStudio `'thumbnail-studio'`, media = `lastImageUrl \|\| myImages[0]?.url` — the newest generation, the same rule Vibe Motion/AI Influencer follow, aspectRatio from `selectedSize.ratio`, prompt = `buildPrompt()` + model), and renders the trigger right after the "Generate" button, guarded on the media existing. |
| `components/StandaloneShell.js` | **Additive only** — the two shell-mounted studios now receive the render prop: line 724 (`<VFXStudio … renderPersonalizeAction={renderPersonalizeAction} />`) and line 726 (`<ThumbnailStudio … renderPersonalizeAction={renderPersonalizeAction} />`). Nothing else changed; the existing `renderPersonalizeAction` builder (the `PERSONALIZE_TRIGGER_CLASS` flex-row variant) is reused, so the new triggers match the nine existing ones exactly. |
| `e2e/structural-studio-provider-ancestors.mjs` | **NEW** — the structural check as a script (see §1). |
| `e2e/personalization-studio-triggers.spec.ts` | **NEW** — the coverage spec (structural test + one runtime test per studio). |
| `docs/phase3/handoffs/P3-F.md` | this file |

**Files NOT changed (owned by others):** `packages/studio/**` (zero edits — no cross-package import
added anywhere), `src/shared/personalization/**` (zero edits — the union
`PersonalizationOriginStudio` in `studioEntry.ts` already contains `'vfx-studio'`,
`'thumbnail-studio'`, `'brand-studio'`, `'photo-studio'`, `'academy'`, so NO union addition was
needed), `src/apps/vfx-studio/components/ImageUrlModal.tsx` (P3-B's z-index half — untouched),
`e2e/personalization-step4-remotion-export.spec.ts` (P3-E's — untouched), `components/academy/**`
(not in the ownership list — the Academy trigger lives in `app/academy/page.tsx` instead, which is
in the list), `.github/**`, `netlify.toml`, `package.json`, lock files, `origin/main`.
No commit, no push, no merge, no deploy, no rebase/reset.

---

## 0. The provider-mount decision (read first)

`app/(brand-studio)/layout.tsx` was checked FIRST, per the brief. It did **not** mount a provider
(`grep -c DemoPersonalizeProvider` → `0`), so ONE was added — in the **layout**, which wraps every
route of the group (`/brand-studio`, `/brand/[id]`, `/campaign/[id]`, `/asset/[id]/edit`,
`/photo-studio`). One mount therefore covers both Brand Studio and Photo Studio with exactly one
provider ancestor per trigger, and a nested second provider cannot appear.

VFX Studio and Thumbnail Studio are mounted **inside** `components/StandaloneShell.js`
(lines 724 / 726), which already mounts `DemoPersonalizeProvider` once around the studio content
(line 708) — their provider mount therefore already existed; the missing piece was the trigger, and
it landed through the established `renderPersonalizeAction` render prop (additive shell change, the
same flex-row `PERSONALIZE_TRIGGER_CLASS` builder the other nine studios use). `app/vfx/page.tsx`
redirects to `/studio/vfx-studio`, so the redirect route needed no edit.

Academy is its own route (`app/academy/**`) rendered outside `StandaloneShell.js`, so it got its
own mount in `app/academy/page.tsx` plus its own trigger. The AcademyCourse component
(`components/academy/**`) is NOT in the ownership list, so the trigger was built in the page file
from the bundled example-media manifest (`@/data/academyMediaManifest.json`) — a data import, not a
component import — personalizing the same real, app-served asset a learner sees in the "See" step.

---

## 1. Commands run and raw output

### 1.1 The structural check — `node e2e/structural-studio-provider-ancestors.mjs`

The invariant as a script (not prose). For each of the five triggers it walks the hand-verified
ancestor chain (trigger file → layout/shell nodes, each verified against the filesystem), counts
the `<DemoPersonalizeProvider` mounts per node after stripping comments, and fails unless the total
is EXACTLY one. It also proves: the newly-wired studios accept the render prop, StandaloneShell
really passes it to VFX/Thumbnail, the cross-package invariant
(`packages/studio/src` has ZERO app-root personalization imports), and P3-B's z-index edits are
preserved exactly.

```
$ node e2e/structural-studio-provider-ancestors.mjs
== P3-F structural check: exactly one DemoPersonalizeProvider ancestor per trigger ==
  PASS  Brand Studio (Brand DNA, /brand/[id]): exactly ONE provider ancestor (app/(brand-studio)/brand/[id]/page.tsx=0, app/(brand-studio)/layout.tsx=1)
  PASS  Brand Studio (Brand DNA, /brand/[id]): trigger present in app/(brand-studio)/brand/[id]/page.tsx
  PASS  Photo Studio (/photo-studio): exactly ONE provider ancestor (app/(brand-studio)/photo-studio/page.tsx=0, app/(brand-studio)/layout.tsx=1)
  PASS  Photo Studio (/photo-studio): trigger present in app/(brand-studio)/photo-studio/page.tsx
  PASS  Academy (/academy): exactly ONE provider ancestor (app/academy/page.tsx=1)
  PASS  Academy (/academy): trigger present in app/academy/page.tsx
  PASS  VFX Studio (/studio/vfx-studio, BottomInputBar page): exactly ONE provider ancestor (src/apps/vfx-studio/pages/VFXGenerate.tsx=0, src/apps/vfx-studio/VFXStudio.tsx=0, components/StandaloneShell.js=1)
  PASS  VFX Studio (/studio/vfx-studio, BottomInputBar page): trigger present in src/apps/vfx-studio/pages/VFXGenerate.tsx
  PASS  Thumbnail Studio (/studio/thumbnail-studio): exactly ONE provider ancestor (src/apps/thumbnail-studio/ThumbnailStudio.tsx=0, components/StandaloneShell.js=1)
  PASS  Thumbnail Studio (/studio/thumbnail-studio): trigger present in src/apps/thumbnail-studio/ThumbnailStudio.tsx
== StandaloneShell.js app-root wiring ==
  PASS  VFXStudio receives renderPersonalizeAction from StandaloneShell.js
  PASS  ThumbnailStudio receives renderPersonalizeAction from StandaloneShell.js
== Cross-package import invariant ==
  PASS  packages/studio/src has ZERO app-root personalization imports
== P3-B z-index preservation ==
  PASS  packages/studio/src/components/MotionControlStudio.jsx: P3-B z-index (z-[240]) preserved
  PASS  src/apps/vfx-studio/components/ImageUrlModal.tsx: P3-B z-index (zIndex: 240) preserved
  PASS  src/apps/vfx-studio/pages/VFXGenerate.tsx: P3-B z-index (zIndex: 240) preserved

ALL CHECKS PASSED
EXIT=0
```

The same script is also executed INSIDE the Playwright spec (test 1 runs it via
`execFileSync` and asserts the output contains `ALL CHECKS PASSED`), so the Playwright run carries
the structural evidence too.

### 1.2 `npx tsc --noEmit`

```
$ npx tsc --noEmit > /tmp/kilo/p3f-tsc.txt 2>&1; echo "TSC_EXIT=$?"; wc -l /tmp/kilo/p3f-tsc.txt
TSC_EXIT=0
       0 /tmp/kilo/p3f-tsc.txt
```

Re-run AFTER the new spec landed (so the spec file itself is type-checked too):

```
$ npx tsc --noEmit > /tmp/kilo/p3f-tsc2.txt 2>&1; echo "TSC_EXIT=$?"; wc -l /tmp/kilo/p3f-tsc2.txt
TSC_EXIT=0
       0 /tmp/kilo/p3f-tsc2.txt
```

(No output at all — clean, both runs.)

### 1.3 Host health gate — FAILING at run time

```
$ uptime; vm_stat | awk '/Pages (free|inactive|spec|purgeable)/{s+=$3} END{printf "available=%.1f GiB\n", s*4096/1024/1024/1024}'
16:40  up  4:12,  1 user,  load averages: 558.20 430.92 266.76
available=1.8 GiB
```

Load1 = **558**, far above the 40 threshold (memory is OK at 1.8 GiB). The load comes from another
worktree's `tinypool` vitest processes + the IDE — the same source P3-E reported on the board
("load1 123-148 (>40) since 16:11"). Per the rules a result obtained under this load is **discarded,
not trusted**, so the Playwright run is HELD until the gate clears. The structural check and tsc are
single-shot Node processes and were run before the spike peaked; they are deterministic file parses
(no timing surface), but the orchestrator's `validate.sh P3-F` re-runs both centrally anyway.

### 1.4 `npx playwright test` — HELD, not run

NOT RUN. Two independent blockers, both on the board (`ASK` `board_d6f54ab3`):

1. **Stale server build.** The production server on http://localhost:3111 (PID 41082,
   `next-server v15.5.15`, started 16:05 by the orchestrator) serves the `.next` production build
   from 16:03 — the Wave 1 close-out build. **P3-F's Wave 2 edits postdate that build**, so the
   runtime tests would fail against it for a reason that is not a code defect. Rebuilding requires
   `npm run build`, which requires the build lock, which the orchestrator holds for Wave 2. The
   running server must not be killed by an agent that did not start it.
2. **Host gate failing** (§1.3): load1 558 > 40.

The spec is complete and type-checked (`e2e/personalization-studio-triggers.spec.ts`); its runtime
half must be run against a fresh production build + restarted 3111 server once both blockers clear:

```
npx playwright test e2e/personalization-studio-triggers.spec.ts --project=chromium \
  --reporter=list --retries=0 --workers=1
```

The structural test (test 1) is fs-based and independent of the server; the five runtime tests each
seed the studio's own persisted state or stub its own data endpoint, sign in through Clerk's own UI,
click the "Personalize" trigger, and assert the shared Personalization Modal opens carrying exactly
the studio's media (the same assertions the Phase 2 `personalization-studio-handoff.spec.ts` makes
for the ten StandaloneShell studios).

---

## 2. Decisions

- **One provider mount in `app/(brand-studio)/layout.tsx`, not one per page** — the layout wraps
  every route of the `(brand-studio)` group, so Brand Studio and Photo Studio each get exactly ONE
  provider ancestor from a single mount, and a nested second provider cannot appear.
- **Brand Studio's trigger lives on `/brand/[id]`, not `/brand-studio`** — the `/brand-studio` page
  is the bare "paste a URL" entry form and has no media at all; the Brand DNA page is the brand's
  workspace and carries the brand screenshot (`brand.screenshot_url`), which is the studio's own
  media. The trigger appears only when a screenshot exists.
- **Photo Studio's trigger uses the newest product photo** (`result?.image_url ||
  history[0]?.image_url`) and sits in the header row next to the brand `<select>` — the result panel
  only exists after a generation, so the header placement keeps the trigger available from history
  too, with zero visual change beyond the trigger itself.
- **Academy's trigger personalizes the first bundled example media** from
  `@/data/academyMediaManifest.json` — a data import (allowed; `components/academy/**` is NOT in the
  ownership list, so no component there was touched). The trigger is a fixed bottom-left button so
  the course UI is unchanged.
- **VFX Studio's trigger uses the source image (`imageUrl`), not the generated video** — A9's
  established rule: "Source media = the studio's own primary media, not the newest generated
  output". It sits next to the Upload button in the always-visible toolbar row, so it appears as
  soon as the user uploads/pastes a source image.
- **Thumbnail Studio's trigger uses `lastImageUrl || myImages[0]?.url`** — the generate tab has no
  upload input, so the newest generation (else the newest local image) is the only media there is —
  the same documented exception Vibe Motion and AI Influencer use (A9 §3.1).
- **The union was NOT widened** — `PersonalizationOriginStudio` in `src/shared/personalization/
  studioEntry.ts` already contains `'vfx-studio'`, `'thumbnail-studio'`, `'brand-studio'`,
  `'photo-studio'` and `'academy'`. Zero edits to `src/shared/personalization/**`.
- **`components/StandaloneShell.js` changes are strictly additive** — two prop additions on the
  existing `<VFXStudio>` / `<ThumbnailStudio>` call sites, reusing the existing
  `renderPersonalizeAction` builder. The other ten studios' props are untouched.
- **P3-B's z-index half is preserved exactly** — proven by the structural check (`zIndex: 240` in
  `VFXGenerate.tsx` and `ImageUrlModal.tsx`, `z-[240]` in `MotionControlStudio.jsx`).

## 3. Interface changes (consumers must know)

- `app/(brand-studio)/**` — every route inside the group now has a `DemoPersonalizeProvider`
  ancestor from the layout. A page inside the group must NOT mount a second provider.
- `src/apps/vfx-studio/VFXStudio.tsx` + `src/apps/vfx-studio/pages/VFXGenerate.tsx` — new OPTIONAL
  prop `renderPersonalizeAction?: (options: unknown) => React.ReactNode`. Not passing it renders no
  trigger; existing call sites are unaffected. Whoever renders VFXStudio outside
  `StandaloneShell.js` must pass the prop itself.
- `src/apps/thumbnail-studio/ThumbnailStudio.tsx` — same optional prop, same rule.
- `components/StandaloneShell.js` — VFX Studio and Thumbnail Studio now receive
  `renderPersonalizeAction` (lines 724 / 726), reusing the flex-row `PERSONALIZE_TRIGGER_CLASS`
  builder, so the new triggers match the nine existing ones exactly.
- `e2e/structural-studio-provider-ancestors.mjs` — NEW standalone script (exit 0 = pass);
  the orchestrator may run it as an extra cross-check next to `validate.sh P3-F`.

## 4. Open questions / blockers

1. **The Playwright runtime run is HELD** (§1.4). Two blockers: (a) the 3111 server serves the
   16:03 Wave-1 production build, which predates P3-F's edits — a rebuild (`npm run build`, build
   lock) + server restart is needed before the runtime tests can prove the triggers in a real
   browser; (b) the host gate fails (load1 558 > 40). Both are posted on the board
   (`ASK` `board_d6f54ab3`). The structural half of the spec (test 1) is server-independent.
2. **Product decision (not a blocker):** should VFX Studio's trigger hand over the studio's
   *generated video* instead of its *source image*? The source-image choice follows A9's rule
   (§2); changing it is a one-line edit in the memo.
3. **`app/vfx/page.tsx` was left untouched** — it is a redirect to `/studio/vfx-studio`, so the
   studio's real mount is in `StandaloneShell.js`.

## 5. Wave compliance

- [x] Edited only files listed against my ID in `docs/phase3/OWNERSHIP.md` — plus the two NEW e2e
      files the brief explicitly requires (`e2e/structural-studio-provider-ancestors.mjs` — the
      structural check as a script — and `e2e/personalization-studio-triggers.spec.ts` — the new
      coverage spec). No other file touched; P3-E's spec untouched; `packages/studio/**` untouched.
- [x] Did not run a build/test/e2e command without the build lock — `npm run build`,
      `build:packages`, `build:studio`, `test:unit` and `npx playwright test` were **NOT** run.
      Only `npx tsc --noEmit` (explicitly allowed), the structural script and git read commands.
- [x] Did not rebase, reset, or touch `origin/main`, `netlify.toml` or `.github/`.
- [ ] Wrote this handoff file and posted a `RESULT` to the board — handoff written now; the RESULT
      post follows once the held Playwright run resolves (or is confirmed handed to the
      orchestrator/integration lane).
