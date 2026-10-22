/**
 * Shared Personalization entry-point contract.
 *
 * ONE contract, ONE modal, ONE provider.
 *
 * Every studio in SmartVideo GO AI that wants to open the Personalization Modal
 * describes WHAT it already has (media, prompt, brand) through
 * `PersonalizationEntryPoint` and hands that description to the EXISTING
 * `DemoPersonalizeProvider` through `createPersonalizationOpenOptions`.
 *
 * This module is an ADAPTER and nothing else:
 *
 *  · it owns no modal behaviour, no wizard step and no provider state;
 *  · it does not re-implement source normalisation — it builds the
 *    `PersonalizationSource` shape the provider already accepts, and the
 *    provider's own `normalizePersonalizationSource` passes that shape through
 *    untouched (it is already normalised);
 *  · it reuses the shared `MEDIA_PENDING_KEY` flag so a source with no
 *    playable media behaves exactly like a demo with no playable media.
 *
 * The module is deliberately free of React so it can be unit-tested without
 * mounting the modal.
 */

import {
  MEDIA_PENDING_KEY,
  positiveNumberOrUndefined,
  trimmed,
} from './demoSources'
import type {
  GenerationResult,
  PersonalizationAccessMode,
  PersonalizationSource,
} from './types'

/**
 * The media a studio can offer to the shared modal.
 *
 * Mirrors `PersonalizationSource['mediaType']` exactly — the contract does not
 * introduce a second media vocabulary.
 */
export type PersonalizationMediaType = 'video' | 'image' | 'prompt-only'

/** Brand context a studio already knows about and can hand over. */
export interface PersonalizationBrandAssets {
  logoUrl?: string
  brandName?: string
  brandColors?: string[]
}

/**
 * What the shared modal hands back to the originating studio.
 *
 * This is the provider's own `GenerationResult` — the same object the modal
 * renders — so there is exactly one result type in the system.
 */
export type PersonalizationResult = GenerationResult

/**
 * The contract every studio uses to open the shared Personalization Modal.
 *
 * A studio fills in what it has; the adapter maps it onto the source the
 * existing provider already accepts.
 */
export interface PersonalizationEntryPoint {
  /** Which studio opened the modal. Used for provenance and for the title. */
  originatingStudio: string
  /** Stable project identifier, when the studio has one. */
  projectRef?: string
  /** Playable source video URL, when the studio has a video. */
  sourceVideo?: string
  /** Source image URL (or the poster still of a video), when the studio has one. */
  sourceImage?: string
  /** Which of the two media the studio is offering. */
  mediaType: PersonalizationMediaType
  /** e.g. '16:9'. */
  aspectRatio?: string
  /** Source duration in seconds, when the studio knows it. */
  durationSeconds?: number
  /** Brand context the studio already has. */
  brandAssets?: PersonalizationBrandAssets
  /** Prompt the studio already has; shown first inside the modal. */
  prompt?: string
  /** Human-readable title for the modal header. */
  title?: string
  /** Model the studio generated with, when it has one. */
  model?: string
  /** Model display name, when the studio has one. */
  modelName?: string
  /**
   * Which discovery backend the modal may call. Defaults to 'authenticated',
   * which is the same default the provider applies when a caller omits it.
   */
  access?: PersonalizationAccessMode
  /** Called with the personalization result once one is available. */
  onComplete?: (result: PersonalizationResult) => void
}

/**
 * `sourceType` used for sources that come from a studio entry point rather
 * than from one of the curated demo libraries. It is the source type the
 * shared `PersonalizationSource` union already reserves for exactly this.
 */
export const PERSONALIZATION_ENTRY_POINT_SOURCE_TYPE = 'future-demo' as const

/** The normalised request: the source plus the access mode. */
export interface PersonalizationOpenRequest {
  source: PersonalizationSource
  access: PersonalizationAccessMode
}

/**
 * The options the existing provider's `openPersonalize` accepts, filled in from
 * the contract. Structurally compatible with the provider's own
 * `OpenPersonalizeOptions`.
 */
export interface PersonalizationOpenOptions extends PersonalizationOpenRequest {
  /** The element that opened the modal; receives focus again on close. */
  trigger?: HTMLElement | null
  /** Completion callback handed to the provider. */
  onComplete?: (result: PersonalizationResult) => void
}

/**
 * Normalises a studio entry point into the shape the EXISTING provider
 * already accepts.
 *
 * Rules (identical in spirit to the shared demo source mappers):
 *
 *  1. NO SUBSTITUTION. A `video` entry point uses its own `sourceVideo`; an
 *     `image` entry point uses its own `sourceImage`. Nothing is borrowed
 *     from another record.
 *  2. NO FABRICATED VALUES. `aspectRatio`, `duration` and `model` stay
 *     undefined when the studio does not declare them.
 *  3. NO SUBSTITUTED MEDIA. A video entry point without a playable video keeps
 *     `sourceMedia: null` and is flagged `mediaPending`, so the modal shows an
 *     actionable message instead of a broken player.
 */
