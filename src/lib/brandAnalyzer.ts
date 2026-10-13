import { scrapeUrl } from './scraper'
import { getSupabaseAdmin } from '@/src/lib/supabaseServer'
import { callOpenAIResponses } from '@/shared/api/openai'

const OPENAI_MODEL = 'gpt-4o'

function toCsv(value: unknown): string {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean).join(', ')
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean).join(', ')
  return ''
}

export async function analyzeBrand(url: string): Promise<any> {
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

  const text = await callOpenAIResponses([
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
  ])

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
