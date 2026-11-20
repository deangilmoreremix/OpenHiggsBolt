/**
 * The AI VFX effect presets, in the order the studio shows them.
 *
 * The names are the effect presets MuAPI's `generate_wan_ai_effects` endpoint accepts (64 AI effects, 47 motion
 * controls, 9 VFX), taken from the reference studio. This is the single source of truth: the gallery, the
 * server-side allowlist (app/api/vfx/_validation.ts) and the tests all read it, so a card can never offer a name
 * the server rejects. Thumbnails live in /public/vfx-thumbs/<category>/<slug>.
 *
 * `prompt` stays empty on purpose: the API picks the look from the preset name, and anything the user types in the
 * prompt box is added on top.
 */
import type { VFXEffect } from '@/types/vfx'

export const AI_EFFECTS: VFXEffect[] = [
  { id: "360-rotation", name: "360 Rotation", preview: "/vfx-thumbs/ai-effects/360-rotation.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "abandoned-places", name: "Abandoned Places", preview: "/vfx-thumbs/ai-effects/abandoned-places.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "angry", name: "Angry", preview: "/vfx-thumbs/ai-effects/angry.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "animal-documentary", name: "Animal Documentary", preview: "/vfx-thumbs/ai-effects/animal-documentary.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "assassin-it", name: "Assassin It", preview: "/vfx-thumbs/ai-effects/assassin-it.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "baby-it", name: "Baby It", preview: "/vfx-thumbs/ai-effects/baby-it.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "boxing", name: "Boxing", preview: "/vfx-thumbs/ai-effects/boxing.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "bride-it", name: "Bride It", preview: "/vfx-thumbs/ai-effects/bride-it.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "cakeify", name: "Cakeify", preview: "/vfx-thumbs/ai-effects/cakeify.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "cartoon-jaw-drop", name: "Cartoon Jaw Drop", preview: "/vfx-thumbs/ai-effects/cartoon-jaw-drop.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "cats", name: "Cats", preview: "/vfx-thumbs/ai-effects/cats.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "crush-it", name: "Crush It", preview: "/vfx-thumbs/ai-effects/crush-it.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "crying", name: "Crying", preview: "/vfx-thumbs/ai-effects/crying.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "cyberpunk-2077", name: "Cyberpunk 2077", preview: "/vfx-thumbs/ai-effects/cyberpunk-2077.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "deflate-it", name: "Deflate It", preview: "/vfx-thumbs/ai-effects/deflate-it.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "disney-princess-it", name: "Disney Princess It", preview: "/vfx-thumbs/ai-effects/disney-princess-it.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "dogs", name: "Dogs", preview: "/vfx-thumbs/ai-effects/dogs.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "eye-close-up", name: "Eye Close-Up", preview: "/vfx-thumbs/ai-effects/eye-close-up.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "fantasy-landscapes", name: "Fantasy Landscapes", preview: "/vfx-thumbs/ai-effects/fantasy-landscapes.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "film-noir", name: "Film Noir", preview: "/vfx-thumbs/ai-effects/film-noir.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "fire", name: "Fire", preview: "/vfx-thumbs/ai-effects/fire.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "glamor", name: "Glamor", preview: "/vfx-thumbs/ai-effects/glamor.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "goblin", name: "Goblin", preview: "/vfx-thumbs/ai-effects/goblin.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "gun-reveal", name: "Gun Reveal", preview: "/vfx-thumbs/ai-effects/gun-reveal.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "hug-jesus", name: "Hug Jesus", preview: "/vfx-thumbs/ai-effects/hug-jesus.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "hulk-transformation", name: "Hulk Transformation", preview: "/vfx-thumbs/ai-effects/hulk-transformation.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "inflate-it", name: "Inflate It", preview: "/vfx-thumbs/ai-effects/inflate-it.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "jungle-it", name: "Jungle It", preview: "/vfx-thumbs/ai-effects/jungle-it.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "jumpscare", name: "Jumpscare", preview: "/vfx-thumbs/ai-effects/jumpscare.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "kamehameha", name: "Kamehameha", preview: "/vfx-thumbs/ai-effects/kamehameha.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "kiss-cam", name: "Kiss Cam", preview: "/vfx-thumbs/ai-effects/kiss-cam.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "kissing", name: "Kissing", preview: "/vfx-thumbs/ai-effects/kissing.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "lego", name: "Lego", preview: "/vfx-thumbs/ai-effects/lego.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "laughing", name: "Laughing", preview: "/vfx-thumbs/ai-effects/laughing.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "little-planet", name: "Little Planet", preview: "/vfx-thumbs/ai-effects/little-planet.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "live-wallpaper", name: "Live Wallpaper", preview: "/vfx-thumbs/ai-effects/live-wallpaper.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "looping-pixel-art", name: "Looping Pixel Art", preview: "/vfx-thumbs/ai-effects/looping-pixel-art.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "melt-it", name: "Melt It", preview: "/vfx-thumbs/ai-effects/melt-it.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "mona-lisa-it", name: "Mona Lisa It", preview: "/vfx-thumbs/ai-effects/mona-lisa-it.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "museum-it", name: "Museum It", preview: "/vfx-thumbs/ai-effects/museum-it.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "muscle-show-off", name: "Muscle Show Off", preview: "/vfx-thumbs/ai-effects/muscle-show-off.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "orc", name: "Orc", preview: "/vfx-thumbs/ai-effects/orc.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "pixar", name: "Pixar", preview: "/vfx-thumbs/ai-effects/pixar.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "pirate-captain", name: "Pirate Captain", preview: "/vfx-thumbs/ai-effects/pirate-captain.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "pov-driving", name: "POV Driving", preview: "/vfx-thumbs/ai-effects/pov-driving.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "princess-it", name: "Princess It", preview: "/vfx-thumbs/ai-effects/princess-it.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "puppy-it", name: "Puppy it", preview: "/vfx-thumbs/ai-effects/puppy-it.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "robotic-face-reveal", name: "Robotic Face Reveal", preview: "/vfx-thumbs/ai-effects/robotic-face-reveal.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "samurai-it", name: "Samurai It", preview: "/vfx-thumbs/ai-effects/samurai-it.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "sharingan-eyes", name: "Sharingan Eyes", preview: "/vfx-thumbs/ai-effects/sharingan-eyes.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "skyrim-fus-ro-dah", name: "Skyrim Fus-Ro-Dah", preview: "/vfx-thumbs/ai-effects/skyrim-fus-ro-dah.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "snow-white-it", name: "Snow White It", preview: "/vfx-thumbs/ai-effects/snow-white-it.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "squish-it", name: "Squish It", preview: "/vfx-thumbs/ai-effects/squish-it.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "steamboat-willie", name: "Steamboat Willie", preview: "/vfx-thumbs/ai-effects/steamboat-willie.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "super-saiyan-transformation", name: "Super Saiyan Transformation", preview: "/vfx-thumbs/ai-effects/super-saiyan-transformation.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "tsunami", name: "Tsunami", preview: "/vfx-thumbs/ai-effects/tsunami.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "ultra-wide", name: "Ultra Wide", preview: "/vfx-thumbs/ai-effects/ultra-wide.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "vhs-footage", name: "VHS Footage", preview: "/vfx-thumbs/ai-effects/vhs-footage.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "vip-it", name: "VIP It", preview: "/vfx-thumbs/ai-effects/vip-it.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "warrior-it", name: "Warrior It", preview: "/vfx-thumbs/ai-effects/warrior-it.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "wind-blast", name: "Wind Blast", preview: "/vfx-thumbs/ai-effects/wind-blast.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "younger-self-selfie", name: "Younger Self Selfie", preview: "/vfx-thumbs/ai-effects/younger-self-selfie.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "zen-it", name: "Zen It", preview: "/vfx-thumbs/ai-effects/zen-it.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
  { id: "zoom-call", name: "Zoom Call", preview: "/vfx-thumbs/ai-effects/zoom-call.webp.png", prompt: '', emoji: '⭐', category: 'ai-effects' },
];

export const MOTION_CONTROLS: VFXEffect[] = [
  { id: "360-orbit", name: "360 Orbit", preview: "/vfx-thumbs/motion-controls/360-orbit.webp.png", prompt: '', emoji: '🎬', category: 'motion-controls' },
  { id: "arc-shot", name: "Arc Shot", preview: "/vfx-thumbs/motion-controls/arc-shot.webp.png", prompt: '', emoji: '🎬', category: 'motion-controls' },
  { id: "car-chase", name: "Car Chase", preview: "/vfx-thumbs/motion-controls/car-chase.webp.png", prompt: '', emoji: '🎬', category: 'motion-controls' },
  { id: "car-mount-cam", name: "Car Mount Cam", preview: "/vfx-thumbs/motion-controls/car-mount-cam.webp.png", prompt: '', emoji: '🎬', category: 'motion-controls' },
  { id: "crash-zoom-in", name: "Crash Zoom In", preview: "/vfx-thumbs/motion-controls/crash-zoom-in.webp.png", prompt: '', emoji: '🎬', category: 'motion-controls' },
  { id: "crash-zoom-out", name: "Crash Zoom Out", preview: "/vfx-thumbs/motion-controls/crash-zoom-out.webp.png", prompt: '', emoji: '🎬', category: 'motion-controls' },
  { id: "crane-down", name: "Crane Down", preview: "/vfx-thumbs/motion-controls/crane-down.webp.png", prompt: '', emoji: '🎬', category: 'motion-controls' },
  { id: "crane-overhead", name: "Crane Overhead", preview: "/vfx-thumbs/motion-controls/crane-overhead.webp.png", prompt: '', emoji: '🎬', category: 'motion-controls' },
  { id: "crane-punch-in", name: "Crane Punch-In", preview: "/vfx-thumbs/motion-controls/crane-punch-in.webp.png", prompt: '', emoji: '🎬', category: 'motion-controls' },
  { id: "crane-up", name: "Crane Up", preview: "/vfx-thumbs/motion-controls/crane-up.webp.png", prompt: '', emoji: '🎬', category: 'motion-controls' },
  { id: "dirty-lens", name: "Dirty Lens", preview: "/vfx-thumbs/motion-controls/dirty-lens.webp.png", prompt: '', emoji: '🎬', category: 'motion-controls' },
  { id: "dolly-in", name: "Dolly In", preview: "/vfx-thumbs/motion-controls/dolly-in.webp.png", prompt: '', emoji: '🎬', category: 'motion-controls' },
  { id: "dolly-left", name: "Dolly Left", preview: "/vfx-thumbs/motion-controls/dolly-left.webp.png", prompt: '', emoji: '🎬', category: 'motion-controls' },
  { id: "dolly-out", name: "Dolly Out", preview: "/vfx-thumbs/motion-controls/dolly-out.webp.png", prompt: '', emoji: '🎬', category: 'motion-controls' },
  { id: "dolly-right", name: "Dolly Right", preview: "/vfx-thumbs/motion-controls/dolly-right.webp.png", prompt: '', emoji: '🎬', category: 'motion-controls' },
  { id: "dolly-zoom-in", name: "Dolly Zoom In", preview: "/vfx-thumbs/motion-controls/dolly-zoom-in.webp.png", prompt: '', emoji: '🎬', category: 'motion-controls' },
  { id: "dolly-zoom-out", name: "Dolly Zoom Out", preview: "/vfx-thumbs/motion-controls/dolly-zoom-out.webp.png", prompt: '', emoji: '🎬', category: 'motion-controls' },
  { id: "dutch-angle", name: "Dutch Angle", preview: "/vfx-thumbs/motion-controls/dutch-angle.webp.png", prompt: '', emoji: '🎬', category: 'motion-controls' },
  { id: "fast-dolly-zoom-in", name: "Fast Dolly Zoom In", preview: "/vfx-thumbs/motion-controls/fast-dolly-zoom-in.webp.png", prompt: '', emoji: '🎬', category: 'motion-controls' },
  { id: "fast-dolly-zoom-out", name: "Fast Dolly Zoom Out", preview: "/vfx-thumbs/motion-controls/fast-dolly-zoom-out.webp.png", prompt: '', emoji: '🎬', category: 'motion-controls' },
  { id: "fisheye-lens", name: "Fisheye Lens", preview: "/vfx-thumbs/motion-controls/fisheye-lens.webp.png", prompt: '', emoji: '🎬', category: 'motion-controls' },
  { id: "focus-shift", name: "Focus Shift", preview: "/vfx-thumbs/motion-controls/focus-shift.webp.png", prompt: '', emoji: '🎬', category: 'motion-controls' },
  { id: "fpv-drone-cam", name: "FPV Drone Cam", preview: "/vfx-thumbs/motion-controls/fpv-drone-cam.webp.png", prompt: '', emoji: '🎬', category: 'motion-controls' },
  { id: "handheld-cam", name: "Handheld Cam", preview: "/vfx-thumbs/motion-controls/handheld-cam.webp.png", prompt: '', emoji: '🎬', category: 'motion-controls' },
  { id: "head-tracking", name: "Head Tracking", preview: "/vfx-thumbs/motion-controls/head-tracking.webp.png", prompt: '', emoji: '🎬', category: 'motion-controls' },
  { id: "hero-run", name: "Hero Run", preview: "/vfx-thumbs/motion-controls/hero-run.webp.png", prompt: '', emoji: '🎬', category: 'motion-controls' },
  { id: "human-timelapse", name: "Human Timelapse", preview: "/vfx-thumbs/motion-controls/human-timelapse.webp.png", prompt: '', emoji: '🎬', category: 'motion-controls' },
  { id: "landscape-timelapse", name: "Landscape Timelapse", preview: "/vfx-thumbs/motion-controls/landscape-timelapse.webp.png", prompt: '', emoji: '🎬', category: 'motion-controls' },
  { id: "lazy-susan", name: "Lazy Susan", preview: "/vfx-thumbs/motion-controls/lazy-susan.webp.png", prompt: '', emoji: '🎬', category: 'motion-controls' },
  { id: "lens-crack", name: "Lens Crack", preview: "/vfx-thumbs/motion-controls/lens-crack.webp.png", prompt: '', emoji: '🎬', category: 'motion-controls' },
  { id: "lens-flare", name: "Lens Flare", preview: "/vfx-thumbs/motion-controls/lens-flare.webp.png", prompt: '', emoji: '🎬', category: 'motion-controls' },
  { id: "matrix-shot", name: "Matrix Shot", preview: "/vfx-thumbs/motion-controls/matrix-shot.webp.png", prompt: '', emoji: '🎬', category: 'motion-controls' },
  { id: "motion-blur", name: "Motion Blur", preview: "/vfx-thumbs/motion-controls/motion-blur.webp.png", prompt: '', emoji: '🎬', category: 'motion-controls' },
  { id: "object-pov", name: "Object POV", preview: "/vfx-thumbs/motion-controls/object-pov.webp.png", prompt: '', emoji: '🎬', category: 'motion-controls' },
  { id: "overhead", name: "Overhead", preview: "/vfx-thumbs/motion-controls/overhead.webp.png", prompt: '', emoji: '🎬', category: 'motion-controls' },
  { id: "rap-video-cam", name: "Rap Video Cam", preview: "/vfx-thumbs/motion-controls/rap-video-cam.webp.png", prompt: '', emoji: '🎬', category: 'motion-controls' },
  { id: "robotic-cam", name: "Robotic Cam", preview: "/vfx-thumbs/motion-controls/robotic-cam.webp.png", prompt: '', emoji: '🎬', category: 'motion-controls' },
  { id: "snorricam", name: "Snorricam", preview: "/vfx-thumbs/motion-controls/snorricam.webp.png", prompt: '', emoji: '🎬', category: 'motion-controls' },
  { id: "tilt-down", name: "Tilt Down", preview: "/vfx-thumbs/motion-controls/tilt-down.webp.png", prompt: '', emoji: '🎬', category: 'motion-controls' },
  { id: "tilt-up", name: "Tilt Up", preview: "/vfx-thumbs/motion-controls/tilt-up.webp.png", prompt: '', emoji: '🎬', category: 'motion-controls' },
  { id: "whip-pan", name: "Whip Pan", preview: "/vfx-thumbs/motion-controls/whip-pan.webp.png", prompt: '', emoji: '🎬', category: 'motion-controls' },
  { id: "wiggle", name: "Wiggle", preview: "/vfx-thumbs/motion-controls/wiggle.webp.png", prompt: '', emoji: '🎬', category: 'motion-controls' },
  { id: "zoom-in", name: "Zoom In", preview: "/vfx-thumbs/motion-controls/zoom-in.webp.png", prompt: '', emoji: '🎬', category: 'motion-controls' },
  { id: "zoom-in-through-object", name: "Zoom In Through Object", preview: "/vfx-thumbs/motion-controls/zoom-in-through-object.svg", prompt: '', emoji: '🎬', category: 'motion-controls' },
  { id: "zoom-into-mouth", name: "Zoom Into Mouth", preview: "/vfx-thumbs/motion-controls/zoom-into-mouth.webp.png", prompt: '', emoji: '🎬', category: 'motion-controls' },
  { id: "zoom-out", name: "Zoom Out", preview: "/vfx-thumbs/motion-controls/zoom-out.webp.png", prompt: '', emoji: '🎬', category: 'motion-controls' },
  { id: "zoom-out-through-object", name: "Zoom Out Through Object", preview: "/vfx-thumbs/motion-controls/zoom-out-through-object.webp.png", prompt: '', emoji: '🎬', category: 'motion-controls' },
];

export const VFX_EFFECTS: VFXEffect[] = [
  { id: "building-explosion", name: "Building Explosion", preview: "/vfx-thumbs/vfx/building-explosion.webp.png", prompt: '', emoji: '💥', category: 'vfx' },
  { id: "car-explosion", name: "Car Explosion", preview: "/vfx-thumbs/vfx/car-explosion.webp.png", prompt: '', emoji: '💥', category: 'vfx' },
  { id: "decay-time-lapse", name: "Decay Time-Lapse", preview: "/vfx-thumbs/vfx/decay-time-lapse.webp.png", prompt: '', emoji: '💥', category: 'vfx' },
  { id: "disintegration", name: "Disintegration", preview: "/vfx-thumbs/vfx/disintegration.webp.png", prompt: '', emoji: '💥', category: 'vfx' },
  { id: "electricity", name: "Electricity", preview: "/vfx-thumbs/vfx/electricity.webp.png", prompt: '', emoji: '💥', category: 'vfx' },
  { id: "flying", name: "Flying", preview: "/vfx-thumbs/vfx/flying.webp.png", prompt: '', emoji: '💥', category: 'vfx' },
  { id: "huge-explosion", name: "Huge Explosion", preview: "/vfx-thumbs/vfx/huge-explosion.webp.png", prompt: '', emoji: '💥', category: 'vfx' },
  { id: "levitate", name: "Levitate", preview: "/vfx-thumbs/vfx/levitate.webp.png", prompt: '', emoji: '💥', category: 'vfx' },
  { id: "tornado", name: "Tornado", preview: "/vfx-thumbs/vfx/tornado.webp.png", prompt: '', emoji: '💥', category: 'vfx' },
];

export const ALL_EFFECTS: VFXEffect[] = [...AI_EFFECTS, ...MOTION_CONTROLS, ...VFX_EFFECTS]

/** Every preset name the API accepts. */
export const EFFECT_NAMES: ReadonlySet<string> = new Set(ALL_EFFECTS.map((effect) => effect.name))

export const VFX_CATEGORIES = [
  { id: 'ai-effects', label: 'AI Effects', icon: '⭐' },
  { id: 'motion-controls', label: 'Motion Controls', icon: '🎬' },
  { id: 'vfx', label: 'VFX', icon: '💥' },
] as const

export type VFXCategoryId = (typeof VFX_CATEGORIES)[number]['id']

/** The hero banner picture for the studio page. */
export const VFX_HERO_IMAGE = '/vfx-thumbs/hero.webp'
