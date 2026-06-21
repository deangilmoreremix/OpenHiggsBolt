import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  ALLOWED_EFFECTS,
  ALLOWED_ASPECT_RATIOS,
  ALLOWED_RESOLUTIONS,
  ALLOWED_QUALITIES,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  validateGenerationInput,
  validateUploadFile,
} from '../app/api/vfx/_validation.ts'

describe('VFX validation', () => {
  it('accepts a valid generation request', () => {
    const errors = validateGenerationInput({
      image_url: 'https://example.com/image.jpg',
      effect: 'Car Explosion',
      aspect_ratio: '16:9',
      resolution: '720p',
      quality: 'high',
      duration: 10,
    })
    assert.equal(errors.length, 0)
  })

  it('rejects missing image_url', () => {
    const errors = validateGenerationInput({ effect: 'Car Explosion' })
    assert.ok(errors.some((e) => e.includes('image_url')))
  })

  it('rejects invalid effect', () => {
    const errors = validateGenerationInput({
      image_url: 'https://example.com/image.jpg',
      effect: 'Fake Effect',
    })
    assert.ok(errors.some((e) => e.includes('effect')))
  })

  it('rejects invalid aspect_ratio', () => {
    const errors = validateGenerationInput({
      image_url: 'https://example.com/image.jpg',
      effect: 'Car Explosion',
      aspect_ratio: '4:3',
    })
    assert.ok(errors.some((e) => e.includes('aspect_ratio')))
  })

  it('rejects invalid resolution', () => {
    const errors = validateGenerationInput({
      image_url: 'https://example.com/image.jpg',
      effect: 'Car Explosion',
      resolution: '1080p',
    })
    assert.ok(errors.some((e) => e.includes('resolution')))
  })

  it('rejects invalid quality', () => {
    const errors = validateGenerationInput({
      image_url: 'https://example.com/image.jpg',
      effect: 'Car Explosion',
      quality: 'ultra',
    })
    assert.ok(errors.some((e) => e.includes('quality')))
  })

  it('rejects out-of-range duration', () => {
    const errors = validateGenerationInput({
      image_url: 'https://example.com/image.jpg',
      effect: 'Car Explosion',
      duration: 20,
    })
    assert.ok(errors.some((e) => e.includes('duration')))
  })

  it('accepts allowed image MIME types', () => {
    assert.ok(ALLOWED_MIME_TYPES.has('image/jpeg'))
    assert.ok(ALLOWED_MIME_TYPES.has('image/png'))
    assert.ok(ALLOWED_MIME_TYPES.has('image/webp'))
    assert.ok(!ALLOWED_MIME_TYPES.has('image/gif'))
  })

  it('rejects oversized file', () => {
    const error = validateUploadFile({ type: 'image/jpeg', size: MAX_FILE_SIZE_BYTES + 1 })
    assert.ok(error.includes('too large'))
  })

  it('rejects invalid file type', () => {
    const error = validateUploadFile({ type: 'image/gif', size: 1000 })
    assert.ok(error.includes('Invalid file type'))
  })

  it('contains all expected effect categories', () => {
    assert.ok(ALLOWED_EFFECTS.has('Car Explosion'))
    assert.ok(ALLOWED_EFFECTS.has('Kiss Me AI'))
    assert.ok(ALLOWED_EFFECTS.has('Ken Burns'))
    assert.ok(ALLOWED_ASPECT_RATIOS.has('16:9'))
    assert.ok(ALLOWED_RESOLUTIONS.has('480p'))
    assert.ok(ALLOWED_QUALITIES.has('high'))
  })
})
