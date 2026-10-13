# Phase 1: Open-Pomelli Brand Studio Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring OpenHiggsBolt to feature parity with Open-Pomelli’s Brand Studio flow: AI brand analysis, editable Brand DNA, campaign creation, platform-specific asset generation, animate, and replace the ephemeral in-memory brand store with Supabase-backed persistence.

**Architecture:** Add Next.js API routes and pages that mirror upstream Open-Pomelli, backed by the existing Supabase `brand_dna`, `brand_campaigns`, `brand_assets`, `brand_photoshoots`, and `brand_animations` tables. Reuse the existing design tokens, Clerk auth, MuAPI client, and OpenAI integration. Keep the same single-server Next.js deployment model.

**Tech Stack:** Next.js 15, React 19, Tailwind 3, TypeScript, Supabase, OpenAI, MuAPI, Playwright (devDependency already present).

## Global Constraints

- Use existing `designTokens.ts` for all UI styling.
- Use existing `getSupabaseAdmin()` from `src/lib/supabaseServer.ts` for server-side Supabase access.
- Use existing `lib/muapi.js` and `src/lib/muapi.js` for MuAPI calls.
- Use existing `src/shared/api/openai.ts` patterns for OpenAI calls.
- Keep all new routes/apps under the existing Next.js app directory.
- Do not break existing studios, auth, billing, or landing pages.
- Brand DNA arrays are stored as CSV strings in Supabase text columns.

---

### Task 1: Migrate brands API from in-memory Map to Supabase

**Files:**
- Modify: `app/api/brands/route.ts`
- Modify: `src/shared/brandStore.ts`

**Interfaces:**
- Consumes: `getSupabaseAdmin()`, `brandStore` types
- Produces: `GET /api/brands` returns `{ id, url, brand_name, industry, primary_colors }[]`, `POST /api/brands` returns `{ id, brand_name, url }`

- [ ] **Step 1: Write the failing test**

Create `tests/api/brands-route.test.ts`:
```typescript
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/brands/route';

function makeRequest(url: string): NextRequest {
  return new NextRequest(url);
}

describe('GET /api/brands', () => {
  it('returns empty list when no brands exist', async () => {
    const req = makeRequest('http://localhost/api/brands');
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.items).toEqual([]);
  });
});

describe('POST /api/brands', () => {
  it('creates a brand and returns it', async () => {
    const req = makeRequest('http://localhost/api/brands', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://example.com' }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.url).toBe('https://example.com');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/api/brands-route.test.ts`
Expected: FAIL with import/module errors because route uses `export async function` not named exports.

- [ ] **Step 3: Write minimal implementation**

Modify `app/api/brands/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/src/lib/supabaseServer'
import { ok, apiError } from '@/lib/apiError'

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
  const rawPageSize = parseInt(searchParams.get('pageSize') || String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, rawPageSize))

  const supabase = getSupabaseAdmin()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data: items, count, error } = await supabase
    .from('brand_dna')
    .select('id, url, brand_name, industry, primary_colors, secondary_colors', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    return apiError('server_error', error.message, 500)
  }

  const total = count || 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)

  return ok(items || [], { page: safePage, pageSize, total, totalPages })
}

export async function POST(req: NextRequest) {
  let body: any = {}
  try { body = await req.json() } catch {}
  const url = body.url
  if (!url || typeof url !== 'string') {
    return apiError('bad_request', 'url is required', 400)
  }

  const normalizedUrl = url.startsWith('http') ? url : `https://${url}`

  const supabase = getSupabaseAdmin()
  const { data: brand, error } = await supabase
    .from('brand_dna')
    .insert({
      url: normalizedUrl,
      brand_name: normalizedUrl,
      industry: 'General',
    })
    .select('id, url, brand_name, industry, primary_colors')
    .single()

  if (error) {
    return apiError('server_error', error.message, 500)
  }

  return NextResponse.json(brand)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/api/brands-route.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/api/brands/route.ts tests/api/brands-route.test.ts
git commit -m "feat: migrate /api/brands to Supabase"
```

---

### Task 2: Create brand CRUD API and AI analysis endpoint

**Files:**
- Modify: `app/api/brand/route.ts`
- Create: `src/lib/scraper.ts`
- Create: `src/lib/brandAnalyzer.ts`

**Interfaces:**
- Consumes: `getSupabaseAdmin()`, `scraper`, `brandAnalyzer`
- Produces: `GET /api/brand?id=` returns brand, `PATCH /api/brand?id=` updates brand, `POST /api/brand/analyze` returns analyzed brand

- [ ] **Step 1: Write the failing test**

Create `tests/api/brand-route.test.ts`:
```typescript
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/brand/route';

function makeRequest(url: string, init?: RequestInit): NextRequest {
  return new NextRequest(url, init);
}

