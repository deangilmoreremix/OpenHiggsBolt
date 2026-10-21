# Shared Personalization Entry-Point Contract

**One modal. One provider. One contract. Every studio.**

SmartVideo GO AI has exactly ONE Personalization implementation:
`src/shared/personalization/` (`DemoPersonalizeProvider` + `PersonalizationModal`).
This document describes the contract that lets **any** studio in SmartVideo GO AI
open that existing modal without re-implementing anything.

- Contract module: `src/shared/personalization/entryPoint.ts` (pure, no React)
- Unit tests: `src/shared/personalization/__tests__/entryPoint.test.ts`
- Provider wiring: `src/shared/personalization/DemoPersonalizeProvider.tsx`

---

## 1. The contract

```ts
import {
  createPersonalizationOpenOptions,
  toPersonalizationOpenRequest,
  deliverPersonalizationResult,
} from '@/shared/personalization/entryPoint'
import type {
  PersonalizationEntryPoint,
  PersonalizationResult,
} from '@/shared/personalization/entryPoint'

export type PersonalizationMediaType = 'video' | 'image' | 'prompt-only'

export interface PersonalizationBrandAssets {
  logoUrl?: string
  brandName?: string
  brandColors?: string[]
}

/** The provider's own GenerationResult — one result type in the system. */
export type PersonalizationResult = GenerationResult

export interface PersonalizationEntryPoint {
  originatingStudio: string            // which studio opened it
  projectRef?: string                  // project identifier
  sourceVideo?: string                 // source video URL
  sourceImage?: string                 // source image URL (or a video's poster still)
  mediaType: 'video' | 'image' | 'prompt-only'
  aspectRatio?: string                 // e.g. '16:9'
  durationSeconds?: number
  brandAssets?: PersonalizationBrandAssets
  prompt?: string                      // optional: a prompt the studio already has
  title?: string                       // optional: modal header title
  model?: string                       // optional: model the studio generated with
  modelName?: string                   // optional: model display name
  access?: 'anonymous' | 'authenticated' // optional: defaults to 'authenticated'
  onComplete?: (result: PersonalizationResult) => void
}
```

### How a studio uses it

```tsx
'use client'
import { useDemoPersonalize } from '@/shared/personalization'
import { createPersonalizationOpenOptions } from '@/shared/personalization/entryPoint'

export default function MyStudio() {
  const { openPersonalize } = useDemoPersonalize()

  const handlePersonalize = (event: React.MouseEvent<HTMLButtonElement>) => {
    openPersonalize(
      createPersonalizationOpenOptions(
        {
          originatingStudio: 'my-studio',
          mediaType: 'image',
          sourceImage: lastResultUrl,
          prompt: 'my prompt',
          aspectRatio: '16:9',
          onComplete: (result) => {
            // the personalized output comes back here
            console.log(result.url, result.type, result.prompt)
          },
        },
        { trigger: event.currentTarget },
      ),
    )
  }

  return <button onClick={handlePersonalize}>Personalize with AI</button>
}
```

`createPersonalizationOpenOptions(...)` returns exactly the options the existing
provider's `openPersonalize` accepts (`{ source, access, trigger, onComplete }`),
so **no modal, wizard step or provider behaviour is duplicated**.

### The adapter guarantees

`toPersonalizationOpenRequest(entry)` maps the contract onto the
`PersonalizationSource` the provider already accepts. The rules are the same ones
the shared demo source mappers follow:

| Rule | Behaviour |
| --- | --- |
| **No substitution** | A `video` entry point uses its own `sourceVideo`; an `image` entry point uses its own `sourceImage`. Nothing is borrowed from another record. |
| **No fabrication** | `aspectRatio`, `duration`, `model` stay `undefined` when the studio does not declare them. `durationLabel` is derived as `"<n>s"` (same convention as the demo mappers). |
| **No substituted media** | A video entry point without a playable video keeps `sourceMedia: null` and is flagged `mediaPending` (the shared `MEDIA_PENDING_KEY`), so the modal shows an actionable message instead of a broken player. |
| **Stable identity** | The source id is `<studio>:<projectRef>` (or `<studio>:<mediaType>:<media>`), so a saved project restores in the studio it belongs to. |
| **One normaliser** | The provider's own `normalizePersonalizationSource` passes the adapter's source through untouched — the adapter never re-implements it. |

`deliverPersonalizationResult(result, onComplete)` is the single place the
provider hands a result to the originating studio, so the delivery contract is
unit-testable without mounting the modal.

### Provider change (minimal, backwards compatible)

`DemoPersonalizeProvider` gained exactly one optional field:

