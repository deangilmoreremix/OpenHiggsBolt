// @vitest-environment jsdom
/**
 * Shared Personalization entry-point contract — unit tests.
 *
 * Two layers are covered here:
 *
 *  1. The pure adapter (`src/shared/personalization/entryPoint.ts`): contract
 *     normalisation for video / image / prompt-only sources, aspect ratio and
 *     duration propagation, brand-asset propagation and completion-callback
 *     delivery — none of which needs the modal mounted.
 *  2. The EXISTING provider: the same contract is opened through the real
 *     `DemoPersonalizeProvider`, which proves the adapter speaks the provider's
 *     own language, and that the pre-existing entry points (landing demo,
 *     free discovery) still behave identically.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'

import {
  PERSONALIZATION_ENTRY_POINT_SOURCE_TYPE,
  createPersonalizationOpenOptions,
  deliverPersonalizationResult,
  toPersonalizationOpenRequest,
} from '../entryPoint'
import type { PersonalizationEntryPoint, PersonalizationResult } from '../entryPoint'
import {
  MEDIA_PENDING_KEY,
  buildDemoPersonalizeSource,
  buildFreeDiscoverySource,
  isMediaPending,
} from '../demoSources'
import { normalizePersonalizationSource } from '../sourceNormalizer'
import type { VideoDemo } from '@/data/types'

// ── Provider mocks (the modal itself is never mounted) ────────────────────────

vi.mock('studio/src/muapi', () => ({
  uploadFile: vi.fn(),
}))

vi.mock('../assetUploadService', () => ({
  uploadPersonalizationAsset: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}))

vi.mock('@/components/SocialPublishProvider', () => ({
  SocialPublishContext: {
    Provider: ({ children }: any) => children,
    Consumer: ({ children }: any) => children(null),
  } as any,
  useSocialPublish: () => {
    throw new Error('useSocialPublish must be used within a <SocialPublishProvider>')
  },
}))

vi.mock('@/lib/authConfig', () => ({
  useAuthConfig: () => ({
    apiKey: 'test-key',
    openaiKey: '',
    setApiKey: vi.fn(),
    setOpenAiKey: vi.fn(),
    clearApiKey: vi.fn(),
    clearAllKeys: vi.fn(),
    hasApiKey: true,
    hasOpenaiKey: false,
    isAuthenticated: true,
  }),
}))

vi.mock('../promptPersonalizer', () => ({
  personalizePrompt: vi.fn(),
  regeneratePrompt: vi.fn(),
}))

vi.mock('../generationRouter', () => ({
  runGeneration: vi.fn(),
}))

vi.mock('../postProcessor', () => ({
  applyPostProcessing: vi.fn(),
  generateEndCardImage: vi.fn(),
}))

vi.mock('../PersonalizationModal', () => ({
  default: () => null,
}))

vi.mock('../editedAssetPersistence', () => ({
  persistEditedPersonalizationAsset: vi.fn(),
}))

const { DemoPersonalizeProvider, useDemoPersonalize } = await import('../DemoPersonalizeProvider')
const { runGeneration } = await import('../generationRouter')
const { applyPostProcessing } = await import('../postProcessor')

// ── Fixtures ─────────────────────────────────────────────────────────────────

const videoEntry: PersonalizationEntryPoint = {
  originatingStudio: 'cinema',
  projectRef: 'clip-42',
  sourceVideo: 'https://cdn.example.com/clip-42.mp4',
  sourceImage: 'https://cdn.example.com/clip-42-poster.jpg',
  mediaType: 'video',
  aspectRatio: '9:16',
  durationSeconds: 12,
  brandAssets: {
    logoUrl: 'https://cdn.example.com/logo.png',
    brandName: 'Acme',
    brandColors: ['#22d3ee', '#a855f7'],
  },
  prompt: 'A cinematic product reveal.',
}

const imageEntry: PersonalizationEntryPoint = {
  originatingStudio: 'thumbnail-studio',
  sourceImage: 'https://cdn.example.com/thumb-1.png',
  mediaType: 'image',
  aspectRatio: '16:9',
}

const promptOnlyEntry: PersonalizationEntryPoint = {
  originatingStudio: 'workflows',
  mediaType: 'prompt-only',
  prompt: 'Write a launch script for a new product.',
}

const legacyDemo: VideoDemo = {
  id: 'legacy-demo-1',
  slug: 'legacy-demo-1',
  title: 'Legacy Demo',
  prompt: 'A legacy demo prompt.',
  videoSrc: '/media/legacy/legacy-demo-1.webm',
  posterSrc: '/media/legacy/legacy-demo-1.svg',
  aspectRatio: '16:9',
  duration: 15,
  durationLabel: '15s',
  model: 'legacy-model',
  modelName: 'Legacy Model',
  category: 'Test',
  useCase: 'A legacy demo',
  sourceRepo: 'legacy',
  tags: [],
} as unknown as VideoDemo

// ── Pure adapter ─────────────────────────────────────────────────────────────

describe('toPersonalizationOpenRequest — video source', () => {
  const request = toPersonalizationOpenRequest(videoEntry)

  it('keeps the studio video as the playable source media', () => {
    expect(request.source.mediaType).toBe('video')
    expect(request.source.sourceMedia).toBe('https://cdn.example.com/clip-42.mp4')
    expect(request.source.poster).toBe('https://cdn.example.com/clip-42-poster.jpg')
    expect(request.source.sourceType).toBe(PERSONALIZATION_ENTRY_POINT_SOURCE_TYPE)
  })

  it('propagates the aspect ratio and the duration', () => {
    expect(request.source.aspectRatio).toBe('9:16')
    expect(request.source.duration).toBe(12)
    expect(request.source.durationLabel).toBe('12s')
  })

  it('propagates the brand assets', () => {
    expect(request.source.sourceMetadata.brandAssets).toEqual({
      logoUrl: 'https://cdn.example.com/logo.png',
      brandName: 'Acme',
      brandColors: ['#22d3ee', '#a855f7'],
    })
  })

  it('records the originating studio and the project reference', () => {
    expect(request.source.sourceMetadata.originatingStudio).toBe('cinema')
    expect(request.source.sourceMetadata.projectRef).toBe('clip-42')
    expect(request.source.id).toBe('cinema:clip-42')
  })

  it('carries the studio prompt and defaults the access mode to authenticated', () => {
    expect(request.source.originalPrompt).toBe('A cinematic product reveal.')
    expect(request.source.fullPrompt).toBe('A cinematic product reveal.')
    expect(request.source.shortPrompt).toBe('A cinematic product reveal.')
    expect(request.access).toBe('authenticated')
  })
})

describe('toPersonalizationOpenRequest — image source', () => {
  const request = toPersonalizationOpenRequest(imageEntry)

  it('keeps the studio image as both the source media and the poster', () => {
    expect(request.source.mediaType).toBe('image')
    expect(request.source.sourceMedia).toBe('https://cdn.example.com/thumb-1.png')
    expect(request.source.poster).toBe('https://cdn.example.com/thumb-1.png')
  })

  it('propagates the aspect ratio and leaves the duration undefined', () => {
    expect(request.source.aspectRatio).toBe('16:9')
    expect(request.source.duration).toBeUndefined()
    expect(request.source.durationLabel).toBeUndefined()
  })

  it('does not flag pending media when the image is present', () => {
    expect(request.source.sourceMetadata[MEDIA_PENDING_KEY]).toBeUndefined()
    expect(isMediaPending(request.source)).toBe(false)
  })
})

describe('toPersonalizationOpenRequest — prompt-only source', () => {
  const request = toPersonalizationOpenRequest(promptOnlyEntry)

  it('has no media at all and is not flagged as pending media', () => {
    expect(request.source.mediaType).toBe('prompt-only')
    expect(request.source.sourceMedia).toBeNull()
    expect(request.source.poster).toBeNull()
    expect(request.source.sourceMetadata[MEDIA_PENDING_KEY]).toBeUndefined()
    expect(isMediaPending(request.source)).toBe(false)
  })

  it('keeps the studio prompt', () => {
    expect(request.source.originalPrompt).toBe('Write a launch script for a new product.')
  })
})

describe('toPersonalizationOpenRequest — no substitution, no fabrication', () => {
  it('never borrows the image URL for a video source', () => {
    const request = toPersonalizationOpenRequest({
      ...videoEntry,
      sourceVideo: undefined,
    })

    expect(request.source.mediaType).toBe('video')
    expect(request.source.sourceMedia).toBeNull()
    expect(request.source.sourceMetadata[MEDIA_PENDING_KEY]).toBe(true)
    expect(isMediaPending(request.source)).toBe(true)
    // The poster is still the studio's own image.
    expect(request.source.poster).toBe('https://cdn.example.com/clip-42-poster.jpg')
  })

  it('does not invent an aspect ratio or duration the studio did not declare', () => {
    const request = toPersonalizationOpenRequest({
      originatingStudio: 'vfx-studio',
      mediaType: 'video',
      sourceVideo: 'https://cdn.example.com/vfx.mp4',
    })

    expect(request.source.aspectRatio).toBeUndefined()
    expect(request.source.duration).toBeUndefined()
    expect(request.source.durationLabel).toBeUndefined()
  })

  it('drops empty brand fields instead of handing blanks to the modal', () => {
    const request = toPersonalizationOpenRequest({
      ...imageEntry,
      brandAssets: { logoUrl: '   ', brandName: '', brandColors: [] },
    })

    expect(request.source.sourceMetadata.brandAssets).toBeUndefined()
  })

  it('produces a source the provider accepts unchanged', () => {
    const request = toPersonalizationOpenRequest(videoEntry)

    // The provider's own normaliser must not rewrite an already-normalised
    // source — that is what makes the adapter safe to plug into the existing
    // provider.
    expect(normalizePersonalizationSource(request.source)).toEqual(request.source)
  })
})

describe('createPersonalizationOpenOptions', () => {
  it('produces options the existing provider accepts', () => {
    const options = createPersonalizationOpenOptions(videoEntry)

    expect(options.source).toEqual(toPersonalizationOpenRequest(videoEntry).source)
    expect(options.access).toBe('authenticated')
    expect(options.trigger).toBeNull()
    expect(options.onComplete).toBeUndefined()
  })

  it('carries the trigger element and the completion callback through', () => {
    const onComplete = vi.fn()
    const trigger = document.createElement('button')
    const options = createPersonalizationOpenOptions(
      { ...videoEntry, onComplete },
      { trigger },
    )

    expect(options.trigger).toBe(trigger)
    expect(options.onComplete).toBe(onComplete)
  })
})

describe('deliverPersonalizationResult', () => {
  it('invokes the completion callback with the result shape', () => {
    const onComplete = vi.fn()
    const result: PersonalizationResult = {
      type: 'image',
      url: 'https://cdn.example.com/personalized.png',
      prompt: 'A personalized prompt',
      metadata: { model: 'gpt-image-2' },
    }

    const returned = deliverPersonalizationResult(result, onComplete)

    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(onComplete).toHaveBeenCalledWith(result)
    expect(returned).toBe(result)
  })

  it('is a no-op when no callback was supplied', () => {
    const result: PersonalizationResult = { type: 'prompt', prompt: 'hello' }

    expect(deliverPersonalizationResult(result)).toBe(result)
    expect(deliverPersonalizationResult(result, undefined)).toBe(result)
  })
})

// ── Existing provider integration ────────────────────────────────────────────

function TestOpener() {
  const ctx = useDemoPersonalize()
  ;(window as any).__personalizationCtx = ctx
  return null
}

async function renderProvider() {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)

  await act(async () => {
    root.render(
      createElement(
        DemoPersonalizeProvider,
        null,
        createElement(TestOpener),
      ),
    )
  })

  return container
}

const ctx = () => (window as any).__personalizationCtx

beforeEach(() => {
  vi.clearAllMocks()
  URL.createObjectURL = vi.fn(() => 'blob:http://localhost/test')
  URL.revokeObjectURL = vi.fn()
  if (typeof window !== 'undefined') localStorage.clear()
})

describe('shared contract against the existing provider', () => {
  it('opens the existing modal with the contract source', async () => {
    await renderProvider()

    await act(async () => {
      ctx().openPersonalize(createPersonalizationOpenOptions(videoEntry))
    })
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })

    expect(ctx().isOpen).toBe(true)
    expect(ctx().source.sourceType).toBe(PERSONALIZATION_ENTRY_POINT_SOURCE_TYPE)
    expect(ctx().source.sourceMedia).toBe('https://cdn.example.com/clip-42.mp4')
    expect(ctx().source.poster).toBe('https://cdn.example.com/clip-42-poster.jpg')
    expect(ctx().source.aspectRatio).toBe('9:16')
    expect(ctx().source.duration).toBe(12)
    expect(ctx().source.sourceMetadata.brandAssets).toEqual({
      logoUrl: 'https://cdn.example.com/logo.png',
      brandName: 'Acme',
      brandColors: ['#22d3ee', '#a855f7'],
    })
  })

  it('opens the existing modal with a prompt-only source', async () => {
    await renderProvider()

    await act(async () => {
      ctx().openPersonalize(createPersonalizationOpenOptions(promptOnlyEntry))
    })
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })

    expect(ctx().isOpen).toBe(true)
    expect(ctx().source.mediaType).toBe('prompt-only')
    expect(ctx().source.sourceMedia).toBeNull()
    expect(ctx().source.originalPrompt).toBe('Write a launch script for a new product.')
  })

  it('invokes the completion callback with the expected result shape', async () => {
    ;(runGeneration as any).mockImplementation(async () => ({
      type: 'video',
      url: 'https://example.com/video.mp4',
      metadata: { model: 'test-model' },
    }))
    ;(applyPostProcessing as any).mockResolvedValue({
      finalUrl: 'https://example.com/video-final.mp4',
      originalUrl: 'https://example.com/video.mp4',
      applied: [],
    })

    const onComplete = vi.fn()

    await renderProvider()

    await act(async () => {
      ctx().openPersonalize(
        createPersonalizationOpenOptions(
          { ...videoEntry, model: 'kling-o1-video-edit', onComplete },
        ),
      )
    })
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })

    await act(async () => {
      ctx().updateClientForm({ businessName: 'Test Co' })
      ctx().setOutputType('video')
      ctx().setMode('recreate')
    })

    await act(async () => {
      ctx().generate()
    })
    await act(async () => {
      await new Promise((r) => setTimeout(r, 500))
    })

    expect(ctx().generation.status).toBe('complete')
    expect(onComplete).toHaveBeenCalledTimes(1)

    const delivered = onComplete.mock.calls[0][0] as PersonalizationResult
    expect(delivered.type).toBe('video')
    expect(delivered.url).toBe('https://example.com/video-final.mp4')
    expect(delivered).toEqual(ctx().result)
  })
})

describe('regression guard — pre-existing entry points are unchanged', () => {
  it('still normalises a raw landing demo exactly as before', async () => {
    await renderProvider()

    await act(async () => {
      ctx().openPersonalize({ source: legacyDemo })
    })
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })

    expect(ctx().isOpen).toBe(true)
    expect(ctx().source.sourceType).toBe('landing-demo')
    expect(ctx().source.sourceMedia).toBe('/media/legacy/legacy-demo-1.webm')
    expect(ctx().source.poster).toBe('/media/legacy/legacy-demo-1.svg')
    expect(ctx().source.aspectRatio).toBe('16:9')
    expect(ctx().source.duration).toBe(15)
    expect(ctx().source.originalPrompt).toBe('A legacy demo prompt.')
    expect(ctx().access).toBe('authenticated')
  })

  it('still opens the free-discovery entry point in anonymous mode', async () => {
    await renderProvider()

    await act(async () => {
      ctx().openPersonalize({ source: buildFreeDiscoverySource(), access: 'anonymous' })
    })
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })

    expect(ctx().isOpen).toBe(true)
    expect(ctx().access).toBe('anonymous')
    expect(ctx().source.sourceType).toBe('landing-demo')
    expect(ctx().source.mediaType).toBe('prompt-only')
    expect(ctx().source.sourceMetadata.freeDiscovery).toBe(true)
  })

  it('leaves the shared demo source mappers untouched', () => {
    const source = buildDemoPersonalizeSource(legacyDemo)

    expect(source.sourceType).toBe('landing-demo')
    expect(source.id).toBe('legacy-demo-1')
    expect(source.sourceMedia).toBe('/media/legacy/legacy-demo-1.webm')
    expect(source.aspectRatio).toBe('16:9')
    expect(source.duration).toBe(15)
    expect(normalizePersonalizationSource(source)).toEqual(source)
  })
})