describe('GET /api/brand', () => {
  it('returns 400 without id', async () => {
    const req = makeRequest('http://localhost/api/brand');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/brand', () => {
  it('returns 400 without id', async () => {
    const req = makeRequest('http://localhost/api/brand', { method: 'PATCH', body: JSON.stringify({ brand_name: 'New' }) });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
  });
});

describe('POST /api/brand/analyze', () => {
  it('returns 400 without url', async () => {
    const req = makeRequest('http://localhost/api/brand/analyze', { method: 'POST', body: JSON.stringify({}) });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/api/brand-route.test.ts`
Expected: FAIL because route uses named exports and new action not present.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/scraper.ts`:
```typescript
import dns from 'node:dns/promises'

export type ScrapeResult = {
  html: string
  title: string
  description: string
  ogImage: string
  themeColor: string
  colors: string[]
  fonts: string[]
  bodyText: string
}

function normalizeHex(value: string): string | null {
  const hex = value.trim()
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return null
  return hex.toLowerCase()
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))]
}

export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  const normalizedUrl = url.startsWith('http') ? url : `https://${url}`

  const res = await fetch(normalizedUrl, {
    headers: { 'User-Agent': 'BrandStudioBot/1.0' },
    signal: AbortSignal.timeout(10000),
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch ${normalizedUrl}: ${res.status}`)
  }

  const html = await res.text()
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || new URL(normalizedUrl).hostname
  const descriptionMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)
  const description = descriptionMatch?.[1] || ''
  const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*)["']/i)
  const ogImage = ogImageMatch?.[1] ? new URL(ogImageMatch[1], normalizedUrl).href : ''
  const themeColorMatch = html.match(/<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']*)["']/i)
  const themeColor = themeColorMatch?.[1] || ''
  const colors = unique([...html.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((m) => normalizeHex(m[0])).filter(Boolean) as string[])
  const fonts = unique([...html.matchAll(/font-family\s*:\s*([^;}]+)/gi)].flatMap((m) => m[1].split(',').map((f) => f.trim().replace(/^["']|["']$/g, ''))))
  const bodyText = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 12000)

  return { html, title, description, ogImage, themeColor, colors, fonts, bodyText }
}
```

Create `src/lib/brandAnalyzer.ts`:
```typescript
import { scrapeUrl } from './scraper'
import { getSupabaseAdmin } from '@/src/lib/supabaseServer'

const OPENAI_MODEL = 'gpt-4o'

function toCsv(value: unknown): string {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean).join(', ')
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean).join(', ')
  return ''
}

export async function analyzeBrand(url: string, openaiKey: string): Promise<any> {
  const scraped = await scrapeUrl(url)
  const supabase = getSupabaseAdmin()

  let screenshotUrl = ''
  if (scraped.ogImage) {
    const extension = scraped.ogImage.split('.').pop()?.split('?')[0] || 'bin'
    const mirrored = await fetch(scraped.ogImage).then(r => r.blob())
    const filePath = `og-image-${Date.now()}.${extension}`
    const { error: uploadError } = await supabase.storage.from('brand-analyze').upload(filePath, mirrored)
    if (!uploadError) {
      const { data } = supabase.storage.from('brand-analyze').getPublicUrl(filePath)
      screenshotUrl = data.publicUrl
    }
  }

  const prompt = `You are a senior brand strategist. Analyze the website content and optional og:image. Return ONLY a valid JSON object with these exact keys:
{
  "brand_name": "string",
  "industry": "string",
  "tagline": "string",
  "value_proposition": "string",
  "tone_of_voice": ["string"],
  "brand_personality": ["string"],
  "target_audience": "string",
  "key_messages": ["string"],
  "primary_colors": ["#hex"],
  "secondary_colors": ["#hex"],
  "fonts": ["string"],
  "logo_url": "string or empty",
  "screenshot_url": "string or empty",
  "imagery_style": "string",
  "layout_style": "string"
}

Use the extracted website metadata, visible text, colors, fonts, and image when present. Keep arrays concise. Do not include markdown fences.

Website URL: ${url}
Extracted title: ${scraped.title}
Meta description: ${scraped.description}
Theme color: ${scraped.themeColor}
Hex colors found: ${scraped.colors.join(', ')}
Fonts found: ${scraped.fonts.join(', ')}
Mirrored og:image for vision: ${screenshotUrl || 'none'}
HTML text excerpt: ${scraped.bodyText}`

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: [
        {
          role: 'system',
          content: 'Extract structured brand DNA from the provided website evidence. Return only JSON.',
        },
        {
          role: 'user',
          content: [
            { type: 'input_text', text: prompt },
            ...(screenshotUrl ? [{ type: 'input_image', image_url: screenshotUrl }] : []),
          ],
        },
      ],
      max_output_tokens: 3000,
    }),
  })

  const result = await response.json()
  const text = result.output?.[0]?.content?.[0]?.text || result.output_text || '{}'
  const jsonMatch = text.match(/\{[\s\S]*\}/)?.[0] || '{}'
  const parsed = JSON.parse(jsonMatch)

  const fallbackColors = scraped.colors.length ? scraped.colors : scraped.themeColor ? [scraped.themeColor] : ['#111111', '#ffffff']
  const row = {
    url,
    brand_name: String(parsed.brand_name || scraped.title || new URL(url).hostname),
    industry: String(parsed.industry || 'General'),
    tagline: String(parsed.tagline || scraped.description || ''),
    value_proposition: String(parsed.value_proposition || scraped.description || ''),
    tone_of_voice: toCsv(parsed.tone_of_voice),
    brand_personality: toCsv(parsed.brand_personality),
    target_audience: String(parsed.target_audience || ''),
    key_messages: toCsv(parsed.key_messages),
    primary_colors: toCsv(parsed.primary_colors?.length ? parsed.primary_colors : fallbackColors.slice(0, 3)),
    secondary_colors: toCsv(parsed.secondary_colors?.length ? parsed.secondary_colors : fallbackColors.slice(3, 6)),
    fonts: toCsv(parsed.fonts?.length ? parsed.fonts : scraped.fonts),
    logo_url: String(parsed.logo_url || ''),
    screenshot_url: String(parsed.screenshot_url || screenshotUrl || ''),
    imagery_style: String(parsed.imagery_style || ''),
    layout_style: String(parsed.layout_style || ''),
    raw_json: {
      title: scraped.title,
      description: scraped.description,
      theme_color: scraped.themeColor,
      og_image: scraped.ogImage,
      colors: scraped.colors,
      fonts: scraped.fonts,
      body_text_excerpt: scraped.bodyText,
      ai: parsed,
    },
  }

  const { data, error } = await supabase.from('brand_dna').insert(row).select().single()
  if (error) throw error
  return data
}
```

Modify `app/api/brand/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/src/lib/supabaseServer'
import { analyzeBrand } from '@/lib/brandAnalyzer'
import { ok, apiError } from '@/lib/apiError'

export async function GET(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return apiError('bad_request', 'id required', 400)

  const supabase = getSupabaseAdmin()
  const { data: brand, error } = await supabase
    .from('brand_dna')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !brand) return apiError('not_found', 'Brand not found', 404)
  return ok(brand)
}

export async function PATCH(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return apiError('bad_request', 'id required', 400)

  let body: any = {}
  try { body = await req.json() } catch {}
  const { id: _i, url: _u, created_at: _c, ...rest } = body

  const supabase = getSupabaseAdmin()
  const { data: brand, error } = await supabase
    .from('brand_dna')
    .update({ ...rest, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()

  if (error || !brand) return apiError('not_found', 'Brand not found', 404)
  return ok(brand)
}

export async function POST(req: NextRequest) {
  let body: any = {}
  try { body = await req.json() } catch {}
  const { url, openaiKey } = body
  if (!url || typeof url !== 'string') {
    return apiError('bad_request', 'url is required', 400)
  }

  try {
    const brand = await analyzeBrand(url, openaiKey || process.env.OPENAI_API_KEY || '')
    return ok(brand)
  } catch (err: any) {
    return apiError('analysis_failed', err.message || 'Brand analysis failed', 500)
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/api/brand-route.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/api/brand/route.ts src/lib/scraper.ts src/lib/brandAnalyzer.ts tests/api/brand-route.test.ts
git commit -m "feat: add brand CRUD and AI analysis API"
```

---

### Task 3: Create campaigns API

**Files:**
- Create: `app/api/campaigns/route.ts`
- Create: `src/lib/campaignGenerator.ts`

**Interfaces:**
- Consumes: `getSupabaseAdmin()`, `brandAnalyzer` types
- Produces: `GET /api/campaigns?brand_id=` returns campaigns, `POST /api/campaigns` creates campaign with 4 concepts

- [ ] **Step 1: Write the failing test**

Create `tests/api/campaigns-route.test.ts`:
```typescript
import { NextRequest } from 'next/server';

function makeRequest(url: string, init?: RequestInit): NextRequest {
  return new NextRequest(url, init);
}

describe('POST /api/campaigns', () => {
  it('returns 400 without brand_id or goal', async () => {
    const req = makeRequest('http://localhost/api/campaigns', { method: 'POST', body: JSON.stringify({}) });
    const res = await (await import('@/app/api/campaigns/route')).POST(req);
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/api/campaigns-route.test.ts`
Expected: FAIL because route does not exist.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/campaignGenerator.ts`:
```typescript
import { getSupabaseAdmin } from '@/src/lib/supabaseServer'

const OPENAI_MODEL = 'gpt-4o'

function csvToArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean)
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean)
  return []
}

export async function generateCampaign(brandId: string, goal: string, direction?: string): Promise<any> {
  const supabase = getSupabaseAdmin()

  const { data: brand, error: brandError } = await supabase.from('brand_dna').select('*').eq('id', brandId).single()
  if (brandError) throw brandError
  if (!brand) throw new Error('Brand not found')

  const prompt = `You are a senior campaign strategist. Use every brand field below to generate exactly 4 distinct campaign concepts.

Return ONLY a valid JSON array with exactly these fields on each item:
[
  {
    "title": "string",
    "tagline": "string",
    "visualTheme": "string",
    "copyAngle": "string"
  }
]

Brand fields:
id: ${brand.id}
url: ${brand.url}
brand_name: ${brand.brand_name}
industry: ${brand.industry}
tagline: ${brand.tagline}
value_proposition: ${brand.value_proposition}
tone_of_voice: ${brand.tone_of_voice}
brand_personality: ${brand.brand_personality}
target_audience: ${brand.target_audience}
key_messages: ${brand.key_messages}
primary_colors: ${brand.primary_colors}
secondary_colors: ${brand.secondary_colors}
fonts: ${brand.fonts}
logo_url: ${brand.logo_url}
screenshot_url: ${brand.screenshot_url}
imagery_style: ${brand.imagery_style}
layout_style: ${brand.layout_style}

Campaign goal: ${goal}
Optional direction: ${direction || 'none'}

Make the concepts distinct, specific to this brand, and ready for visual execution. Do not include markdown fences.`

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: prompt,
      max_output_tokens: 1800,
    }),
  })

  const result = await response.json()
  const text = result.output?.[0]?.content?.[0]?.text || result.output_text || '[]'
  const jsonMatch = text.match(/\[[\s\S]*\]/)?.[0] || '[]'
  const concepts = JSON.parse(jsonMatch).slice(0, 4)

  if (!concepts.length) {
    throw new Error('OpenAI did not return campaign concepts')
  }

  const { data: campaign, error: campaignError } = await supabase
    .from('brand_campaigns')
    .insert({ brand_id: brandId, goal, direction, concepts })
    .select('*')
    .single()

  if (campaignError) throw campaignError
  return campaign
}
```

Create `app/api/campaigns/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/src/lib/supabaseServer'
import { generateCampaign } from '@/lib/campaignGenerator'
import { ok, apiError } from '@/lib/apiError'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const brandId = searchParams.get('brand_id')

  const supabase = getSupabaseAdmin()
  let query = supabase.from('brand_campaigns').select('*').order('created_at', { ascending: false })

  if (brandId) {
    query = query.eq('brand_id', brandId)
  }

  const { data: campaigns, error } = await query
  if (error) return apiError('server_error', error.message, 500)

  return ok(campaigns || [])
}

