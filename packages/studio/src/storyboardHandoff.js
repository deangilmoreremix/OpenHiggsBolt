/**
 * Reader side of the cross-studio hand-off, for components that live inside the
 * `studio` package (which uses relative imports and has no `@/` alias).
 *
 * The writer lives in `src/shared/crossStudio.ts` (the Storyboard studio and
 * GO-Viral studio) and writes to the same `storyboard_to_studio` localStorage
 * key with the shape described below. Keep this contract in sync with that
 * module.
 *
 * @typedef {Object} HandoffShot
 * @property {string} scene
 * @property {string} prompt   Fully-compiled prompt (camera + character folded in)
 * @property {number} duration
 * @property {string} [frameUrl]
 * @property {string[]} characterNames
 *
 * @typedef {Object} StudioHandoff
 * @property {1} version
 * @property {'video'|'cinema'|'vfx-studio'|'image'|'thumbnail-studio'|'ai-influencer'|'marketing'} target
 * @property {'storyboard'|'go-ai-viral'} from
 * @property {string} projectName
 * @property {'16:9'|'9:16'|'1:1'|null} aspectRatio
 * @property {number} episodeDuration
 * @property {string|null} videoUrl
 * @property {string|null} referenceImageUrl
 * @property {string[]} characterNames
 * @property {HandoffShot[]} shots
 * @property {string} combinedPrompt
 * @property {string|null} firstFrameUrl
 * @property {string} createdAt
 */

const HANDOFF_KEY = 'storyboard_to_studio'

// In-memory cache mirroring the writer. The source studio writes via a
// different module (TS), so this cache usually starts null and the first read
// seeds it from localStorage. We deliberately do NOT consume/clear on read:
// the shell can remount a studio on a client-side tab switch right after the
// first mount applies the payload, and a remounted instance must be able to
// re-apply the same payload idempotently. The payload is dropped only when the
// user explicitly edits the prompt (see clearStoryboardHandoff).
let pendingHandoff = null

/** Read the hand-off payload, if any. Does NOT consume it. */
export function readStoryboardHandoff(target) {
  if (typeof window === 'undefined') return null
  if (!pendingHandoff) {
    try {
      const raw = window.localStorage.getItem(HANDOFF_KEY)
      if (!raw) return null
      pendingHandoff = JSON.parse(raw)
    } catch {
      return null
    }
  }
  if (target && pendingHandoff && pendingHandoff.target !== target) return null
  return pendingHandoff
}

/**
 * Drop the hand-off payload (both persisted copy and in-memory cache). Called
 * when the user edits the imported prompt, so a later visit won't re-import
 * stale data. Do NOT call this from the apply effect — that would break the
 * idempotent re-apply on remount.
 */
export function clearStoryboardHandoff() {
  pendingHandoff = null
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(HANDOFF_KEY)
  } catch {
    /* ignore */
  }
}
