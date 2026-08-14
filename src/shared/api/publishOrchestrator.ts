import type { Destination, CopyState, ThumbnailState, Asset, PublishResult } from '@/components/social-publishing/types'
import { publish } from './socialPublishService'

export interface PublishOrchestratorOptions {
  destinations: Destination[]
  asset: Asset
  copy: CopyState
  thumbnail: ThumbnailState
  apiKey: string
  onProgress?: (results: PublishResult[]) => void
}

export async function publishOrchestrator({
  destinations,
  asset,
  copy,
  thumbnail,
  apiKey,
  onProgress,
}: PublishOrchestratorOptions): Promise<PublishResult[]> {
  const enabled = destinations.filter((d) => d.enabled && d.accountId)
  if (enabled.length === 0) return []

  const tasks = enabled.map((destination) =>
    publish(destination, copy, asset.type, asset.url, apiKey)
      .then((result): PublishResult => ({ ...result, status: 'published' }))
      .catch((err: any): PublishResult => ({
        platform: destination.platform,
        status: 'failed',
        error: err instanceof Error ? err.message : 'Publish failed',
        accountId: destination.accountId,
      }))
  )

  const settled = await Promise.allSettled(tasks)
  const results: PublishResult[] = settled.map((s) => (s.status === 'fulfilled' ? s.value : {
    platform: 'unknown',
    status: 'failed',
    error: 'Publish task rejected',
  }))

  onProgress?.(results)
  return results
}
