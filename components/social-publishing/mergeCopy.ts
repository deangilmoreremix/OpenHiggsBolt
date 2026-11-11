import type { CopyState } from './types'

const pick = (a?: string, b?: string) => (a && a.trim() ? a : b || '')

/**
 * The Write step edits `writeCopy`; the Thumbnail/Destinations/Review steps and
 * publishing read the result of this merge. Write-step text always wins over
 * the title/caption the studio handed over when the modal opened, so edited and
 * AI-written copy is what actually gets published.
 */
export function mergeCopy(write: CopyState, social: CopyState): CopyState {
  const platforms: CopyState['platforms'] = { ...(social.platforms || {}) }
  for (const [id, w] of Object.entries(write.platforms || {})) {
    const s = platforms[id] || {}
    platforms[id] = {
      title: pick(w?.title, s.title),
      description: pick(w?.description, s.description),
      caption: pick(w?.caption, s.caption),
    }
  }
  return {
    ...social,
    ...write,
    master: pick(write.master, social.master),
    title: pick(write.title, social.title),
    description: pick(write.description, social.description),
    tags: pick(write.tags, social.tags),
    caption: pick(write.caption, social.caption),
    tiktokTitle: pick(write.tiktokTitle, social.tiktokTitle),
    platforms,
    variants: write.variants?.length ? write.variants : social.variants || [],
  }
}
