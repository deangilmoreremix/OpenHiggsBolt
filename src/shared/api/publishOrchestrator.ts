import type { Destination, CopyState, ThumbnailState, Asset, PublishResult } from '@/components/social-publishing/types'
import {
  publishToYouTube,
  publishToInstagram,
  publishToTikTok,
  publishToFacebook,
  publishToLinkedIn,
  publishToPinterest,
  publishToThreads,
  publishToX,
  pollSocialResult,
} from '@/lib/muapi'
import { PLATFORM_SPECS, buildPublishPayload, describePublishError, type PlatformId } from './socialPayloads'

type PublishFn = (apiKey: string, payload: Record<string, any>) => Promise<any>

export interface PublishDeps {
  publish: Record<PlatformId, PublishFn>
  poll: (apiKey: string, requestId: string) => Promise<any>
}

const defaultDeps: PublishDeps = {
  publish: {
    youtube: publishToYouTube,
    instagram: publishToInstagram,
    tiktok: publishToTikTok,
    facebook: publishToFacebook,
    linkedin: publishToLinkedIn,
    pinterest: publishToPinterest,
    threads: publishToThreads,
    x: publishToX,
  },
  poll: (apiKey, requestId) => pollSocialResult(apiKey, requestId, 120, 2000),
}

export interface PublishOrchestratorOptions {
  destinations: Destination[]
  asset: Asset
  copy: CopyState
  thumbnail?: ThumbnailState
  apiKey: string
  /** Called after every state change with the full, ordered result list. */
  onProgress?: (results: PublishResult[]) => void
  deps?: PublishDeps
}

function resultUrl(out: any): string | undefined {
  if (!out || typeof out !== 'object') return undefined
  return out.url || out.link || out.permalink || undefined
}

/**
 * Publish ONE destination. Never throws: every outcome is a PublishResult
 * ('published' | 'failed'), with a plain-language error.
 */
export async function publishOne(
  destination: Destination,
  asset: Asset,
  copy: CopyState,
  thumbnail: ThumbnailState | undefined,
  apiKey: string,
  deps: PublishDeps = defaultDeps,
  onSubmitted?: (requestId: string) => void,
): Promise<PublishResult> {
  const platform = destination.platform as PlatformId
  const spec = PLATFORM_SPECS[platform]
  const label = spec?.label ?? destination.platform
  const fail = (error: string, requestId?: string): PublishResult => ({
    platform: destination.platform,
    status: 'failed',
    error,
    accountId: destination.accountId,
    requestId: requestId ?? '',
  })

  if (!apiKey) return fail('Add your MuAPI key in the API keys settings first.')
  const built = buildPublishPayload({
    platform,
    accountId: destination.accountId ?? '',
    mediaUrl: asset.url,
    mediaType: asset.type,
    copy,
    settings: destination.settings,
    thumbnailUrl: thumbnail?.imageUrl,
  })
  if (!built.payload) return fail(built.errors.join(' '))

  let requestId = ''
  try {
    const submit = await deps.publish[platform](apiKey, built.payload)
    requestId = String(submit?.request_id || submit?.id || '')
    if (!requestId) {
      // Some responses complete immediately with an output; anything else is unexpected.
      const done = String(submit?.status || '').toLowerCase() === 'completed'
      const out = submit?.output ?? submit?.data?.output
      if (done && out) {
        return { platform: destination.platform, status: 'published', url: resultUrl(out), accountId: destination.accountId, requestId: '', output: out }
      }
      return fail(`${label} did not accept the post (unexpected response from MuAPI). Nothing was published.`)
    }
    onSubmitted?.(requestId)
    const final = await deps.poll(apiKey, requestId)
    const out = final?.output ?? final?.data?.output ?? final
    return {
      platform: destination.platform,
      status: 'published',
      url: resultUrl(out),
      accountId: destination.accountId,
      requestId,
      output: out,
    }
  } catch (err) {
    return fail(describePublishError(err, label), requestId)
  }
}

/**
 * Publish every enabled destination, one after another (so rate limits and
 * per-platform errors stay readable), reporting progress after each change.
 * Replaces any earlier result for the same platform + account.
 */
export async function publishOrchestrator({
  destinations,
  asset,
  copy,
  thumbnail,
  apiKey,
  onProgress,
  deps = defaultDeps,
}: PublishOrchestratorOptions): Promise<PublishResult[]> {
  const enabled = destinations.filter((d) => d.enabled && d.accountId)
  if (enabled.length === 0) return []

  const results: PublishResult[] = enabled.map((d) => ({
    platform: d.platform,
    status: 'queued',
    accountId: d.accountId,
    requestId: '',
  }))
  onProgress?.([...results])

  for (let i = 0; i < enabled.length; i++) {
    results[i] = { ...results[i], status: 'processing' }
    onProgress?.([...results])
    results[i] = await publishOne(enabled[i], asset, copy, thumbnail, apiKey, deps, (requestId) => {
      results[i] = { ...results[i], status: 'processing', requestId }
      onProgress?.([...results])
    })
    onProgress?.([...results])
  }
  return results
}
