/**
 * Shared VFX request validation used by API routes and tests.
 */
import { EFFECT_NAMES } from '@/apps/vfx-studio/effectCatalog'

// One list for the gallery and the server: see src/apps/vfx-studio/effectCatalog.ts.
export const ALLOWED_EFFECTS = EFFECT_NAMES

export const ALLOWED_ASPECT_RATIOS = new Set(['16:9', '9:16', '1:1'])
export const ALLOWED_RESOLUTIONS = new Set(['480p', '720p'])
export const ALLOWED_QUALITIES = new Set(['medium', 'high'])
export const MAX_DURATION = 10
export const MIN_DURATION = 3
export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024
export const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])

export function validateGenerationInput(body) {
  const errors: string[] = []

  if (!body.image_url || typeof body.image_url !== 'string') {
    errors.push('image_url is required')
  }

  if (!body.effect || typeof body.effect !== 'string' || !ALLOWED_EFFECTS.has(body.effect)) {
    errors.push('A valid effect name is required')
  }

  if (body.aspect_ratio && !ALLOWED_ASPECT_RATIOS.has(body.aspect_ratio)) {
    errors.push('Invalid aspect_ratio')
  }

  if (body.resolution && !ALLOWED_RESOLUTIONS.has(body.resolution)) {
    errors.push('Invalid resolution')
  }

  if (body.quality && !ALLOWED_QUALITIES.has(body.quality)) {
    errors.push('Invalid quality')
  }

  const duration = Number(body.duration)
  if (body.duration !== undefined && (!Number.isFinite(duration) || duration < MIN_DURATION || duration > MAX_DURATION)) {
    errors.push(`duration must be between ${MIN_DURATION}s and ${MAX_DURATION}s`)
  }

  return errors
}

export function validateUploadFile(file) {
  if (!file) return 'file is required'
  if (!ALLOWED_MIME_TYPES.has(file.type)) return `Invalid file type: ${file.type}`
  if (file.size > MAX_FILE_SIZE_BYTES) return `File too large: ${file.size} bytes`
  return null
}
