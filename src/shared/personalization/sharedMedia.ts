/**
 * sharedMedia.ts
 *
 * Shared media types and utilities for the personalization system.
 */

export interface SharedMediaEntry {
  id: string
  originStudio: 'demo-personalization'
  sourceType: string
  sourceDemoId?: string
  sourceDemoSlug?: string
  viralRecordId?: string
  sourceMedia: string | null
  sourceUrl: string | null
  personalizationMode: string | null
  model: string | null
  originalPrompt: string
  personalizedPrompt: string
  identityAssetIds: string[]
  logoAssetIds: string[]
  productAssetIds: string[]
  brandReferenceAssetIds: string[]
  firstFrameAssetId: string | null
  lastFrameAssetId: string | null
  outputUrls: string[]
  outputType: string
  clientId?: string
  createdAt: string
}

const STORAGE_KEY = 'smartvideo_shared_media'

function readStorage(): SharedMediaEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeStorage(data: SharedMediaEntry[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function getSharedMedia(): SharedMediaEntry[] {
  return readStorage().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function registerSharedMedia(entry: Partial<SharedMediaEntry>): SharedMediaEntry {
  const full: SharedMediaEntry = {
    id: `sm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    originStudio: 'demo-personalization',
    sourceType: entry.sourceType || 'unknown',
    sourceMedia: entry.sourceMedia || null,
    sourceUrl: entry.sourceUrl || null,
    personalizationMode: entry.personalizationMode || null,
    model: entry.model || null,
    originalPrompt: entry.originalPrompt || '',
    personalizedPrompt: entry.personalizedPrompt || '',
    identityAssetIds: entry.identityAssetIds || [],
    logoAssetIds: entry.logoAssetIds || [],
    productAssetIds: entry.productAssetIds || [],
    brandReferenceAssetIds: entry.brandReferenceAssetIds || [],
    firstFrameAssetId: entry.firstFrameAssetId || null,
    lastFrameAssetId: entry.lastFrameAssetId || null,
    outputUrls: entry.outputUrls || [],
    outputType: entry.outputType || 'prompt',
    clientId: entry.clientId,
    createdAt: entry.createdAt || new Date().toISOString(),
  }
  const data = readStorage()
  data.push(full)
  writeStorage(data)
  return full
}

export function createSharedMediaEntry(partial: Partial<SharedMediaEntry>): SharedMediaEntry {
  return registerSharedMedia(partial)
}
