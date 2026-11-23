// Browser helpers for the Brand Studio pages. BYOK: the MuAPI key lives in the browser only.
import { useEffect, useState } from 'react'
import { rowToBrand } from './brandRows'

export function getMuapiKey(): string {
  try {
    const w = window as any
    return w.__MUAPI_KEY__ || localStorage.getItem('muapi_key') || ''
  } catch { return '' }
}

/** Whether a MuAPI key is set. False during SSR/first render so hydration matches, then the real value. */
export function useHasMuapiKey(): boolean {
  const [has, setHas] = useState(false)
  useEffect(() => { setHas(getMuapiKey() !== '') }, [])
  return has
}

async function json(res: Response) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const e = data?.error
    throw new Error(typeof e === 'string' ? e : e?.message || `Request failed (${res.status})`)
  }
  return data?.data !== undefined ? data.data : data
}

/** Stateless generation (analyze, concepts, asset, photo, animate, poll …). */
export async function studio<T = any>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const key = getMuapiKey()
  if (!key) throw new Error('Add your MuAPI key in Settings to generate.')
  return json(await fetch('/api/brand-studio', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': key }, body: JSON.stringify({ action, ...payload }) }))
}

export const store = {
  list: <T = any>(kind: string, filter: Record<string, string> = {}) => fetch(`/api/brand-studio/store?${new URLSearchParams({ kind, ...filter })}`).then(json) as Promise<T[]>,
  get: <T = any>(kind: string, id: string) => fetch(`/api/brand-studio/store?${new URLSearchParams({ kind, id })}`).then(json) as Promise<T>,
  create: <T = any>(kind: string, data: unknown) => fetch('/api/brand-studio/store', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind, data }) }).then(json) as Promise<T>,
  update: <T = any>(kind: string, id: string, data: unknown) => fetch('/api/brand-studio/store', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind, id, data }) }).then(json) as Promise<T>,
}

export async function loadBrand(id: string) { return rowToBrand(await store.get('brand', id)) }

/** Poll an animation request until it completes, fails, or times out. */
export async function waitForVideo(requestId: string, { intervalMs = 4000, maxMs = 8 * 60_000 } = {}): Promise<string> {
  const start = Date.now()
  while (Date.now() - start < maxMs) {
    let r: any
    try { r = await studio('poll', { requestId }) } catch (e: any) {
      if (/\((4\d\d)\)|key/i.test(e.message)) throw e // terminal upstream failure
      await new Promise((res) => setTimeout(res, intervalMs)); continue
    }
    if (r.status === 'completed' && r.url) return r.url
    if (r.status === 'failed') throw new Error(r.error || 'Animation failed')
    await new Promise((res) => setTimeout(res, intervalMs))
  }
  throw new Error('Animation timed out')
}

/** Copy normaliser: new concepts have theme/key_message, campaigns made by the old generator have visualTheme/tagline. */
export function normalizeConcept(c: any) {
  return {
    title: c.title || '',
    theme: c.theme || c.visualTheme || '',
    key_message: c.key_message || c.tagline || '',
    hook: c.hook || c.copyAngle || '',
    cta: c.cta || '',
    recommended_platforms: Array.isArray(c.recommended_platforms) ? c.recommended_platforms : [],
    tone_notes: c.tone_notes || '',
    visual_direction: c.visual_direction || c.visualTheme || '',
  }
}
