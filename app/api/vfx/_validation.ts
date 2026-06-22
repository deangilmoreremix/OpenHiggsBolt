/**
 * Shared VFX request validation used by API routes and tests.
 */

export const ALLOWED_EFFECTS = new Set([
  'Kiss Me AI','Kiss','Venom','Hulk','Muscle Surge','The Tiger Touch','Anything Robot','Warmth of Jesus','Holy Wings','Microwave','Iron Man','Spiderman','Dragon Ball','Freeze','Invisibility','Zombie','Mermaid','Werewolf','Vampire','Witch','Angel','Demon','Phoenix','Crystal','Gold Transform','Age Regression','Age Progression','Gender Swap',
  '360 Orbit','Hero Run','Arc Shot','Matrix Shot','Car Chase','Crane Down','Crane Up','Crash Zoom In','Crash Zoom Out','Dolly In','Dolly Out','Drone Flight','Dutch Angle','FPV Dive','Handheld','Jib Arm','Ken Burns','Low Angle','Overhead Crane','Pan Left','Pan Right','Parallax','Pedestal Down','Pedestal Up','Pull Focus','Push In','Roll','Shake','Tilt Down','Tilt Up','Tracking Shot','Truck Left','Truck Right','Vertigo Effect','Whip Pan','Zoom In','Zoom Out',
  'Building Explosion','Car Explosion','Decay Time-Lapse','Disintegration','Electricity','Flying','Huge Explosion','Levitate','Tornado','Fire Effect','Tsunami','Meteor Strike','Black Hole','Portal Open','Time Freeze','Gravity Flip','Glass Shatter','Laser Beam','Smoke Bomb','Snow Storm','Rain Storm','Earthquake','Volcanic Eruption','Nuclear Blast','Acid Rain',
])

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
