import type { Destination, PublishResult } from '@/components/social-publishing/types'
import type { CopyState } from '@/components/social-publishing/types'
import {
  listExternalSocialAccounts,
  connectSocialAccount,
  disconnectExternalSocialAccount,
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
import axios from 'axios'

function withKey(config: any, apiKey: string) {
  return {
    ...config,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': String(apiKey || '')
        .replace(/[\u200B-\u200D\uFEFF\u2060\u00AD]/g, '')  // zero-width chars, BOM, word joiner, soft hyphen
        .replace(/^[\s\u0000-\u001F]+|[\s\u0000-\u001F]+$/g, '')
        .trim(),
      ...(config.headers || {}),
    },
  };
}
}

export interface SocialPublishServiceOptions {
  apiKey: string
  externalUserId: string
  redirectTo?: string
}

export async function listAccounts(platform: string, opts: SocialPublishServiceOptions) {
  const res = await axios.get(
    `/api/v1/social/ext/accounts?external_user_id=${encodeURIComponent(opts.externalUserId)}`,
    withKey({ method: 'GET' }, opts.apiKey),
  )
  const list = Array.isArray(res.data) ? res.data : res.data?.accounts || []
  return list.filter((a: any) => {
    const p = String(a.platform_name || a.platform || '').toLowerCase()
    return p === platform.toLowerCase()
  })
}

export async function connectAccount(platform: string, opts: SocialPublishServiceOptions) {
  const redirectTo = opts.redirectTo || (typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '/')
  return connectSocialAccount(opts.apiKey, opts.externalUserId, redirectTo, platform)
}

export async function disconnectAccount(accountId: string, opts: SocialPublishServiceOptions) {
  return disconnectExternalSocialAccount(opts.apiKey, accountId)
}

function buildPayload(destination: Destination, copy: CopyState, mediaType: 'video' | 'image', assetUrl: string) {
  const base = { account_id: destination.accountId, media_url: assetUrl }
  const platform = destination.platform
  const platformCopy = copy.platforms[platform] || {}
  const settings = destination.settings || {}

  switch (platform) {
    case 'youtube':
      return {
        ...base,
        title: (platformCopy.title || copy.master || 'Untitled').trim(),
        description: (platformCopy.description || '').trim() || undefined,
        privacy: settings.privacy || 'public',
        category_id: '',
        made_for_kids: false,
      }
    case 'instagram':
      return {
        ...base,
        caption: (platformCopy.caption || copy.master || '').trim() || undefined,
        media_type: mediaType === 'image' ? 'IMAGE' : 'VIDEO',
        placement: 'reels',
        share_to_feed: true,
        ...settings,
      }
    case 'tiktok':
      return {
        ...base,
        title: (platformCopy.title || copy.master || '').trim() || undefined,
        privacy_level: 'PUBLIC_TO_EVERYONE',
        disable_comment: false,
        disable_duet: false,
        disable_stitch: false,
        ...settings,
      }
    case 'facebook':
      return {
        ...base,
        title: (platformCopy.title || copy.master || '').trim() || undefined,
        description: (platformCopy.description || '').trim() || undefined,
        ...settings,
      }
    case 'linkedin':
      return {
        ...base,
        title: (platformCopy.title || copy.master || '').trim() || undefined,
        description: (platformCopy.description || '').trim() || undefined,
        ...settings,
      }
    case 'pinterest':
      return {
        ...base,
        title: (platformCopy.title || copy.master || '').trim() || undefined,
        description: (platformCopy.description || '').trim() || undefined,
        ...settings,
      }
    case 'threads':
      return {
        ...base,
        title: (platformCopy.title || copy.master || '').trim() || undefined,
        description: (platformCopy.description || '').trim() || undefined,
        ...settings,
      }
    case 'x':
      return {
        ...base,
        title: (platformCopy.title || copy.master || '').trim() || undefined,
        description: (platformCopy.description || '').trim() || undefined,
        ...settings,
      }
    default:
      return { ...base, ...settings }
  }
}

async function callPublish(platform: string, apiKey: string, payload: Record<string, any>) {
  switch (platform) {
    case 'youtube':
      return publishToYouTube(apiKey, payload)
    case 'instagram':
      return publishToInstagram(apiKey, payload)
    case 'tiktok':
      return publishToTikTok(apiKey, payload)
    case 'facebook':
      return publishToFacebook(apiKey, payload)
    case 'linkedin':
      return publishToLinkedIn(apiKey, payload)
    case 'pinterest':
      return publishToPinterest(apiKey, payload)
    case 'threads':
      return publishToThreads(apiKey, payload)
    case 'x':
      return publishToX(apiKey, payload)
    default:
      throw new Error(`Unsupported platform: ${platform}`)
  }
}

export async function publish(destination: Destination, copy: CopyState, mediaType: 'video' | 'image', assetUrl: string, apiKey: string): Promise<PublishResult> {
  const payload = buildPayload(destination, copy, mediaType, assetUrl)
  const submit = await callPublish(destination.platform, apiKey, payload)
  const requestId = submit?.request_id || submit?.id
  if (!requestId) {
    return {
      platform: destination.platform,
      status: 'published',
      url: submit?.url || submit?.data?.url,
      accountId: destination.accountId,
    }
  }
  const final = await pollSocialResult(apiKey, requestId, 120, 2000)
  const out = final?.output || final?.data?.output || final
  const url = out?.url || out?.media_id || out?.publish_id || final?.url
  return {
    platform: destination.platform,
    status: 'published',
    url,
    accountId: destination.accountId,
  }
}

export async function pollResult(predictionId: string, apiKey: string) {
  return pollSocialResult(apiKey, predictionId, 120, 2000)
}
