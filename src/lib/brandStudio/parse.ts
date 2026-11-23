export function parseJSONObject(text: string): any {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const candidate = fenced ? fenced[1] : text
  const m = candidate.match(/\{[\s\S]*\}/)
  if (!m) throw new Error(`No JSON in model response: ${String(text).slice(0, 200)}`)
  return JSON.parse(m[0])
}

/** The model answers with a bare array (as upstream's prompt asks) but `{"concepts":[...]}` is accepted too. */
export function parseConceptList(text: string): any[] {
  const fenced = String(text).match(/```(?:json)?\s*([\s\S]*?)```/)
  const candidate = fenced ? fenced[1] : String(text)
  const arr = candidate.match(/\[[\s\S]*\]/)
  if (arr) {
    try { const v = JSON.parse(arr[0]); if (Array.isArray(v)) return v } catch { /* try the object form */ }
  }
  const obj = parseJSONObject(candidate)
  return Array.isArray(obj.concepts) ? obj.concepts : []
}

/** MuAPI text models put the answer in `outputs[0]`; other shapes are accepted as fallbacks. */
export function extractText(data: any): string {
  const d = data?.data ?? data
  const outputs = data?.outputs ?? d?.outputs
  const candidates = [
    Array.isArray(outputs) ? outputs[0] : undefined,
    data?.output, d?.output, data?.text, d?.text, data?.content, d?.content,
    data?.output?.text, data?.choices?.[0]?.message?.content,
  ]
  for (const c of candidates) if (typeof c === 'string' && c) return c
  return ''
}

export function extractImageUrl(data: any): string {
  const d = data?.data ?? data
  const outputs = data?.outputs ?? d?.outputs
  const first = Array.isArray(outputs) ? outputs[0] : undefined
  const c = [first, data?.url, d?.url, data?.image_url, d?.image_url, data?.output?.url, d?.output?.url]
  for (const v of c) if (typeof v === 'string' && v) return v
  return ''
}

export const truncateWords = (text: string, max: number): string => {
  const words = (text || '').trim().split(/\s+/).filter(Boolean)
  return words.length > max ? words.slice(0, max).join(' ') : (text || '').trim()
}

export const asString = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback)
export const asStringArray = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && !!x) : [])

export function dedupHex(...lists: string[][]): string[] {
  const out: string[] = []
  for (const list of lists) for (const c of list) if (c && !out.includes(c.toLowerCase())) out.push(c.toLowerCase())
  return out
}
