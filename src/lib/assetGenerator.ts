import { getSupabaseAdmin } from '@/src/lib/supabaseServer'
import { callOpenAIResponses } from '@/src/shared/api/openai'
import { getOpenAiKeyForUser } from '@/src/lib/openaiKeyServer'

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

interface Asset {
  id?: string
  campaign_id: string
  brand_id: string
  platform: string
  concept_index: number
  headline: string
  body: string
  cta: string
  image_url: string
  canvas_data: Record<string, any>
  created_at?: string
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

function extractFirstJson(text: string): any {
  const trimmed = text.trim()
  try {
    return JSON.parse(trimmed)
  } catch {
    // not pure JSON, extract first object or array
  }

  const starts = ['{', '[']
  const ends = ['}', ']']

  for (let i = 0; i < trimmed.length; i++) {
    const startIdx = starts.indexOf(trimmed[i])
    if (startIdx === -1) continue

    const open = trimmed[i]
    const close = ends[startIdx]
    let depth = 1
    let j = i + 1
    while (j < trimmed.length && depth > 0) {
      if (trimmed[j] === open) depth++
      else if (trimmed[j] === close) depth--
      j++
    }
    if (depth === 0) {
      try {
        return JSON.parse(trimmed.slice(i, j))
      } catch {
        // continue searching
      }
    }
  }
  return {}
}

export async function generateAsset(campaignId: string, platformId: string, conceptIndex: number): Promise<Asset> {
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

  const openaiKey = await getOpenAiKeyForUser()
  const copyText = await callOpenAIResponses([copyPrompt], openaiKey || undefined)
  const copy = extractFirstJson(copyText)

  const imagePrompt = `${concept.visualTheme || concept.copyAngle || concept.title || 'Brand-aligned marketing visual'}. Brand colors: ${colors}. Use ${fonts} inspired composition. NO text or typography.`

  const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // BYOK: the authenticated user's own key — never a server env key.
      'Authorization': `Bearer ${openaiKey}`,
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

  if (!imageResponse.ok) {
    const errorData = await imageResponse.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(errorData.error || `OpenAI image generation error: ${imageResponse.status}`)
  }

  const imageResult = await imageResponse.json()
  const temporaryImageUrl = imageResult.data?.[0]?.url
  if (!temporaryImageUrl) throw new Error('OpenAI did not return an image URL')

  const imageBlob = await fetch(temporaryImageUrl).then((r) => {
    if (!r.ok) throw new Error(`Failed to fetch generated image: ${r.status}`)
    return r.blob()
  })
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
