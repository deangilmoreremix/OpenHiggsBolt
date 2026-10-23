import { getSupabaseAdmin } from '@/src/lib/supabaseServer'
import { getOpenAiKeyForUser } from '@/src/lib/openaiKeyServer'
import { callOpenAIResponses } from '@/shared/api/openai'

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

  const openaiKey = await getOpenAiKeyForUser()
  const text = await callOpenAIResponses([
    { role: 'user', content: prompt },
  ], openaiKey || undefined)

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