export function toPersonalizationOpenRequest(
  entry: PersonalizationEntryPoint,
): PersonalizationOpenRequest {
  const studio = trimmed(entry.originatingStudio)
  const projectRef = trimmed(entry.projectRef)
  const sourceVideo = trimmed(entry.sourceVideo)
  const sourceImage = trimmed(entry.sourceImage)
  const mediaType: PersonalizationMediaType = entry.mediaType

  const sourceMedia =
    mediaType === 'video'
      ? sourceVideo || null
      : mediaType === 'image'
        ? sourceImage || null
        : null

  // For an image entry point the image IS the poster. For a video entry point
  // an image is the poster still. A prompt-only entry point has neither.
  const poster = mediaType === 'prompt-only' ? null : sourceImage || null

  const duration = positiveNumberOrUndefined(entry.durationSeconds)
  const prompt = trimmed(entry.prompt)
  const title = trimmed(entry.title) || `Personalization — ${studio || 'SmartVideo GO AI'}`

  // A stable, studio-scoped id: the same entry point always resolves to the
  // same source id, so a saved project restores in the studio it belongs to.
  const sourceId = projectRef
    ? `${studio}:${projectRef}`
    : `${studio}:${mediaType}:${sourceMedia || 'no-media'}`

  const mediaPending = mediaType !== 'prompt-only' && !sourceMedia

  const brandAssets = normalizeBrandAssets(entry.brandAssets)

  const sourceMetadata: Record<string, unknown> = {
    originatingStudio: studio,
    ...(projectRef ? { projectRef } : {}),
    ...(brandAssets ? { brandAssets } : {}),
    ...(mediaPending ? { [MEDIA_PENDING_KEY]: true } : {}),
  }

  const source: PersonalizationSource = {
    sourceType: PERSONALIZATION_ENTRY_POINT_SOURCE_TYPE,
    id: sourceId,
    title,
    mediaType,
    sourceMedia,
    poster,
    shortPrompt: prompt,
    fullPrompt: prompt,
    originalPrompt: prompt,
    model: trimmed(entry.model) || undefined,
    modelName: trimmed(entry.modelName) || undefined,
    aspectRatio: trimmed(entry.aspectRatio) || undefined,
    duration,
    durationLabel: duration ? `${duration}s` : undefined,
    sourceMetadata,
  }

  return { source, access: entry.access || 'authenticated' }
}

/**
 * Builds the options to hand to the existing provider's `openPersonalize`.
 *
 * ```ts
 * const { openPersonalize } = useDemoPersonalize()
 * openPersonalize(createPersonalizationOpenOptions({
 *   originatingStudio: 'thumbnail-studio',
 *   mediaType: 'image',
 *   sourceImage: lastImageUrl,
 * }, { trigger: event.currentTarget }))
 * ```
 */
export function createPersonalizationOpenOptions(
  entry: PersonalizationEntryPoint,
  options: { trigger?: HTMLElement | null } = {},
): PersonalizationOpenOptions {
  const { source, access } = toPersonalizationOpenRequest(entry)
  return {
    source,
    access,
    trigger: options.trigger ?? null,
    ...(entry.onComplete ? { onComplete: entry.onComplete } : {}),
  }
}

/**
 * Hands a personalization result to the originating studio.
 *
 * The provider calls this the moment a result becomes available so a studio
 * can send the personalized output back to its own surface without the modal
 * knowing anything about that studio. It is a plain function so the delivery
 * contract can be unit-tested without mounting the modal.
 */
export function deliverPersonalizationResult(
  result: PersonalizationResult,
  onComplete?: (result: PersonalizationResult) => void,
): PersonalizationResult {
  if (typeof onComplete === 'function') {
    onComplete(result)
  }
  return result
}

/** Drops empty brand fields so the modal never receives a blank brand value. */
function normalizeBrandAssets(
  brandAssets: PersonalizationBrandAssets | undefined,
): PersonalizationBrandAssets | undefined {
  if (!brandAssets) return undefined

  const logoUrl = trimmed(brandAssets.logoUrl)
  const brandName = trimmed(brandAssets.brandName)
  const brandColors = Array.isArray(brandAssets.brandColors)
    ? brandAssets.brandColors
        .filter((color): color is string => typeof color === 'string')
        .map((color) => color.trim())
        .filter((color) => color.length > 0)
    : []

  if (!logoUrl && !brandName && brandColors.length === 0) return undefined

  return {
    ...(logoUrl ? { logoUrl } : {}),
    ...(brandName ? { brandName } : {}),
    ...(brandColors.length > 0 ? { brandColors } : {}),
  }
}
