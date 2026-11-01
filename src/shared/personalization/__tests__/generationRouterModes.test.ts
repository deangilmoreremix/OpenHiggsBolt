// @vitest-environment jsdom
/**
 * Every AI generation option reaches the right MuAPI call with usable inputs.
 * MuAPI is mocked (no credits are spent); the model registry is real, so a
 * model id that does not exist in the registry its call reads would fail here.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const openai = vi.hoisted(() => ({
  generateImage: vi.fn(async () => [{ url: 'https://openai.test/new.png' }]),
  editImage: vi.fn(async () => [{ b64_json: 'ZmFrZQ==' }]),
  createdWith: [] as string[],
}))
vi.mock('../openaiPersonalizationClient', () => ({
  createPersonalizationOpenAIClient: (key: string) => {
    openai.createdWith.push(key)
    return { generateImage: openai.generateImage, editImage: openai.editImage }
  },
}))

const muapi = vi.hoisted(() => ({
  generateVideo: vi.fn(async () => ({ url: 'https://cdn.muapi/out.mp4' })),
  generateI2V: vi.fn(async () => ({ url: 'https://cdn.muapi/out.mp4' })),
  processRecast: vi.fn(async () => ({ url: 'https://cdn.muapi/out.mp4' })),
  processV2V: vi.fn(async () => ({ url: 'https://cdn.muapi/out.mp4' })),
  uploadFile: vi.fn(async (_key: string, file: File) => `https://cdn.muapi/uploads/${file.name}`),
}))
vi.mock('@/packages/studio/src/muapi', () => muapi)

import { runGeneration, needsUpload, DEFAULT_V2V_EDIT_MODEL, DEFAULT_I2V_MODEL, FALLBACK_I2V_MODEL } from '../generationRouter'
import { FACE_SWAP_MODEL, FULL_BODY_MODEL, DEFAULT_T2V_MODEL } from '../modelCapabilityResolver'
import { getI2VModelById, getV2VModelById, getVideoModelById } from '@/packages/studio/src/models.js'
import type { GenerationInput } from '../generationRouter'

const OPTIONS = { engine: 'smartvideo-recommended', preserveAudio: true, exactLogoHandling: 'final-overlay', exactCtaHandling: 'ai-generated', firstFrameMode: 'none' } as never

function input(overrides: Partial<GenerationInput> & { directInputs?: Record<string, unknown> } = {}): GenerationInput {
  const { directInputs = {}, ...rest } = overrides
  return {
    source: { id: 'demo', title: 'Demo', mediaType: 'video', sourceMedia: '/media/demo.mp4', originalPrompt: '', fullPrompt: '', shortPrompt: '', sourceType: 'landing-demo', sourceMetadata: {} } as never,
    client: {},
    assets: {} as never,
    resolved: { directInputs, promptContext: {}, preProcessing: {}, postProcessing: {}, unusedSavedReferences: [] },
    prompt: 'Recreate this video for Acme Roofing.',
    mode: null,
    options: OPTIONS,
    apiKey: 'mu-key',
    ...rest,
  }
}

beforeEach(() => {
  for (const fn of Object.values(muapi)) fn.mockClear()
  openai.generateImage.mockClear()
  openai.editImage.mockClear()
  openai.createdWith.length = 0
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, blob: async () => new Blob(['bytes'], { type: 'video/mp4' }) })))
})

describe('the default models exist in the registry each call reads', () => {
  it('has every model the router picks by itself', () => {
    expect(getV2VModelById(FACE_SWAP_MODEL)).toBeTruthy()
    expect(getV2VModelById(DEFAULT_V2V_EDIT_MODEL)).toBeTruthy()
    expect(getI2VModelById(DEFAULT_I2V_MODEL)).toBeTruthy()
    expect(getI2VModelById(FALLBACK_I2V_MODEL)).toBeTruthy()
    expect(getVideoModelById(DEFAULT_T2V_MODEL)).toBeTruthy()
  })
})

describe('local files are uploaded so MuAPI can read them', () => {
  it('flags relative, blob, data and same-host URLs only', () => {
    expect(needsUpload('/media/demo.mp4')).toBe(true)
    expect(needsUpload('blob:http://localhost/x')).toBe(true)
    expect(needsUpload('data:image/png;base64,AA')).toBe(true)
    expect(needsUpload(`${window.location.origin}/media/demo.mp4`)).toBe(true)
    expect(needsUpload('https://cdn.example.com/demo.mp4')).toBe(false)
  })
})

describe('video options', () => {
  it('recreate (no mode chosen) edits the demo video, uploaded first', async () => {
    const result = await runGeneration(input({ directInputs: { video_url: '/media/demo.mp4' } }))
    expect(muapi.uploadFile).toHaveBeenCalledTimes(1)
    expect(muapi.processV2V).toHaveBeenCalledWith('mu-key', expect.objectContaining({
      model: DEFAULT_V2V_EDIT_MODEL,
      video_url: 'https://cdn.muapi/uploads/demo.mp4',
      prompt: 'Recreate this video for Acme Roofing.',
    }))
    expect(muapi.generateVideo).not.toHaveBeenCalled()
    expect(result).toMatchObject({ type: 'video', url: 'https://cdn.muapi/out.mp4' })
  })

  it("keeps a demo's own video-edit model", async () => {
    const source = { ...input().source, model: 'kling-o1-video-edit-fast' }
    await runGeneration(input({ source, mode: 'complete', directInputs: { video_url: '/media/demo.mp4' } }))
    expect(muapi.processV2V).toHaveBeenCalledWith('mu-key', expect.objectContaining({ model: 'kling-o1-video-edit-fast' }))
  })

  it('face swap sends the video and the face photo to the face-swap model', async () => {
    await runGeneration(input({ mode: 'face_only', directInputs: { video_url: '/media/demo.mp4', image_url: 'https://cdn.example.com/face.jpg' } }))
    expect(muapi.processV2V).toHaveBeenCalledWith('mu-key', expect.objectContaining({
      model: FACE_SWAP_MODEL,
      video_url: 'https://cdn.muapi/uploads/demo.mp4',
      image_url: 'https://cdn.example.com/face.jpg',
    }))
  })

  it('face swap without a face photo explains what is missing', async () => {
    await expect(runGeneration(input({ mode: 'face_only', directInputs: { video_url: '/media/demo.mp4' } }))).rejects.toThrow(/identity image/i)
  })

  it('full body replacement uses the recast model', async () => {
    await runGeneration(input({ mode: 'full_body', directInputs: { video_url: '/media/demo.mp4', image_url: 'https://cdn.example.com/person.jpg' } }))
    expect(muapi.processRecast).toHaveBeenCalledWith('mu-key', expect.objectContaining({ model: FULL_BODY_MODEL, image_url: 'https://cdn.example.com/person.jpg' }))
  })

  it('animates a photo with an image-to-video model, falling back to a second one', async () => {
    const source = { ...input().source, sourceMedia: null }
    muapi.generateI2V.mockRejectedValueOnce(new Error('model busy'))
    await runGeneration(input({ source, mode: 'recreate', directInputs: { image_url: 'https://cdn.example.com/photo.jpg' } }))
    expect(muapi.generateI2V).toHaveBeenNthCalledWith(1, 'mu-key', expect.objectContaining({ model: DEFAULT_I2V_MODEL }))
    expect(muapi.generateI2V).toHaveBeenNthCalledWith(2, 'mu-key', expect.objectContaining({ model: FALLBACK_I2V_MODEL }))
  })

  it('creates a video from the prompt alone when there is nothing to start from', async () => {
    const source = { ...input().source, sourceMedia: null }
    await runGeneration(input({ source, mode: 'recreate' }))
    expect(muapi.generateVideo).toHaveBeenCalledWith('mu-key', expect.objectContaining({ model: DEFAULT_T2V_MODEL }))
  })
})

describe('image options (OpenAI with the visitor\'s own OpenAI key)', () => {
  const imageSource = { id: 'img', title: 'Img', mediaType: 'image', sourceMedia: '/media/ad.png', originalPrompt: '', fullPrompt: '', shortPrompt: '', sourceType: 'landing-demo', sourceMetadata: {} } as never

  for (const mode of ['keep_design', 'replace_face', 'replace_person'] as const) {
    it(`${mode} edits the ORIGINAL image, with the reference photo alongside`, async () => {
      await runGeneration(input({ source: imageSource, mode, openaiKey: 'sk-openai', directInputs: { image_url: 'https://cdn.example.com/face.jpg' } }))
      expect(openai.createdWith).toEqual(['sk-openai'])
      expect(openai.editImage).toHaveBeenCalledTimes(1)
      const params = (openai.editImage.mock.calls[0] as unknown[])[0] as { image: Blob; references: Blob[]; model?: string }
      // Edited image came from the original (/media/ad.png), the face as a reference.
      expect(vi.mocked(fetch).mock.calls[0][0]).toBe('/media/ad.png')
      expect(params.references).toHaveLength(1)
      // A MuAPI model id is never sent to OpenAI.
      expect(params.model).toBeUndefined()
      expect(muapi.uploadFile).not.toHaveBeenCalled()
    })
  }

  for (const mode of ['recreate', 'complete'] as const) {
    it(`${mode} creates a new image from the prompt`, async () => {
      await runGeneration(input({ source: imageSource, mode, openaiKey: 'sk-openai' }))
      expect(openai.generateImage).toHaveBeenCalledTimes(1)
    })
  }

  it('asks for the OpenAI key instead of sending the MuAPI key to OpenAI', async () => {
    await expect(runGeneration(input({ source: imageSource, mode: 'keep_design' }))).rejects.toThrow(/OpenAI key/)
    expect(openai.createdWith).toEqual([])
  })
})
