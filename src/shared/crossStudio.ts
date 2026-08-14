/**
 * Cross-studio hand-off transport.
 *
 * The studio shell mounts one studio at a time and unmounts the others, and
 * there is no shared React context spanning studios. localStorage is already
 * the de-facto cross-studio channel in this app (each studio persists its own
 * state to its own key). We reuse the same pattern: the storyboard writes a
 * hand-off payload to a single key, then navigates to the target studio; the
 * target studio reads (and clears) that key on mount.
 */

export type StoryboardStudioTarget = 'video' | 'cinema' | 'vfx-studio'

/** A single shot, flattened for downstream consumption. */
export interface HandoffShot {
  scene: string
  /** Fully-compiled prompt (camera + character specs folded in). */
  prompt: string
  duration: number
  frameUrl?: string
  characterNames: string[]
}

export interface StoryboardHandoff {
  /** Schema version for forward-compat. */
  version: 1
  /** Which studio should receive this payload. */
  target: StoryboardStudioTarget
  /** Source studio identifier, for diagnostics. */
  from: 'storyboard'
  projectName: string
  aspectRatio: '16:9' | '9:16'
  episodeDuration: number
  /** Generated storyboard video URL (if any). */
  videoUrl: string | null
  /** First character reference image, when available. */
  referenceImageUrl: string | null
  /** Character names defined in the project. */
  characterNames: string[]
  shots: HandoffShot[]
  /** One combined prompt (all shots joined) for text-only studios. */
  combinedPrompt: string
  /** First frame URL, used as a reference image in image-driven studios. */
  firstFrameUrl: string | null
  createdAt: string
}

const HANDOFF_KEY = 'storyboard_to_studio'

/**
 * In-memory cache of the most recent hand-off. localStorage alone is not
 * reliable across React Strict Mode's mount/remount + effect double-invoke
 * ordering: the first effect run can pop the key before the component instance
 * that should display it settles. The module-level cache outlives component
 * instances within a page session, so the first effect to run always gets the
 * payload, and a subsequent consume (or a remount) sees `null` and no-ops.
 */
let pendingHandoff: StoryboardHandoff | null = null

/** Map a studio target to the URL slug the shell uses to switch tabs. */
export const TARGET_SLUG: Record<StoryboardStudioTarget, string> = {
  video: 'video',
  cinema: 'cinema',
  'vfx-studio': 'vfx-studio',
}

export const TARGET_LABEL: Record<StoryboardStudioTarget, string> = {
  video: 'Video Studio',
  cinema: 'Cinema Studio',
  'vfx-studio': 'VFX Studio',
}

export function writeHandoff(payload: StoryboardHandoff): void {
  if (typeof window === 'undefined') return
  pendingHandoff = payload
  try {
    localStorage.setItem(HANDOFF_KEY, JSON.stringify(payload))
  } catch {
    /* ignore quota / serialization errors */
  }
}

/**
 * Read the hand-off payload WITHOUT consuming it.
 *
 * We deliberately do NOT clear on read. React Strict Mode (dev) double-invokes
 * effects and remounts components; if we cleared here, the remounted instance
 * would start from empty `useState('')` and the imported data would be lost.
 * Instead each studio applies the payload idempotently (guarded by a ref keyed
 * on `createdAt`) and clears only localStorage via `clearHandoff()` once
 * applied, while the in-memory cache survives the session for any remount.
 */
export function readHandoff(target?: StoryboardStudioTarget): StoryboardHandoff | null {
  if (typeof window === 'undefined') return null
  const candidate = pendingHandoff
  if (!candidate) {
    try {
      const raw = localStorage.getItem(HANDOFF_KEY)
      if (!raw) return null
      pendingHandoff = JSON.parse(raw) as StoryboardHandoff
    } catch {
      return null
    }
  }
  if (target && pendingHandoff && pendingHandoff.target !== target) {
    return null
  }
  return pendingHandoff
}

export function clearHandoff(): void {
  if (typeof window === 'undefined') return
  // Clear the persisted copy. The in-memory cache is intentionally kept so a
  // remounted studio instance (the shell may re-mount on a client-side tab
  // switch) can re-apply the payload idempotently. Call clearHandoffCache()
  // when the user explicitly edits the prompt to drop it for the session.
  try {
    localStorage.removeItem(HANDOFF_KEY)
  } catch {
    /* ignore */
  }
}

/** Fully drop the in-memory hand-off cache (call when the user edits the prompt). */
export function clearHandoffCache(): void {
  pendingHandoff = null
}

/**
 * Notify the host shell to switch to the target studio. The storyboard runs
 * inside its own MemoryRouter, so react-router navigation can't change the
 * shell's active tab — the shell listens for this event and calls its own
 * tab-switch handler.
 */
export const SEND_TO_EVENT = 'storyboard:send-to'

export function emitSendTo(target: StoryboardStudioTarget): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(SEND_TO_EVENT, { detail: { target } }))
}
