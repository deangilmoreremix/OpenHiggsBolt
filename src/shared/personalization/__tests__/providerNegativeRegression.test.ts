/**
 * Phase 29 - Provider Negative Regression Tests
 *
 * Proves the Personalization AI Assist provider architecture:
 * - IMAGE path: OpenAI image endpoint IS called; MuAPI image endpoint IS NOT called
 * - VIDEO path: MuAPI video endpoint IS called; OpenAI image endpoint IS NOT used for video
 *
 * These are mandatory architectural regression tests.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest'
import { runGeneration } from '@/shared/personalization/generationRouter'
import type { PersonalizationSource, AssetLibrary, ResolvedAssets, GenerationOptions } from '@/shared/personalization/types'

// ── Mocks ─────────────────────────────────────────────────────────────────────

// Track every OpenAI call
const openaiCalls: { endpoint: string; body?: unknown }[] = []

vi.mock('@/shared/personalization/openaiPersonalizationClient', () => {
  const actual = vi.importActual('@/shared/personalization/openaiPersonalizationClient')
  return {
    ...(actual as any),
    createPersonalizationOpenAIClient: vi.fn(() => ({
      generateImage: vi.fn(async (params: unknown) => {
        openaiCalls.push({ endpoint: '/images/generations', body: params })
        return [{ url: 'https://openai.test/image.png', revisedPrompt: 'revised' }]
      }),
      editImage: vi.fn(async (params: unknown) => {
        openaiCalls.push({ endpoint: '/images/edits', body: params })
        return [{ b64_json: 'ZmFrZQ==' }]
      }),
    })),
  }
})

// Mock MuAPI - we spy on the actual exports so toHaveBeenCalled works
const muapiCalls: Record<string, unknown[]> = {
  generateImage: [],
  generateI2I: [],
  generateVideo: [],
  generateI2V: [],
  processV2V: [],
  processRecast: [],
  processLipSync: [],
  uploadFile: [],
}

vi.mock('studio/src/muapi', () => {
  const makeSpy = (name: string) => {
    return vi.fn(async (params: unknown) => {
      muapiCalls[name].push(params)
      return { url: `https://muapi.test/${name}.mp4`, outputs: [`https://muapi.test/${name}.mp4`] }
    })
  }

  return {
    generateImage: makeSpy('generateImage'),
    generateI2I: makeSpy('generateI2I'),
    generateVideo: makeSpy('generateVideo'),
    generateI2V: makeSpy('generateI2V'),
    processV2V: makeSpy('processV2V'),
    processRecast: makeSpy('processRecast'),
    processLipSync: makeSpy('processLipSync'),
    uploadFile: makeSpy('uploadFile'),
  }
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeImageSource(overrides: Partial<PersonalizationSource> = {}): PersonalizationSource {
  return {
    sourceType: 'landing-demo',
    id: 'demo-1',
    title: 'Test Demo',
    mediaType: 'image',
    sourceMedia: 'https://example.com/source.png',
    poster: null,
    shortPrompt: 'test',
    fullPrompt: 'test',
    originalPrompt: 'test',
    aspectRatio: '1:1',
    sourceMetadata: {},
    ...overrides,
  }
}

function makeVideoSource(overrides: Partial<PersonalizationSource> = {}): PersonalizationSource {
  return {
    sourceType: 'landing-demo',
    id: 'demo-2',
    title: 'Test Video',
    mediaType: 'video',
    sourceMedia: 'https://example.com/source.mp4',
    poster: null,
    shortPrompt: 'test',
    fullPrompt: 'test',
    originalPrompt: 'test',
    aspectRatio: '16:9',
    duration: 10,
    sourceMetadata: {},
    ...overrides,
  }
}

function makeAssets(overrides: Partial<AssetLibrary> = {}): AssetLibrary {
  return {
    identities: [],
    primaryIdentity: null,
    logos: [],
    primaryLogo: null,
    products: [],
    brandReferences: [],
    firstFrame: null,
    lastFrame: null,
    ctaGraphic: null,
    audio: [],
    savedReferences: [],
    ...overrides,
  }
}

function makeResolved(overrides: Partial<ResolvedAssets> = {}): ResolvedAssets {
  return {
    directInputs: {},
    promptContext: {},
    preProcessing: {},
    postProcessing: {},
    unusedSavedReferences: [],
    ...overrides,
  }
}

const baseOptions: GenerationOptions = {
  engine: 'smartvideo-recommended',
  preserveAudio: true,
  exactLogoHandling: 'final-overlay',
  exactCtaHandling: 'final-end-card',
  firstFrameMode: 'none',
  lastFrameMode: 'none',
  consentGiven: true,
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Phase 29 - Provider Negative Regression Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    openaiCalls.length = 0
    for (const key of Object.keys(muapiCalls)) {
      muapiCalls[key].length = 0
    }

    const mockBlob = { blob: () => Promise.resolve(new Blob(['test'], { type: 'image/png' })) }

    ;(global as any).fetch = vi.fn(async (_url: string) => {
      const urlStr = String(_url)
      if (urlStr.includes('/images/generations') || urlStr.includes('/images/edits')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ data: [{ url: 'https://openai.test/image.png' }] }),
          text: async () => '{}',
          headers: new Headers(),
          blob: () => Promise.resolve(new Blob(['test'], { type: 'image/png' })),
        }
      }
      if (urlStr.includes('/api/v1/predictions/') && urlStr.includes('/result')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ status: 'completed', url: 'https://muapi.test/video.mp4', outputs: ['https://muapi.test/video.mp4'] }),
          text: async () => '{}',
          headers: new Headers(),
        }
      }
      if (urlStr.includes('/api/v1/')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ request_id: 'req-123', url: 'https://muapi.test/video.mp4', outputs: ['https://muapi.test/video.mp4'] }),
          text: async () => '{}',
          headers: new Headers(),
        }
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({}),
        text: async () => '{}',
        headers: new Headers(),
        blob: () => Promise.resolve(new Blob(['test'], { type: 'image/png' })),
      }
    })
  })

  // ── IMAGE PATH ─────────────────────────────────────────────────────────────

  describe('IMAGE path', () => {
    it('text-to-image: calls OpenAI /images/generations and NEVER calls MuAPI generateImage', async () => {
      const result = await runGeneration({
        source: makeImageSource(),
        client: {},
        assets: makeAssets(),
        resolved: makeResolved(),
        prompt: 'A futuristic city at sunset',
        mode: 'recreate',
        options: baseOptions,
        apiKey: 'sk-test',
      })

      expect(result.type).toBe('image')
      expect(result.url).toBe('https://openai.test/image.png')

      // OpenAI MUST have been called for generations
      const generationCalls = openaiCalls.filter((c) => c.endpoint === '/images/generations')
      expect(generationCalls.length).toBeGreaterThanOrEqual(1)

      // MuAPI image functions MUST NOT have been called
      expect(muapiCalls.generateImage).toHaveLength(0)
      expect(muapiCalls.generateI2I).toHaveLength(0)
    })

    it('image-to-image (replace_face): calls OpenAI /images/edits and NEVER calls MuAPI generateI2I', async () => {
      const source = makeImageSource({
        sourceMedia: 'https://example.com/source.png',
      })
      const resolved = makeResolved({
        directInputs: { image_url: 'https://example.com/source.png' },
      })

      const result = await runGeneration({
        source,
        client: {},
        assets: makeAssets(),
        resolved,
        prompt: 'Replace the face with a professional headshot',
        mode: 'replace_face',
        options: baseOptions,
        apiKey: 'sk-test',
      })

      expect(result.type).toBe('image')

      // OpenAI edit MUST have been called
      const editCalls = openaiCalls.filter((c) => c.endpoint === '/images/edits')
      expect(editCalls.length).toBeGreaterThanOrEqual(1)

      // MuAPI image functions MUST NOT have been called
      expect(muapiCalls.generateI2I).toHaveLength(0)
    })

    it('image personalization (keep_design): calls OpenAI /images/edits and NEVER MuAPI', async () => {
      const source = makeImageSource({
        sourceMedia: 'https://example.com/source.png',
      })
      const resolved = makeResolved({
        directInputs: { image_url: 'https://example.com/source.png' },
      })

      const result = await runGeneration({
        source,
        client: {},
        assets: makeAssets(),
        resolved,
        prompt: 'Keep the design but improve colors',
        mode: 'keep_design',
        options: baseOptions,
        apiKey: 'sk-test',
      })

      expect(result.type).toBe('image')
      const editCalls = openaiCalls.filter((c) => c.endpoint === '/images/edits')
      expect(editCalls.length).toBeGreaterThanOrEqual(1)

      expect(muapiCalls.generateImage).toHaveLength(0)
      expect(muapiCalls.generateI2I).toHaveLength(0)
    })
  })

  // ── VIDEO PATH ──────────────────────────────────────────────────────────────

  describe('VIDEO path', () => {
    it('recreate (t2v): calls MuAPI generateVideo, NEVER calls OpenAI for image generation', async () => {
      const result = await runGeneration({
        source: makeVideoSource(),
        client: {},
        assets: makeAssets(),
        resolved: makeResolved(),
        prompt: 'A product showcase video',
        mode: 'recreate',
        options: { ...baseOptions, model: 'veo-4-text-to-video' },
        apiKey: 'sk-test',
      })

      expect(result.type).toBe('video')

      // MuAPI video MUST have been called
      expect(muapiCalls.generateVideo).toHaveLength(1)

      // OpenAI image generation MUST NOT have been called for the video path
      const generationCalls = openaiCalls.filter((c) => c.endpoint === '/images/generations')
      expect(generationCalls.length).toBe(0)
    })

    it('face_only (v2v): calls MuAPI processV2V, NEVER calls OpenAI image generation', async () => {
      const source = makeVideoSource({
        sourceMedia: 'https://example.com/source.mp4',
      })
      const resolved = makeResolved({
        directInputs: {
          video_url: 'https://example.com/source.mp4',
          image_url: 'https://example.com/identity.jpg',
        },
      })

      const result = await runGeneration({
        source,
        client: {},
        assets: makeAssets({
          identities: [{ id: 'id-1', url: 'https://example.com/identity.jpg', isPrimary: true, createdAt: '', role: 'presenter_identity', name: 'Test', uploadStatus: 'ready' }],
          primaryIdentity: { id: 'id-1', url: 'https://example.com/identity.jpg', isPrimary: true, createdAt: '', role: 'presenter_identity', name: 'Test', uploadStatus: 'ready' },
        }),
        resolved,
        prompt: 'Swap the face',
        mode: 'face_only',
        options: { ...baseOptions, model: 'ai-video-face-swap' },
        apiKey: 'sk-test',
      })

      expect(result.type).toBe('video')

      expect(muapiCalls.processV2V).toHaveLength(1)

      const generationCalls = openaiCalls.filter((c) => c.endpoint === '/images/generations')
      expect(generationCalls.length).toBe(0)
    })

    it('i2v (image-to-video): calls MuAPI generateI2V, NEVER calls OpenAI image generation', async () => {
      const source = makeVideoSource()
      const resolved = makeResolved({
        directInputs: { image_url: 'https://example.com/first-frame.png' },
      })

      const result = await runGeneration({
        source,
        client: {},
        assets: makeAssets(),
        resolved,
        prompt: 'Animate this image',
        mode: 'recreate',
        options: { ...baseOptions, model: 'seedance-2-t2v' },
        apiKey: 'sk-test',
      })

      expect(result.type).toBe('video')

      expect(muapiCalls.generateI2V).toHaveLength(1)

      const generationCalls = openaiCalls.filter((c) => c.endpoint === '/images/generations')
      expect(generationCalls.length).toBe(0)
    })
  })
})
