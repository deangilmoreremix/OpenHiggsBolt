/**
 * Simple in-memory cache for business discovery results.
 *
 * Cache key includes normalized niche, location, and radius.
 * Can be replaced with Redis/Supabase later without changing callers.
 */

import type { BusinessDiscoveryRecord } from './types'

export interface CacheEntry {
  businesses: BusinessDiscoveryRecord[]
  expiresAt: number
}

export class BusinessDiscoveryCache {
  private cache = new Map<string, CacheEntry>()

  get(key: string): BusinessDiscoveryRecord[] | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key)
      return null
    }
    return entry.businesses
  }

  set(key: string, businesses: BusinessDiscoveryRecord[], ttlMs: number): void {
    this.cache.set(key, {
      businesses,
      expiresAt: Date.now() + ttlMs,
    })
  }

  clear(): void {
    this.cache.clear()
  }

  delete(key: string): void {
    this.cache.delete(key)
  }
}

// Global cache instance
export const businessDiscoveryCache = new BusinessDiscoveryCache()

export function createCacheKey(niche: string, location: string, radiusMiles: number): string {
  return `${niche.toLowerCase()}|${location.toLowerCase()}|${radiusMiles}`
}
