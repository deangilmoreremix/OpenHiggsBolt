import { describe, expect, it } from 'vitest'
import {
  FACE_SWAP_MODEL,
  FULL_BODY_MODEL,
  optionsForGeneration,
  resolveAssetsForModel,
  resolveModelCapabilities,
} from '../modelCapabilityResolver'

// Face only / Full presenter used to work out what to send from the demo's own
// model (e.g. a text-to-video model), so the presenter photo was never sent and
// the run failed with "No identity image provided".

const demo = {
  id: 'demo-1', title: 'Demo', mediaType: 'video', originalPrompt: 'p', fullPrompt: 'p', shortPrompt: 'p',
  sourceMedia: 'https://cdn.example/demo.mp4', poster: null, sourceType: 'landing-demo', sourceMetadata: {},
  model: 'veo-4-text-to-video',
} as any

const photo = {
  id: 'face-1', name: 'face.jpg', role: 'presenter_identity', url: 'https://cdn.example/face.jpg',
  uploadedUrl: 'https://cdn.example/face.jpg', uploadStatus: 'ready', isPrimary: true,
} as any

const assets = {
  identities: [photo], primaryIdentity: photo, logos: [], primaryLogo: null, products: [], brandReferences: [],
  firstFrame: null, lastFrame: null, ctaGraphic: null, savedReferences: [],
} as any

const options = { engine: 'smartvideo-recommended', preserveAudio: true, consentGiven: true } as any

describe('generation uses the model the mode really calls', () => {
  it('Face only sends the presenter photo even when the demo uses another model', () => {
    const modelOptions = optionsForGeneration(demo, options, 'face_only')
    expect(modelOptions.model).toBe(FACE_SWAP_MODEL)
    const resolved = resolveAssetsForModel(demo, assets, 'face_only', modelOptions, resolveModelCapabilities(demo, modelOptions))
    expect(resolved.directInputs.image_url).toBe('https://cdn.example/face.jpg')
  })

  it('Full presenter sends the presenter photo', () => {
    const modelOptions = optionsForGeneration(demo, options, 'full_body')
    expect(modelOptions.model).toBe(FULL_BODY_MODEL)
    const resolved = resolveAssetsForModel(demo, assets, 'full_body', modelOptions, resolveModelCapabilities(demo, modelOptions))
    expect(resolved.directInputs.image_url).toBe('https://cdn.example/face.jpg')
  })

  it("(the old way: the demo's own model) never sent the photo", () => {
    const resolved = resolveAssetsForModel(demo, assets, 'face_only', options, resolveModelCapabilities(demo, options))
    expect(resolved.directInputs.image_url).toBeUndefined()
  })

  it('an advanced model choice still applies to Recreate', () => {
    expect(optionsForGeneration(demo, { ...options, advancedModel: 'kling-v2' }, 'recreate').model).toBe('kling-v2')
  })
})
