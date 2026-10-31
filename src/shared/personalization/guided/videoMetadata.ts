/**
 * Reads a video's real duration and size from its metadata, so a picked demo
 * (or motion template, or the source video) sets the preview to its own
 * length and shape instead of a catalog guess or a 5-second default.
 */

export interface VideoMetadata {
  durationSec: number
  width: number
  height: number
}

/** Give up after this long; the caller keeps its catalog fallback. */
const PROBE_TIMEOUT_MS = 8000

const cache = new Map<string, Promise<VideoMetadata | null>>()

/** Duration and size of the video at `url`, or null when it cannot be read. */
export function probeVideoMetadata(url: string | null | undefined): Promise<VideoMetadata | null> {
  if (!url || typeof document === 'undefined') return Promise.resolve(null)
  const cached = cache.get(url)
  if (cached) return cached
  const promise = new Promise<VideoMetadata | null>((resolve) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    let settled = false
    const finish = (value: VideoMetadata | null) => {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      video.removeAttribute('src')
      video.load()
      resolve(value)
    }
    const timer = window.setTimeout(() => finish(null), PROBE_TIMEOUT_MS)
    video.addEventListener(
      'loadedmetadata',
      () => {
        const durationSec = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0
        finish(durationSec > 0 ? { durationSec, width: video.videoWidth, height: video.videoHeight } : null)
      },
      { once: true },
    )
    video.addEventListener('error', () => finish(null), { once: true })
    video.src = url
  })
  // A failed probe is not cached, so a later pick can try again.
  promise.then((value) => {
    if (!value) cache.delete(url)
  })
  cache.set(url, promise)
  return promise
}