```ts
export type OpenPersonalizeOptions = {
  source: unknown
  trigger?: HTMLElement | null
  access?: PersonalizationAccessMode
  onComplete?: (result: GenerationResult) => void   // ← new, optional
}
```

- Omitting `onComplete` changes nothing. Every pre-existing entry point keeps
  working exactly as before.
- The callback is invoked with the provider's own `GenerationResult` as soon as
  one is available — a freshly generated result **or** a restored saved
  project — and never twice for the same result.
- The modal itself is unaware of the callback.

---

## 2. Audit — how studios open the modal today

### Entry points that exist today

| # | Surface | File | What it passes | Access |
| --- | --- | --- | --- | --- |
| 1 | Landing page demo cards | `components/landing/DemoMediaCard.tsx:78` | `openPersonalize({ source: demo, trigger })` — the **raw** `VideoDemo`; the provider's own normaliser maps it to its own `videoSrc` / `posterSrc` / aspect ratio / duration / prompt. | `authenticated` (default) |
| 2 | Demo detail page | `app/demo/[slug]/page.tsx:64` | `openPersonalize({ source: buildDemoPersonalizeSource(demo), trigger })` — the demo's exact media, never a substituted one. | `authenticated` (default) |
| 3 | Personalization design preview | `app/personalization-demo/page.tsx:34` | `openPersonalize({ source: SAMPLE_SOURCE })` — a literal, already-normalised video source ("Luxury Perfume Commercial"). | `authenticated` (default) |
| 4 | Free discovery landing | `src/components/FreeDiscoveryDemo.tsx:40,44` | `openPersonalize({ source: buildFreeDiscoverySource(), access: 'anonymous' })` — `prompt-only`, no media; the visitor pastes a business website. | `anonymous` |
| 5 | GO-Viral studio (2 live call sites) | `src/apps/go-ai-viral/GoAiViralStudio.tsx:156` (`PromptCard`) and `:331` (`VideoPromptCard`) | `openPersonalize({ source: buildViralPersonalizeSource(record), trigger })` — the viral record's **own** resolved video/image URL and thumbnail. | `authenticated` (default) |

**Exact current shape of the "open" call**

```ts
openPersonalize({
  source: unknown,                 // a raw demo/viral record OR an already-normalised PersonalizationSource
  trigger?: HTMLElement | null,    // the button, so focus returns to it on close
  access?: 'anonymous' | 'authenticated',
})
```

The provider then normalises `source` with its own
`normalizePersonalizationSource`, stores it, and opens the ONE shared
`PersonalizationModal`.

### Where the provider is mounted