export async function POST(req: NextRequest) {
  let body: any = {}
  try { body = await req.json() } catch {}
  const { brand_id, goal, direction } = body

  if (!brand_id || !goal) {
    return apiError('bad_request', 'brand_id and goal are required', 400)
  }

  try {
    const campaign = await generateCampaign(brand_id, goal, direction)
    return ok(campaign)
  } catch (err: any) {
    return apiError('generation_failed', err.message || 'Campaign generation failed', 500)
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/api/campaigns-route.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/api/campaigns/route.ts src/lib/campaignGenerator.ts tests/api/campaigns-route.test.ts
git commit -m "feat: add campaigns API"
```

---

### Task 4: Create assets API

**Files:**
- Create: `app/api/assets/route.ts`
- Create: `src/lib/assetGenerator.ts`

**Interfaces:**
- Consumes: `getSupabaseAdmin()`, campaign/brand data
- Produces: `GET /api/assets?campaign_id=` returns assets, `POST /api/assets` generates asset for platform

- [ ] **Step 1: Write the failing test**

Create `tests/api/assets-route.test.ts`:
```typescript
import { NextRequest } from 'next/server';

function makeRequest(url: string, init?: RequestInit): NextRequest {
  return new NextRequest(url, init);
}

describe('POST /api/assets', () => {
  it('returns 400 without campaign_id or platform', async () => {
    const req = makeRequest('http://localhost/api/assets', { method: 'POST', body: JSON.stringify({}) });
    const res = await (await import('@/app/api/assets/route')).POST(req);
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/api/assets-route.test.ts`
Expected: FAIL because route does not exist.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/assetGenerator.ts`:
```typescript
import { getSupabaseAdmin } from '@/src/lib/supabaseServer'

const OPENAI_MODEL = 'gpt-4o'
const IMAGE_MODEL = 'dall-e-3'

interface Platform {
  id: string
  label: string
  width: number
  height: number
  dalleSize: '1024x1024' | '1792x1024' | '1024x1792'
  wordCap: number
}

const PLATFORMS: Platform[] = [
  { id: 'instagram_feed', label: 'Instagram Feed', width: 1080, height: 1080, dalleSize: '1024x1024', wordCap: 125 },
  { id: 'instagram_story', label: 'Instagram Story', width: 1080, height: 1920, dalleSize: '1024x1792', wordCap: 80 },
  { id: 'linkedin', label: 'LinkedIn Post', width: 1200, height: 627, dalleSize: '1792x1024', wordCap: 150 },
  { id: 'facebook_ad', label: 'Facebook Ad', width: 1200, height: 628, dalleSize: '1792x1024', wordCap: 125 },
  { id: 'twitter', label: 'X / Twitter', width: 1600, height: 900, dalleSize: '1792x1024', wordCap: 100 },
  { id: 'web_banner', label: 'Web Banner', width: 1920, height: 600, dalleSize: '1792x1024', wordCap: 60 },
  { id: 'email_header', label: 'Email Header', width: 600, height: 200, dalleSize: '1792x1024', wordCap: 50 },
  { id: 'youtube_thumb', label: 'YouTube Thumbnail', width: 1280, height: 720, dalleSize: '1792x1024', wordCap: 60 },
]

function csvToArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean)
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean)
  return []
}

export async function generateAsset(campaignId: string, platformId: string, conceptIndex: number): Promise<any> {
  const supabase = getSupabaseAdmin()
  const platform = PLATFORMS.find((p) => p.id === platformId) || PLATFORMS[0]

  const { data: campaignWithBrand, error: campaignError } = await supabase
    .from('brand_campaigns')
    .select('*, brand_dna(*)')
    .eq('id', campaignId)
    .single()

  if (campaignError) throw campaignError
  if (!campaignWithBrand) throw new Error('Campaign not found')

  let brand = campaignWithBrand.brand_dna
  if (!brand) {
    const { data: fallbackBrand } = await supabase.from('brand_dna').select('*').eq('id', campaignWithBrand.brand_id).single()
    brand = fallbackBrand
  }
  if (!brand) throw new Error('Brand not found')

  const concept = campaignWithBrand.concepts?.[conceptIndex] || campaignWithBrand.concepts?.[0] || {}
  const colors = csvToArray(brand.primary_colors).concat(csvToArray(brand.secondary_colors)).join(', ') || 'the brand palette'
  const fonts = csvToArray(brand.fonts).join(', ') || 'clean brand typography'

  const copyPrompt = `You are a conversion-focused copywriter. Generate platform-specific ad copy for one selected campaign concept.

Return ONLY valid JSON:
{
  "headline": "string",
  "body": "string",
  "cta": "string"
}

Platform: ${platform.label}
Word cap for body: ${platform.wordCap} words
Brand: ${brand.brand_name}
Industry: ${brand.industry}
Tagline: ${brand.tagline}
Value proposition: ${brand.value_proposition}
Tone of voice: ${brand.tone_of_voice}
Brand personality: ${brand.brand_personality}
Target audience: ${brand.target_audience}
Key messages: ${brand.key_messages}
Colors: ${colors}
Fonts: ${fonts}
Imagery style: ${brand.imagery_style}
Layout style: ${brand.layout_style}
Campaign goal: ${campaignWithBrand.goal}
Direction: ${campaignWithBrand.direction || 'none'}
Concept title: ${concept.title || ''}
Concept tagline: ${concept.tagline || ''}
Visual theme: ${concept.visualTheme || ''}
Copy angle: ${concept.copyAngle || ''}

Keep the body under ${platform.wordCap} words. Do not include markdown fences.`

  const copyResponse = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: copyPrompt,
      max_output_tokens: 500,
    }),
  })

  const copyResult = await copyResponse.json()
  const copyText = copyResult.output?.[0]?.content?.[0]?.text || copyResult.output_text || '{}'
  const copyJsonMatch = copyText.match(/\{[\s\S]*\}/)?.[0] || '{}'
  const copy = JSON.parse(copyJsonMatch)

  const imagePrompt = `${concept.visualTheme || concept.copyAngle || concept.title || 'Brand-aligned marketing visual'}. Brand colors: ${colors}. Use ${fonts} inspired composition. NO text or typography.`

  const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: IMAGE_MODEL,
      prompt: imagePrompt,
      n: 1,
      size: platform.dalleSize,
      quality: 'standard',
      response_format: 'url',
    }),
  })

  const imageResult = await imageResponse.json()
  const temporaryImageUrl = imageResult.data?.[0]?.url
  if (!temporaryImageUrl) throw new Error('OpenAI did not return an image URL')

  const imageBlob = await fetch(temporaryImageUrl).then(r => r.blob())
  const filePath = `asset-${campaignId}-${platform.id}-${conceptIndex}-${Date.now()}.png`
  const { error: uploadError } = await supabase.storage.from('brand-assets').upload(filePath, imageBlob)
  if (uploadError) throw uploadError

  const { data: publicUrl } = supabase.storage.from('brand-assets').getPublicUrl(filePath)
  const storedImageUrl = publicUrl.publicUrl

  const { data: asset, error: assetError } = await supabase
    .from('brand_assets')
    .insert({
      campaign_id: campaignId,
      brand_id: brand.id,
      platform: platform.id,
      concept_index: Number.isInteger(conceptIndex) ? conceptIndex : 0,
      headline: String(copy.headline || ''),
      body: String(copy.body || ''),
      cta: String(copy.cta || 'Learn More'),
      image_url: storedImageUrl,
      canvas_data: {
        width: platform.width,
        height: platform.height,
        platform: platform.label,
        copy: {
          headline: String(copy.headline || ''),
          body: String(copy.body || ''),
          cta: String(copy.cta || 'Learn More'),
        },
      },
    })
    .select('*')
    .single()

  if (assetError) throw assetError
  return asset
}
```

Create `app/api/assets/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/src/lib/supabaseServer'
import { generateAsset } from '@/lib/assetGenerator'
import { ok, apiError } from '@/lib/apiError'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const campaignId = searchParams.get('campaign_id')

  const supabase = getSupabaseAdmin()
  let query = supabase.from('brand_assets').select('*').order('created_at', { ascending: false })

  if (campaignId) {
    query = query.eq('campaign_id', campaignId)
  }

  const { data: assets, error } = await query
  if (error) return apiError('server_error', error.message, 500)

  return ok(assets || [])
}

export async function POST(req: NextRequest) {
  let body: any = {}
  try { body = await req.json() } catch {}
  const { campaign_id, platform, concept_index } = body

  if (!campaign_id || !platform) {
    return apiError('bad_request', 'campaign_id and platform are required', 400)
  }

  try {
    const asset = await generateAsset(campaign_id, platform, Number(concept_index) || 0)
    return ok(asset)
  } catch (err: any) {
    return apiError('generation_failed', err.message || 'Asset generation failed', 500)
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/api/assets-route.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/api/assets/route.ts src/lib/assetGenerator.ts tests/api/assets-route.test.ts
git commit -m "feat: add assets API"
```

---

### Task 5: Create animate API

**Files:**
- Create: `app/api/animate/route.ts`
- Create: `src/lib/animate.ts`

**Interfaces:**
- Consumes: `lib/muapi.js`, `getSupabaseAdmin()`
- Produces: `POST /api/animate` creates animation record and returns `{ request_id }`, `GET /api/animate?request_id=` polls status

- [ ] **Step 1: Write the failing test**

Create `tests/api/animate-route.test.ts`:
```typescript
import { NextRequest } from 'next/server';

function makeRequest(url: string, init?: RequestInit): NextRequest {
  return new NextRequest(url, init);
}

describe('POST /api/animate', () => {
  it('returns 400 without source_url', async () => {
    const req = makeRequest('http://localhost/api/animate', { method: 'POST', body: JSON.stringify({}) });
    const res = await (await import('@/app/api/animate/route')).POST(req);
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/api/animate-route.test.ts`
Expected: FAIL because route does not exist.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/animate.ts`:
```typescript
import { getSupabaseAdmin } from '@/src/lib/supabaseServer'
import muapi from '@/lib/muapi'

export async function createAnimation(sourceUrl: string, brandId?: string, resolution: string = '720p', duration: number = 5): Promise<any> {
  const supabase = getSupabaseAdmin()

  const prediction = await muapi.post('/seedance-lite-i2v', {
    image_url: sourceUrl,
    resolution,
    duration,
  })

  const requestId = prediction.request_id || prediction.id
  if (!requestId) throw new Error('MuAPI did not return a request_id')

  const { data: animation, error } = await supabase
    .from('brand_animations')
    .insert({
      brand_id: brandId || null,
      source_url: sourceUrl,
      resolution,
      duration,
    })
    .select('*')
    .single()

  if (error) throw error
  return { ...animation, request_id: requestId }
}

export async function pollAnimation(requestId: string): Promise<any> {
  const supabase = getSupabaseAdmin()

  const result = await muapi.get(`/predictions/${encodeURIComponent(requestId)}/result`)
  const status = result.status === 'completed' || result.status === 'succeeded' || result.status === 'success' ? 'completed' :
                 result.status === 'failed' || result.status === 'error' ? 'failed' : 'pending'

  if (status === 'completed') {
    const videoUrl = result.outputs?.[0] || result.url || result.output?.url || ''
    await supabase
      .from('brand_animations')
      .update({ video_url: videoUrl, updated_at: new Date().toISOString() })
      .eq('id', requestId)
  }

  return { status, video_url: status === 'completed' ? (result.outputs?.[0] || result.url || result.output?.url || '') : '' }
}
```

Create `app/api/animate/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/src/lib/supabaseServer'
import { createAnimation, pollAnimation } from '@/lib/animate'
import { ok, apiError } from '@/lib/apiError'

export async function POST(req: NextRequest) {
  const { userId } = await (await import('@clerk/nextjs/server')).auth()
  if (!userId) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })

  let body: any = {}
  try { body = await req.json() } catch {}
  const { source_url, brand_id, resolution, duration } = body

  if (!source_url) {
    return apiError('bad_request', 'source_url is required', 400)
  }

  try {
    const animation = await createAnimation(source_url, brand_id, resolution, duration)
    return ok({ request_id: animation.request_id, id: animation.id })
  } catch (err: any) {
    return apiError('generation_failed', err.message || 'Animation failed', 500)
  }
}

export async function GET(req: NextRequest) {
  const { userId } = await (await import('@clerk/nextjs/server')).auth()
  if (!userId) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const requestId = searchParams.get('requestId')
  const brandId = searchParams.get('brand_id')

  if (requestId) {
    try {
      const result = await pollAnimation(requestId)
      return ok(result)
    } catch (err: any) {
      return apiError('poll_failed', err.message || 'Polling failed', 502)
    }
  }

  const supabase = getSupabaseAdmin()
  let query = supabase.from('brand_animations').select('*').order('created_at', { ascending: false })

  if (brandId) query = query.eq('brand_id', brandId)

  const { data: animations, error } = await query
  if (error) return apiError('server_error', error.message, 500)

  return ok(animations || [])
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/api/animate-route.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/api/animate/route.ts src/lib/animate.ts tests/api/animate-route.test.ts
git commit -m "feat: add animate API"
```

---

### Task 6: Create editable Brand DNA page

**Files:**
- Create: `app/brand/[id]/page.tsx`

**Interfaces:**
- Consumes: `GET /api/brand?id=`, `PATCH /api/brand?id=`, `GET /api/campaigns?brand_id=`, `useSmartVideoAccess`
- Produces: Editable brand profile with chips, color pickers, and campaign list

- [ ] **Step 1: Write the page**

Create `app/brand/[id]/page.tsx`:
```typescript
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Save, Loader2, ChevronRight, Palette, MessageSquare, Users, Target } from 'lucide-react'
import { panels, buttons, semantic, appWrapper, optionStyle } from '@/shared/styles/designTokens'

type Brand = {
  id: string
  url: string
  brand_name: string
  industry: string
  tagline: string
  value_proposition: string
  tone_of_voice: string
  brand_personality: string
  target_audience: string
  key_messages: string
  primary_colors: string
  secondary_colors: string
  fonts: string
  imagery_style: string
  layout_style: string
  logo_url: string
  screenshot_url: string
}

type Campaign = {
  id: string
  goal: string
  concepts: any[]
  created_at: string
}

const GOALS = {
  product_launch: 'Product Launch',
  lead_generation: 'Lead Generation',
  brand_awareness: 'Brand Awareness',
  engagement: 'Engagement',
  thought_leadership: 'Thought Leadership',
  sales: 'Direct Sales',
}

export default function BrandPage() {
  const params = useParams()
  const router = useRouter()
  const [brand, setBrand] = useState<Brand | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!params.id) return
    setLoading(true)
    fetch(`/api/brand?id=${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) return
        setBrand(data)
        return fetch(`/api/campaigns?brand_id=${params.id}`).then((r) => r.json()).then((c) => setCampaigns(c.items || c))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [params.id])

  const save = async () => {
    if (!brand) return
    setSaving(true)
    await fetch(`/api/brand?id=${brand.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(brand),
    })
    setSaving(false)
    alert('Saved')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ ...appWrapper, color: semantic.textSecondary }}>
        <Loader2 size={24} className="animate-spin" />
      </div>
    )
  }

  if (!brand) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={appWrapper}>
        <p style={{ color: semantic.textSecondary }}>Brand not found</p>
      </div>
    )
  }

  const update = (field: keyof Brand, value: string) => setBrand({ ...brand, [field]: value })

  return (
    <div className="min-h-screen" style={appWrapper}>
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold">{brand.brand_name || 'Untitled Brand'}</h1>
            <p className="text-sm mt-1" style={{ color: semantic.textSecondary }}>{brand.url}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => router.push(`/brand/${brand.id}/campaigns/new`)} className="px-4 py-2 rounded-lg text-sm font-semibold" style={buttons.primary}>
              New Campaign
            </button>
            <button onClick={save} disabled={saving} className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50" style={buttons.ghost}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="rounded-xl p-5" style={panels.glass}>
              <h2 className="text-sm font-bold uppercase tracking-wide mb-3" style={{ color: semantic.textLabel }}>Identity</h2>
              <div className="space-y-3">
                <input value={brand.brand_name} onChange={(e) => update('brand_name', e.target.value)} className="w-full rounded-lg px-3 py-2 outline-none" style={panels.card} placeholder="Brand name" />
                <input value={brand.industry} onChange={(e) => update('industry', e.target.value)} className="w-full rounded-lg px-3 py-2 outline-none" style={panels.card} placeholder="Industry" />
                <input value={brand.tagline} onChange={(e) => update('tagline', e.target.value)} className="w-full rounded-lg px-3 py-2 outline-none" style={panels.card} placeholder="Tagline" />
                <textarea value={brand.value_proposition} onChange={(e) => update('value_proposition', e.target.value)} rows={3} className="w-full rounded-lg px-3 py-2 outline-none" style={panels.card} placeholder="Value proposition" />
              </div>
            </div>

            <div className="rounded-xl p-5" style={panels.glass}>
              <h2 className="text-sm font-bold uppercase tracking-wide mb-3" style={{ color: semantic.textLabel }}>Audience</h2>
              <textarea value={brand.target_audience} onChange={(e) => update('target_audience', e.target.value)} rows={3} className="w-full rounded-lg px-3 py-2 outline-none" style={panels.card} placeholder="Target audience" />
            </div>

            <div className="rounded-xl p-5" style={panels.glass}>
              <h2 className="text-sm font-bold uppercase tracking-wide mb-3" style={{ color: semantic.textLabel }}>Colors</h2>
              <div className="flex items-center gap-3">
                <input type="color" value={brand.primary_colors.split(',')[0] || '#000000'} onChange={(e) => update('primary_colors', e.target.value)} className="h-10 w-14 rounded border-0 bg-transparent p-1 cursor-pointer" />
                <input value={brand.primary_colors} onChange={(e) => update('primary_colors', e.target.value)} className="flex-1 rounded px-2 py-1 text-xs font-mono outline-none" style={panels.card} />
              </div>
              <div className="flex items-center gap-3 mt-2">
                <input type="color" value={brand.secondary_colors.split(',')[0] || '#ffffff'} onChange={(e) => update('secondary_colors', e.target.value)} className="h-10 w-14 rounded border-0 bg-transparent p-1 cursor-pointer" />
                <input value={brand.secondary_colors} onChange={(e) => update('secondary_colors', e.target.value)} className="flex-1 rounded px-2 py-1 text-xs font-mono outline-none" style={panels.card} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl p-5" style={panels.glass}>
              <h2 className="text-sm font-bold uppercase tracking-wide mb-3" style={{ color: semantic.textLabel }}>Tone & Personality</h2>
              <div className="flex flex-wrap gap-2 mb-3">
                {brand.tone_of_voice.split(',').filter(Boolean).map((t) => (
                  <span key={t} className="px-2 py-1 rounded-full text-xs font-medium" style={buttons.activePill}>{t.trim()}</span>
                ))}
              </div>
              <input value={brand.tone_of_voice} onChange={(e) => update('tone_of_voice', e.target.value)} className="w-full rounded-lg px-3 py-2 outline-none mb-2" style={panels.card} placeholder="Comma-separated tone keywords" />
              <input value={brand.brand_personality} onChange={(e) => update('brand_personality', e.target.value)} className="w-full rounded-lg px-3 py-2 outline-none" style={panels.card} placeholder="Comma-separated personality traits" />
            </div>

            <div className="rounded-xl p-5" style={panels.glass}>
              <h2 className="text-sm font-bold uppercase tracking-wide mb-3" style={{ color: semantic.textLabel }}>Key Messages</h2>
              <textarea value={brand.key_messages} onChange={(e) => update('key_messages', e.target.value)} rows={4} className="w-full rounded-lg px-3 py-2 outline-none" style={panels.card} placeholder="Comma-separated key messages" />
            </div>

            <div className="rounded-xl p-5" style={panels.glass}>
              <h2 className="text-sm font-bold uppercase tracking-wide mb-3" style={{ color: semantic.textLabel }}>Past Campaigns</h2>
              {campaigns.length === 0 ? (
                <p className="text-sm" style={{ color: semantic.textMuted }}>No campaigns yet.</p>
              ) : (
                <div className="space-y-2">
                  {campaigns.map((c) => (
                    <button key={c.id} onClick={() => router.push(`/campaign/${c.id}`)} className="w-full text-left rounded-lg p-3 transition hover:opacity-80 flex items-center justify-between" style={panels.card}>
                      <div>
                        <p className="font-semibold text-sm">{GOALS[c.goal as keyof typeof GOALS] || c.goal}</p>
                        <p className="text-xs" style={{ color: semantic.textSecondary }}>{c.concepts?.length || 0} concepts</p>
                      </div>
                      <ChevronRight size={16} style={{ color: semantic.textMuted }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Manual verification**

Run: `npm run dev`
Navigate to `/brand/[id]` after creating a brand. Verify:
- Brand fields are editable
- Color pickers work
- Chips render for tone/personality
- Campaigns list loads
- Save persists changes

- [ ] **Step 5: Commit**

```bash
git add app/brand/[id]/page.tsx
git commit -m "feat: add editable Brand DNA page"
```

---

### Task 7: Create campaign creation page

**Files:**
- Create: `app/brand/[id]/campaigns/new/page.tsx`

**Interfaces:**
- Consumes: `POST /api/campaigns`, `useSmartVideoAccess`
- Produces: Goal picker + direction input → redirects to `/campaign/[id]`

- [ ] **Step 1: Write the page**

Create `app/brand/[id]/campaigns/new/page.tsx`:
```typescript
'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, ArrowRight } from 'lucide-react'
import { panels, buttons, semantic, appWrapper } from '@/shared/styles/designTokens'
import { useSmartVideoAccess, ENTITLEMENTS } from '@/access/SmartVideoAccessProvider'

const GOALS = [
  { id: 'product_launch', label: 'Product Launch' },
  { id: 'lead_generation', label: 'Lead Generation' },
  { id: 'brand_awareness', label: 'Brand Awareness' },
  { id: 'engagement', label: 'Engagement' },
  { id: 'thought_leadership', label: 'Thought Leadership' },
  { id: 'sales', label: 'Direct Sales' },
]

export default function NewCampaignPage() {
  const params = useParams()
  const router = useRouter()
  const { requireEntitlement } = useSmartVideoAccess()
  const [goal, setGoal] = useState('')
  const [direction, setDirection] = useState('')
  const [loading, setLoading] = useState(false)

  const create = async () => {
    if (!goal) return
    requireEntitlement(
      ENTITLEMENTS.SMARTVIDEO_GO,
      async () => {
        setLoading(true)
        try {
          const res = await fetch('/api/campaigns', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ brand_id: params.id, goal, direction }),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || 'Failed to create campaign')
          router.push(`/campaign/${data.id}`)
        } catch (err: any) {
          alert(err.message)
        } finally {
          setLoading(false)
        }
      },
      () => alert('Payment required to create campaigns')
    )
  }

  return (
    <div className="min-h-screen" style={appWrapper}>
      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-semibold mb-2">New Campaign</h1>
        <p className="text-sm mb-8" style={{ color: semantic.textSecondary }}>Pick a goal and we will generate 4 on-brand concepts.</p>

        <div className="rounded-xl p-6 mb-6" style={panels.glass}>
          <label className="block text-xs font-bold uppercase tracking-wide mb-2" style={{ color: semantic.textLabel }}>Goal</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
            {GOALS.map((g) => (
              <button key={g.id} onClick={() => setGoal(g.id)} className="px-3 py-2 rounded-lg text-sm font-medium transition" style={optionStyle(goal === g.id)}>
                {g.label}
              </button>
            ))}
          </div>

          <label className="block text-xs font-bold uppercase tracking-wide mb-2" style={{ color: semantic.textLabel }}>Direction (optional)</label>
          <textarea value={direction} onChange={(e) => setDirection(e.target.value)} rows={3} className="w-full rounded-lg px-3 py-2 outline-none mb-4" style={panels.card} placeholder="Any specific angle, theme, or constraint..." />

          <button onClick={create} disabled={loading || !goal} className="w-full px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50" style={buttons.primary}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
            Generate Concepts
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Manual verification**

Run: `npm run dev`
Navigate to `/brand/[id]/campaigns/new`. Verify:
- Goal selector works
- Direction input works
- Create button triggers API and redirects to `/campaign/[id]`

- [ ] **Step 3: Commit**

```bash
git add app/brand/[id]/campaigns/new/page.tsx
git commit -m "feat: add campaign creation page"
```

---

### Task 8: Fix campaign detail page to use real APIs

**Files:**
- Modify: `app/campaign/[id]/page.tsx`

**Interfaces:**
- Consumes: `GET /api/campaigns`, `GET /api/brand?id=`, `POST /api/assets`
- Produces: Working campaign detail with real asset generation

- [ ] **Step 1: Update campaign page**

Modify `app/campaign/[id]/page.tsx` to replace broken placeholder generation with real API calls. Ensure `generateAssets` calls `/api/assets` with `campaign_id`, `platform`, and `concept_index`. Ensure campaign/concept loading uses `/api/campaigns` and `/api/brand`.

- [ ] **Step 2: Manual verification**

Run: `npm run dev`
Create a campaign, navigate to `/campaign/[id]`, select platforms, click Generate. Verify assets appear with images and copy.

- [ ] **Step 3: Commit**

```bash
git add app/campaign/[id]/page.tsx
git commit -m "fix: wire campaign page to real APIs"
```

---

### Task 9: Enhance canvas editor

**Files:**
- Modify: `app/asset/[id]/edit/page.tsx`

**Interfaces:**
- Consumes: `GET /api/assets?id=`, `PATCH /api/assets?id=`
- Produces: Richer editor with image swap, background regeneration, upload, font/alignment controls

- [ ] **Step 1: Enhance editor**

Add to `app/asset/[id]/edit/page.tsx`:
- Image swap: dropdown to select from other assets in same campaign
- Regenerate background: button that calls `/api/assets` with a background-only prompt
- Upload own image: file input that uploads to Supabase storage and updates `image_url`
- Font family: dropdown with web-safe font stack
- Alignment: left/center/right buttons that update `canvas_data.alignment`

- [ ] **Step 2: Manual verification**

Run: `npm run dev`
Open an asset in `/asset/[id]/edit`. Verify new controls work and save persists.

- [ ] **Step 3: Commit**

```bash
git add app/asset/[id]/edit/page.tsx
git commit -m "feat: enhance canvas editor controls"
```

---

## Execution

Plan complete. Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — I execute tasks in this session using executing-plans, batch execution with checkpoints.

**Which approach?**
