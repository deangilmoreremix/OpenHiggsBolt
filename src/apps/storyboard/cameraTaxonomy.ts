/**
 * Storyboard camera taxonomy — typed adaptation of src/lib/promptUtils.js.
 * Provides camera / lens / focal-length / aperture / movement options and a
 * compiler that folds per-shot camera specs into the scene prompt string sent
 * to the storyboard model (which only accepts free text per shot).
 */

export const CAMERA_MAP: Record<string, string> = {
  'Modular 8K Digital': 'modular 8K digital cinema camera',
  'Full-Frame Cine Digital': 'full-frame digital cinema camera',
  'Grand Format 70mm Film': 'grand format 70mm film camera',
  'Studio Digital S35': 'Super 35 studio digital camera',
  'Classic 16mm Film': 'classic 16mm film camera',
  'Premium Large Format Digital': 'premium large-format digital cinema camera',
}

export const LENS_MAP: Record<string, string> = {
  'Creative Tilt Lens': 'creative tilt lens effect',
  'Compact Anamorphic': 'compact anamorphic lens',
  'Extreme Macro': 'extreme macro lens',
  '70s Cinema Prime': '1970s cinema prime lens',
  'Classic Anamorphic': 'classic anamorphic lens',
  'Premium Modern Prime': 'premium modern prime lens',
  'Warm Cinema Prime': 'warm-toned cinema prime lens',
  'Swirl Bokeh Portrait': 'swirl bokeh portrait lens',
  'Vintage Prime': 'vintage prime lens',
  'Halation Diffusion': 'halation diffusion filter',
  'Clinical Sharp Prime': 'ultra-sharp clinical prime lens',
}

export const FOCAL_PERSPECTIVE: Record<number, string> = {
  8: 'ultra-wide perspective',
  14: 'wide-angle perspective',
  24: 'wide-angle dynamic perspective',
  35: 'natural cinematic perspective',
  50: 'standard portrait perspective',
  85: 'classic portrait perspective',
}

export const APERTURE_EFFECT: Record<string, string> = {
  'f/1.4': 'shallow depth of field, creamy bokeh',
  'f/4': 'balanced depth of field',
  'f/11': 'deep focus clarity, sharp foreground to background',
}

// Shot type / framing taxonomy → prompt fragment.
export const SHOT_TYPE_MAP: Record<string, string> = {
  'Extreme Wide': 'extreme wide establishing shot',
  Wide: 'wide shot',
  Medium: 'medium shot',
  'Close-Up': 'close-up shot',
  'Extreme Close-Up': 'extreme close-up shot',
  'Over-the-Shoulder': 'over-the-shoulder shot',
  POV: 'point-of-view shot',
  'Two-Shot': 'two-shot framing',
}

// Camera angle taxonomy → prompt fragment.
export const CAMERA_ANGLE_MAP: Record<string, string> = {
  Eye: 'eye-level angle',
  Low: 'low angle looking up',
  High: 'high angle looking down',
  'Dutch Tilt': 'dutch tilt angle',
  'Birds Eye': "bird's-eye overhead angle",
  'Worms Eye': "worm's-eye ground angle",
}

// Camera movement taxonomy → prompt fragment (seeded from VFX MOTION_CONTROLS).
export const CAMERA_MOVEMENT_MAP: Record<string, string> = {
  Static: 'static locked-off camera',
  'Pan Left': 'smooth pan left',
  'Pan Right': 'smooth pan right',
  'Tilt Up': 'tilt up',
  'Tilt Down': 'tilt down',
  'Dolly In': 'slow dolly in',
  'Dolly Out': 'slow dolly out',
  'Crane Up': 'crane up',
  'Crane Down': 'crane down',
  'Arc Shot': 'arc shot around subject',
  '360 Orbit': '360-degree orbit around subject',
  Handheld: 'handheld camera movement',
}

export const CAMERA_OPTIONS = Object.keys(CAMERA_MAP)
export const LENS_OPTIONS = Object.keys(LENS_MAP)
export const FOCAL_OPTIONS = Object.keys(FOCAL_PERSPECTIVE).map(Number)
export const APERTURE_OPTIONS = Object.keys(APERTURE_EFFECT)
export const SHOT_TYPE_OPTIONS = Object.keys(SHOT_TYPE_MAP)
export const CAMERA_ANGLE_OPTIONS = Object.keys(CAMERA_ANGLE_MAP)
export const CAMERA_MOVEMENT_OPTIONS = Object.keys(CAMERA_MOVEMENT_MAP)

export interface CameraSpec {
  shotType?: string
  angle?: string
  movement?: string
  camera?: string
  lens?: string
  focalLength?: number
  aperture?: string
}

/**
 * Fold a shot's camera spec into its scene description.
 * Returns the base scene unchanged when no camera fields are set.
 */
export function buildShotPrompt(scene: string, spec?: CameraSpec): string {
  const base = (scene || '').trim()
  if (!spec) return base

  const parts: string[] = [base]

  if (spec.shotType && SHOT_TYPE_MAP[spec.shotType]) parts.push(SHOT_TYPE_MAP[spec.shotType])
  if (spec.angle && CAMERA_ANGLE_MAP[spec.angle]) parts.push(CAMERA_ANGLE_MAP[spec.angle])
  if (spec.movement && CAMERA_MOVEMENT_MAP[spec.movement]) parts.push(CAMERA_MOVEMENT_MAP[spec.movement])

  if (spec.camera && CAMERA_MAP[spec.camera]) parts.push(`shot on a ${CAMERA_MAP[spec.camera]}`)

  if (spec.lens && LENS_MAP[spec.lens]) {
    const focal = typeof spec.focalLength === 'number' ? spec.focalLength : undefined
    const perspective = focal != null ? FOCAL_PERSPECTIVE[focal] : ''
    const focalStr = focal != null ? ` at ${focal}mm${perspective ? ` (${perspective})` : ''}` : ''
    parts.push(`using a ${LENS_MAP[spec.lens]}${focalStr}`)
  } else if (typeof spec.focalLength === 'number' && FOCAL_PERSPECTIVE[spec.focalLength]) {
    parts.push(`${spec.focalLength}mm (${FOCAL_PERSPECTIVE[spec.focalLength]})`)
  }

  if (spec.aperture && APERTURE_EFFECT[spec.aperture]) {
    parts.push(`aperture ${spec.aperture}`, APERTURE_EFFECT[spec.aperture])
  }

  return parts.filter((p) => p && p.trim() !== '').join(', ')
}

export interface CharacterLike {
  name: string
  description?: string
}

/**
 * Prepend character descriptions to a scene prompt so the model keeps
 * consistent characters across shots. Returns the scene unchanged when no
 * characters are supplied.
 */
export function withCharacters(scene: string, characters: CharacterLike[]): string {
  const base = (scene || '').trim()
  if (!characters || characters.length === 0) return base
  const descs = characters
    .map((c) => {
      const name = (c.name || '').trim()
      const desc = (c.description || '').trim()
      if (!name && !desc) return ''
      if (name && desc) return `${name} (${desc})`
      return name || desc
    })
    .filter(Boolean)
  if (descs.length === 0) return base
  return `Featuring ${descs.join('; ')}. ${base}`
}