| Mount | Covers |
| --- | --- |
| `components/landing/LandingPage.js:139` | The landing page demo cards (#1) |
| `components/StandaloneShell.js:663` | **Every SmartVideo GO AI studio tab** — including GO-Viral (#5) and Thumbnail Studio |
| `app/demo/page.tsx:47` (`access="anonymous"`) | The free-discovery landing (#4) |
| `app/demo/[slug]/page.tsx:246` | The demo detail page (#2) |
| `app/personalization-demo/page.tsx:70` | The design preview (#3) |

Because `StandaloneShell` mounts the provider around **all** studio tabs, any
studio can call `useDemoPersonalize()` today — the only missing piece was a
shared way to describe what it wants to personalize. That is the contract.

### Studios with no entry point yet

All studios in `components/StandaloneShell.js` except GO-Viral, plus the
brand-studio route group. See the table in §3.

> Note (audit finding, not changed in this phase):
> `src/apps/go-ai-viral/GoAiViralStudio.tsx:481` and `:632` destructure
> `openPersonalize` from the context but never call it — dead bindings. They are
> left untouched here.

---

## 3. Studios still to be wired (later phases)

Nothing below is implemented yet. Each row is one line of integration guidance.

| Studio | Tab / route | Implementation | Media it holds | Integration note |
| --- | --- | --- | --- | --- |
| Image Studio | `image` | `packages/studio/src/components/ImageStudio.jsx` | generated image | Package studio: pass an `onPersonalize` prop from `StandaloneShell` (the `studio` package build has no `@/` alias) that calls `openPersonalize` with `mediaType: 'image'` and the generated image URL. |
| Video Studio | `video` | `packages/studio/src/components/VideoStudio.jsx` | generated video | Same prop bridge; `mediaType: 'video'` with the rendered video URL. |
| Lip Sync | `lipsync` | `packages/studio/src/components/LipSyncStudio.jsx` | lip-synced video | Prop bridge; `mediaType: 'video'`, `durationSeconds` from the clip length. |
| Body Swap | `recast` | `packages/studio/src/components/RecastStudio.jsx` | swapped video | Prop bridge; `mediaType: 'video'` with the swapped output. |
| Vibe Motion | `vibe-motion` | `packages/studio/src/components/VibeMotionStudio.jsx` | motion video | Prop bridge; `mediaType: 'video'`. |
| Motion Control | `motion-control` | `packages/studio/src/components/MotionControlStudio.jsx` | motion video | Prop bridge; `mediaType: 'video'`. |
| AI Clipping | `clipping` | `packages/studio/src/components/ClippingStudio.jsx` | clipped video | Prop bridge; `mediaType: 'video'`. |
| Cinema Studio | `cinema` | `packages/studio/src/components/CinemaStudio.jsx` | cinematic video | Prop bridge; `mediaType: 'video'`. |
| Marketing Studio | `marketing` | `packages/studio/src/components/MarketingStudio.jsx` | marketing video | Prop bridge; `mediaType: 'video'`. |
| Layers Studio | `layers` | `packages/studio/src/components/LayersStudio.jsx` | layered video | Prop bridge; `mediaType: 'video'`. |
| AI Influencer Studio | `ai-influencer` | `packages/studio/src/components/AiInfluencerStudio.jsx` | influencer video | Prop bridge; `mediaType: 'video'`. |
| Workflows | `workflows` | `packages/studio/src/components/WorkflowStudio.jsx` | workflow output | Prop bridge; `mediaType` from the produced asset. |
| Agents | `agents` | `packages/studio/src/components/AgentStudio.jsx` | agent output | Prop bridge; `mediaType` from the produced asset. |
| Audio Studio | `audio` | `packages/studio/src/components/AudioStudio.jsx` | audio only | No visual media to personalize — offer `mediaType: 'prompt-only'` (brand/voice brief) or skip. |
| Design Agent AI | `design-agent` | `src/apps/design-agent/DesignAgent.tsx` | conversation media | App-level studio: import the contract directly and call `useDemoPersonalize()` — no prop bridge needed. |
| VFX | `vfx-studio` | `src/apps/vfx-studio/VFXStudio.tsx` | VFX video | App-level studio: import the contract directly; `mediaType: 'video'` with the VFX output. |
| Storyboard | `storyboard` | `src/apps/storyboard/Storyboard.tsx` | shot images | App-level studio: import the contract directly; `mediaType: 'image'` with the selected shot's still, `projectRef` = shot id. |
| Social Publishing | `social-publishing` | `src/apps/social-publishing/SocialPublishing.tsx` | published media | App-level studio: import the contract directly; personalise the asset that is about to be published. |
| Brand Studio | `brand-studio` | `app/(brand-studio)/brand/[id]/page.tsx` | brand assets | Route group, **no provider mounted** — mount `DemoPersonalizeProvider` in `app/(brand-studio)/layout.tsx` first, then personalise with `mediaType: 'prompt-only'` + `brandAssets`. |
| Photo Studio | `/photo-studio` | `app/(brand-studio)/photo-studio/page.tsx` | product image | Same provider-mount prerequisite as Brand Studio; then `mediaType: 'image'` with the product photo. |
| SmartVideo GO AI Apps | `apps` | `packages/studio/src/components/AppsStudio.jsx` | app directory | Not a media surface — no entry point needed. |

### The one structural blocker for `packages/studio` studios

`packages/studio` is built with Babel and has **no `@/` path alias**
(`packages/studio/babel.config.json`). Its components therefore cannot import
`@/shared/personalization` today. Two options for the next phase:

1. **Prop bridge (recommended, no build change):** `StandaloneShell` already
   owns the provider; it can pass an `onPersonalize(payload)` callback into each
   package studio, and the package studio calls it with its own media. The
   bridge translates to the contract in one place.
2. **Alias the contract into the package build:** add a module-resolver
   Babel plugin (or a `studio/src/personalization-entry.js` re-export) so
   package studios can import the contract directly.

---

## 4. Verification

```bash
npx vitest run src/shared/personalization/__tests__/entryPoint.test.ts
npx tsc --noEmit
```

The test file covers:

- normalisation for **video**, **image** and **prompt-only** sources;
- **aspect ratio and duration** propagation (and the "no fabrication" rule);
- **brand assets** propagation (and the empty-value drop rule);
- the **completion callback** being invoked with the expected result shape —
  both as a pure function and through the **real** `DemoPersonalizeProvider`
  (mocked modal, mocked generation);
- the **existing entry points still behaving identically** — the raw landing
  demo, the free-discovery flow in `anonymous` mode, and the shared demo source
  mappers are asserted unchanged.
