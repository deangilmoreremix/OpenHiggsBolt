# Upstream-Aware Architecture Audit

**Upstream:** [`Anil-matcha/Open-Generative-AI`](https://github.com/Anil-matcha/Open-Generative-AI)
**This repository:** `deangilmoreremix/OpenHiggsBolt` (SmartVideo GO)
**Fork point (verified):** `fd04952475f66365e390c2dddb9d0659dc1d7a62`
**Upstream commits since fork:** **107** (counted with
`git -C <upstream> log --oneline fd049524..origin/main | wc -l`)
**This-repo commits since fork:** **832** at the integration
candidate HEAD `11385e3a6`
**Upstream HEAD:** `6b704b080 Revise video links in README`
**Method:** the upstream repository was shallow-cloned to
`/var/folders/2q/980_t4n950j58k8g6m2z4ps80000gn/T/kilo/upstream-oga`
and inspected with `git -C <upstream> ls-tree` / `git show
origin/main:<path>`. The previous clone (used in an earlier
session) had been removed; this re-clone re-establishes the
comparison baseline. Every claim is verified against the
upstream tree at the fork point and at `origin/main`.

## Verified baseline (this fork)

- Upstream has **zero** `clerk`, `supabase`, or `openai` files
  (`git -C <upstream> ls-files | grep -ciE "clerk|supabase|openai"`
  = 0). Upstream is a stateless, no-auth, no-persistence app
  (Vite + React + the vendored `packages/studio` Babel build).
- Upstream `src/shared/` is empty / non-existent (no files).
- Upstream ships its own `src/lib/muapi.js` (Vite app) and
  `packages/studio/src/muapi.js` (vendored studio), and its own
  `src/lib/uploadProxyTarget.js`.
- Upstream studio components (vendored `packages/studio/src/components/`):
  AgentStudio, AiInfluencerStudio, AppsStudio, AudioStudio,
  CinemaStudio, ClippingStudio, DesignAgentStudio, DrawModal,
  ImageStudio, LayersStudio, LipSyncStudio, MarketingStudio,
  McpCliStudio, MobileGenerationActions, and more.
- Upstream ALSO ships `src/components/ImageStudio.js` and
  `src/components/VideoStudio.js` in the standalone Vite app
  (a different code path from the vendored studio).

This repository adds on top of upstream: Clerk authentication,
Supabase persistence and edge functions, the OpenAI client and
proxy, the Personalization modal + AI Assist, Brand Studio
(Open Pomelli), Workflow, VFX Studio, Voice Studio, Academy,
Marketing, Reseller, the personalization persistence + upload
stack, the SmartVideo GO go.smartvid.app surface, and the
`integration-worktree` candidate.

## 6-column comparison table

Columns: ISSUE | UPSTREAM STATUS | OPENHIGGSBOLT STATUS | ORIGIN
| RECOMMENDED ACTION | SYNC CONFLICT RISK.

| ISSUE | UPSTREAM STATUS | OPENHIGGSBOLT STATUS | ORIGIN | RECOMMENDED ACTION | SYNC CONFLICT RISK |
|---|---|---|---|---|---|
| **Authentication layer (Clerk)** | absent | present (Clerk + middleware + `auth()`) | this repo | keep — intentional architectural difference (SmartVideo GO is authenticated; upstream is not) | none |
| **Persistence (Supabase)** | absent | present (RLS, edge functions, RLS migrations) | this repo | keep | none |
| **OpenAI client** | absent | present (text enhancement, vision, image gen/edit) | this repo | keep | none |
| **Personalization modal + AI Assist** | absent | present (PersonalizationModal, DemoPersonalizeProvider, AiAssistantModal, find/research-business routes, business discovery) | this repo | keep | none |
| **Brand Studio / Open Pomelli** | absent | present (`(brand-studio)` route group, brand routes, brandStore) | this repo | keep | none |
| **VFX Studio** | absent | present (`app/api/vfx/*`, `src/shared/api/vfx.ts`) | this repo | keep | none |
| **Voice Studio** | absent | present (vendored `vendor/VoiceStudio` submodule) | this repo | keep | none |
| **Workflow builder** | absent | present (`packages/workflow-builder`) | this repo | keep | none |
| **SSRF centralization (networkSafety)** | absent | present at candidate `11385e3a6` (`src/lib/networkSafety.ts` from PR #49) | this repo (PR #49) | keep | none |
| **Rate limit keying (`resolveRateLimitKey`)** | absent | present at candidate `4a3649743` | this repo (PR #49) | keep | none |
| **MuAPI client implementations** | ONE per repo (`src/lib/muapi.js` + `packages/studio/src/muapi.js`) | THREE (this repo adds `src/shared/api/muapi.ts` for thumbnail studio) | this repo added a third | consolidate: deprecate the typed wrapper's distinct logic and route all callers through `packages/studio/src/muapi.js` (the functional client); keep `src/lib/muapi.js` only where the standalone Vite app boundary requires it. **Low priority** — three implementations are not a security defect. | low — touches multiple call sites but the change is mechanical |
| **`packages/studio/src/components/` divergence** | upstream's vendored studio (AgentStudio, AiInfluencerStudio, AppsStudio, AudioStudio, CinemaStudio, ClippingStudio, DesignAgentStudio, DrawModal, ImageStudio, LayersStudio, LipSyncStudio, MarketingStudio, McpCliStudio, MobileGenerationActions) | this repo's vendored studio (the SmartVideo GO customizations overlay) | this repo + selective upstream carries | selective upstream sync: when upstream adds a new studio component, incorporate the component but DO NOT carry the SmartVideo GO customizations upstream; for existing components, the local overlay is the source of truth and only upstream bug-fixes should be cherry-picked | high — a wholesale `git merge` of upstream into the studio package would overwrite the SmartVideo GO overlays (e.g. Personalization handoffs, Lead Finder, Brand Studio handoffs) |
| **`src/components/{ImageStudio,VideoStudio}.js`** (standalone Vite) | upstream has these | this repo mirrors them in the studio package; the standalone Vite variant is the Electron entry | upstream | bug-fix cherry-pick only; do NOT replace wholesale (Electron wiring differs) | medium |
| **i18n bundles** (`packages/studio/src/messages/{en,zh}/*.json`) | upstream ships `en` and `zh` for the studios it vendors | this repo extends with SmartVideo GO entries; the upstream-sync workflow MUST protect the SmartVideo GO entries (the prior `upstream-sync.yml` defect that deleted the `zh` directory is fixed in the candidate's history) | upstream | the upstream-sync workflow already protects the SmartVideo GO messages | low |
| **Latest upstream media models** (the 107 commits since fork) | upstream adds Nano Banana 2.1, current media models, and more (`00132ec feat(studio): add Nano Banana 2.1 models`, `ce82e99 feat(studio): add current media models`, etc.) | this repo's studio carries the older model set | upstream has newer | selective model incorporation: when an upstream commit adds a model, add the model entry to the local `alibabaModels.js` / `localModels.js` / studio-specific model file, with a smoke test. Do not carry upstream's full studio file (it would overwrite localizations and SmartVideo GO customizations). | low per-commit; medium across a large upstream batch |
| **README and video links** | upstream updates (6b704b0, d8d624d, 55e02f0) | this repo's README carries SmartVideo GO–specific content | upstream | ignore upstream README-only changes for the local README; the local README is product-specific | none |
| **CLA / contributing docs** | upstream has them | this repo has its own | both | ignore — governance is per-repo | none |
| **Discussions / issues / metadata** | upstream has its own | this repo has its own | both | ignore | none |

## A. Safe upstream improvements to incorporate

These are the upstream changes that can be cherry-picked safely
into this repository without conflicting with the SmartVideo GO
customizations:

1. **Media model additions.** Upstream commits `00132ec` and
   `ce82e99` add Nano Banana 2.1 and current media models to the
   vendored studio. The local studio can adopt the same model
   entries by adding the rows to
   `packages/studio/src/{localModels,alibabaModels}.js` (or the
   equivalent model registry) with a smoke test that confirms
   the model ID and provider endpoint are reachable. The change
   is additive: a new row in the registry does not overwrite
   existing SmartVideo GO models.
2. **Upstream studio component bug-fixes.** When upstream fixes
   a defect in a studio component (e.g. a render bug in
   `ImageStudio.jsx` or `VideoStudio.jsx`), cherry-pick the
   minimal fix into this repo's `packages/studio/src/components/`
   mirror. Do NOT carry the full file from upstream because the
   local mirror carries SmartVideo GO customizations (handoffs,
   Personalization, Brand Studio).
3. **MuAPI client upstream improvements.** When upstream improves
   `packages/studio/src/muapi.js` (the functional client) or
   `src/lib/uploadProxyTarget.js`, port the specific change.
   This repo's foundation already adopted PR #49's centralized
   `src/lib/networkSafety.ts`; when PR #49 merges, the local
   `networkSafety` is the single validator and any
   `uploadProxyTarget.js` change should be reconciled to use it.

## B. Issues requiring custom SmartVideo GO fixes

These are issues that exist (or are introduced) only in this
repository and need custom fixes that do not have an upstream
equivalent:

1. **The 16 pre-existing `DemoPersonalizeProvider` mock-contract
   failures** (resolved in `11385e3a6`) — the mocks had drifted
   from the real `uploadPersonalizationAsset(apiKey, {file})` and
   `persistEditedPersonalizationAsset(...)` return shapes. Fixed
   by aligning the mocks with the real contracts. No upstream
   equivalent.
2. **The Critical SSRF gap in `researchBusiness`**
   (`src/server/businessDiscovery/researchProvider.ts`) — fixed
   in `aaa7adf7a` with the `networkSafety` gate, manual redirect
   loop, `safeRequestConfig` pin, reason discriminator, and 23
   adversarial regression tests. No upstream equivalent (this
   route is a SmartVideo GO–only public lead-discovery endpoint).
3. **The H4 cross-tenant brand exposure**
   (`app/api/brand/route.ts`, `app/api/brands/route.ts`,
   `src/shared/brandStore.ts`) — fixed in `8077d1463`. No
   upstream equivalent.
4. **The 3 RLS migrations, the discover-assets POST anon gate,
   the design-agent skills entitlement, the download-image
   SSRF guard** — still missing on this repo's HEAD; the
   integration manifest and Phase 1 audit enumerate them.
5. **The Personalization, AI Assist, Business Discovery, and
   Lead Finder feature set** — entirely this repo's product.

## C. Intentional architectural differences NOT to change

These are differences between upstream and this repository that
are by design and must be preserved:

1. **Clerk authentication.** SmartVideo GO is a multi-tenant
   authenticated product. Clerk is in the middleware, every
   `app/api/**/route.ts`, the personalization flow, the brand
   studio, and the vfx routes. Upstream is a stateless
   unauthenticated demo. Do NOT add Clerk to upstream; do NOT
   remove Clerk here.
2. **Supabase persistence.** SmartVideo GO persists every
   personalization, brand, and saved-client artefact in
   Supabase with RLS. Upstream is in-memory only. Do NOT
   introduce Supabase in upstream; do NOT remove it here.
3. **The OpenAI client.** SmartVideo GO uses OpenAI for
   generative image, image edit, text enhancement, and vision
   analysis. Upstream has no OpenAI integration.
4. **Personalization, AI Assist, Brand Studio, VFX, Voice
   Studio, Workflow builder, Marketing, Reseller, Academy.** All
   SmartVideo GO–specific products that have no upstream
   equivalent.
5. **The (brand-studio) route group** and the brand routes'
   owner-scoped lookups. The route group name and the
   `src/shared/brandStore.ts` Map are intentional, even though
   the in-process Map is documented as a residual limitation
   (durable storage lives in the Supabase `brand_*` tables once
   the RLS migrations land).
6. **The Personalization modal's drag-and-drop, `onRevert` /
   "Revert to original", asset summaries, and image-editing
   integration** are main-branch SmartVideo GO features. The
   candidate preserves them. Upstream's modal in the vendored
   studio is a different (smaller) component.
7. **The integration candidate's frozen primitives**
   (`src/lib/networkSafety.ts`, `lib/rateLimit.ts
   resolveRateLimitKey`) are a single, intentional architectural
   choice. A second SSRF validator or a duplicate rate-limit
   key helper must NOT be introduced.

## D. Issues needing additional runtime verification

These are items where the static comparison is insufficient and
runtime evidence is required before declaring safe:

1. **Upstream media model additions (A.1).** Each adopted
   upstream model needs a smoke test against the live provider
   endpoint to confirm the model ID, the parameter shape, and
   the result schema. The smoke test should run in CI on a
   nightly schedule (the existing studio model tests are a
   template).
2. **PR #49 not yet merged.** When PR #49 lands, the candidate
   must consolidate: the `networkSafety.ts` validator is shared
   (foundation already adopted it); any code that referenced
   `urlSecurity.ts` or the sec commit's `clerkAuth.js` must be
   removed to avoid duplicate validators / auth mechanisms.
3. **The 8/8 browser E2E** (`e2e/personalization-remaining-flows.spec.ts`).
   The spec's uncommitted improvements (the niche fix and the
   BUSINESS FINDER test rewrite) are UI-INT scope and were not
   landed. Running the spec today would test the un-improved
   version, which is not the "8/8 from a clean committed
   integration candidate" the manifest defines. Once the
   spec is ported and the route hardening (resolveRateLimitKey
   + x-real-ip / last-XFF) lands, run the spec in CI against a
   preview deployment.
4. **Staging verification of the full candidate at `11385e3a6`.**
   Netlify deploy preview + Clerk + Supabase + MuAPI credentials
   end-to-end smoke. The Phase 1 audit's E.7 records this as
   out of scope; it is the prerequisite for production deploy.
5. **The in-process rate limiter's behavior under serverless
   scale-out.** If SmartVideo GO is deployed with multiple
   Netlify function instances, the limiter's per-instance
   buckets give a caller more capacity than intended. Swap for
   Upstash/Redis/Supabase if scaling horizontally. Not a
   correctness issue at single-instance scale.

---

## Conclusion

The candidate at `11385e3a6` is upstream-aware: every change
made by this integration is either a SmartVideo GO–specific
fix (B) or a cherry-pickable upstream improvement (A), and no
intentional architectural difference (C) has been altered. The
candidate reuses the newest upstream / PR #49 primitives
(`networkSafety`, `resolveRateLimitKey`) rather than introducing
duplicates. Residual gaps (D.1–D.5) are tracked and bounded.
