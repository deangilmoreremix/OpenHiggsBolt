---
name: Design fixes from the template sweep (KPI figures, light logos, sparse brands)
area: personalization
status: live
added: 2026-11-23
pr: deangilmoreremix/OpenHiggsBolt#235
route: Personalize this demo > Step 4 > Designs
code:
  - src/shared/personalization/templates/designs/batch3c/KpiCounterDesign.tsx
  - src/shared/personalization/templates/designs/batch3d/rveLogoShared.ts
  - src/shared/personalization/templates/designs/batch3e/entries.ts
  - src/shared/personalization/templates/_upstream/rve-noise-grain/NoiseGrain.tsx
  - src/shared/personalization/preview/designSlots.ts
  - src/shared/personalization/preview/imagePixels.ts
---

## What it does
- **KPI Counter Cards**: you type up to four figures (a label and a number per card) in the editor. A card without a usable number is not drawn, and with none typed only the title and subtitle show. The design never prints stand-in text.
- **Logo reveals** (fade, glitch, scale-rotate, spin): a white or pale logo now sits on a dark brand tile instead of vanishing on a white one.
- **Animated Bullets and Subscribe Reminder** now show your business name when the offer, call to action, phone and website are empty.
- **Film Grain** exports (it used to crash the browser export).
- **Transitions** say "Plays at the start of your video".

## Where in the app
Personalize this demo > Step 4 > Designs (the gallery and the on-video editor).

## Depends on
No API or database. Two optional slot flags in `templates/types.ts`: `hidden` (resolved but not an input) and `freeText` (no brand fallback). A `lightLogo` image hint measured in the browser.

## How to test
`npx vitest run src/shared/personalization/templates src/shared/personalization/preview`, and the real-export sweep: `e2e/personalization-design-sweep.spec.ts` with `SWEEP_IDS=kpi-counter,rve-noise-grain,...` (see docs/template-coverage-ledger.md).
