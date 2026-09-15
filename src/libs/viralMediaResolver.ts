/**
 * Central media resolver for GO-Viral Studio.
 *
 * Determines the best usable URL for images, videos, and posters
 * from the various fields present in PromptRecord and SeedancePrompt.
 *
 * Fallback priority is determined from the actual data shape after
 * inspecting real records. Do not hard-code assumptions without
 * testing representative records.
 */

import type { PromptMedia, PromptRecord } from '@/types/go-ai-viral/prompt'
import type { SeedancePrompt } from '@/types/go-ai-viral/seedance'

/**
 * Result of resolving media for a prompt record.
 */
export interface ResolvedImageMedia {
  /** Best usable image URL for display. */
  imageUrl: string | null
  /** Whether the resolved URL is a fallback (not the primary previewUrl). */
  isFallback: boolean
  /** All candidate URLs that were considered, for diagnostics. */
  candidates: string[]
}

/**
 * Result of resolving media for a video record.
 */
export interface ResolvedVideoMedia {
  /** Playable video URL. */
  videoUrl: string | null
  /** Poster image URL for the video element. */
  posterUrl: string | null
  /** Whether the video URL is a fallback. */
  isVideoFallback: boolean
  /** Whether the poster URL is a fallback. */
  isPosterFallback: boolean
  /** All candidate URLs considered. */
  candidates: string[]
}

/**
 * Resolve the best image URL from a PromptRecord's media assets.
 *
 * Priority for images:
 *   1. Valid previewUrl from the 'result' role media
 *   2. Valid previewUrl from the first media asset
 *   3. Valid sourceUrl from the 'result' role media
 *   4. Valid sourceUrl from the first media asset
 *   5. null (caller should show fallback UI)
 */
export function resolvePromptRecordImage(record: PromptRecord): ResolvedImageMedia {
  const primaryMedia: PromptMedia | undefined =
    record.media.find((m) => m.role === 'result') || record.media[0]

  const candidates: string[] = []
  let imageUrl: string | null = null
  let isFallback = false

  if (primaryMedia) {
    // 1. previewUrl first
    if (primaryMedia.previewUrl) {
      candidates.push(primaryMedia.previewUrl)
      imageUrl = primaryMedia.previewUrl
    }

    // 2. sourceUrl as fallback if previewUrl is missing
    if (!imageUrl && primaryMedia.sourceUrl) {
      candidates.push(primaryMedia.sourceUrl)
      imageUrl = primaryMedia.sourceUrl
      isFallback = true
    }

    // 3. posterUrl as last resort for images
    if (!imageUrl && primaryMedia.posterUrl) {
      candidates.push(primaryMedia.posterUrl)
      imageUrl = primaryMedia.posterUrl
      isFallback = true
    }
  }

  return { imageUrl, isFallback, candidates }
}

/**
 * Resolve video source and poster from a PromptRecord's media assets.
 *
 * For video-type records in the prompt feed:
 *   - video src: sourceUrl (actual playable video) > previewUrl (might be image)
 *   - poster: posterUrl > previewUrl
 */
export function resolvePromptRecordVideo(record: PromptRecord): ResolvedVideoMedia {
  const primaryMedia: PromptMedia | undefined =
    record.media.find((m) => m.role === 'result') || record.media[0]

  const candidates: string[] = []
  let videoUrl: string | null = null
  let posterUrl: string | null = null
  let isVideoFallback = false
  let isPosterFallback = false

  if (primaryMedia) {
    // Video src: prefer sourceUrl (actual playable video), fallback to previewUrl
    if (primaryMedia.sourceUrl) {
      candidates.push(primaryMedia.sourceUrl)
      videoUrl = primaryMedia.sourceUrl
    } else if (primaryMedia.previewUrl) {
      candidates.push(primaryMedia.previewUrl)
      videoUrl = primaryMedia.previewUrl
      isVideoFallback = true
    }

    // Poster: prefer posterUrl, fallback to previewUrl
    if (primaryMedia.posterUrl) {
      candidates.push(primaryMedia.posterUrl)
      posterUrl = primaryMedia.posterUrl
    } else if (primaryMedia.previewUrl) {
      candidates.push(primaryMedia.previewUrl)
      posterUrl = primaryMedia.previewUrl
      isPosterFallback = true
    }
  }

  return { videoUrl, posterUrl, isVideoFallback, isPosterFallback, candidates }
}

/**
 * Resolve video source and poster from a SeedancePrompt record.
 *
 * For Seedance:
 *   - video src: outputUrl (the playable MP4)
 *   - poster: thumbnail > outputUrl-derived thumbnail
 */
export function resolveSeedanceVideo(record: SeedancePrompt): ResolvedVideoMedia {
  const candidates: string[] = []
  let videoUrl: string | null = null
  let posterUrl: string | null = null
  const isVideoFallback = false
  let isPosterFallback = false

  // Video src: outputUrl is the playable video
  if (record.outputUrl) {
    candidates.push(record.outputUrl)
    videoUrl = record.outputUrl
  }

  // Poster: thumbnail first, then derive from outputUrl
  if (record.thumbnail) {
    candidates.push(record.thumbnail)
    posterUrl = record.thumbnail
  } else if (record.outputUrl && record.outputUrl.includes('/outputs/')) {
    const derived = record.outputUrl.replace('/outputs/', '/thumbnails/').replace(/\.mp4$/, '.jpg')
    candidates.push(derived)
    posterUrl = derived
    isPosterFallback = true
  }

  return { videoUrl, posterUrl, isVideoFallback, isPosterFallback, candidates }
}

/**
 * Check if a URL looks like a data URI (inline placeholder).
 */
export function isDataUri(url: string | null | undefined): boolean {
  if (!url) return false
  return url.trim().toLowerCase().startsWith('data:')
}

/**
 * Check if a URL is a broken/placeholder SVG data URI commonly used
 * as a placeholder when no real media is available.
 */
export function isPlaceholderDataUri(url: string | null | undefined): boolean {
  if (!url || !isDataUri(url)) return false
  // SVG placeholders typically contain "svg" in the data URI
  return url.includes('svg')
}
