import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/shared/api/supabase'

export const maxDuration = 60

const OPENAI_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY || ''

export async function POST(req: NextRequest) {
  try {
    const { brandId, goal, direction } = await req.json()

    const { data: brand } = await supabase.from('brand_dna').select('*').eq('id', brandId).single()
    if (!brand) return NextResponse.json({ error: 'Brand not found' }, { status: 404 })

    const prompt = `You are a marketing strategist for ${brand.name}.

Brand DNA:
- Description: ${brand.description}
- Tone: ${brand.tone?.join(', ')}
- Personality: ${brand.personality?.join(', ')}
- Key messages: ${brand.messages?.join(', ')}
- Primary color: ${brand.primary_color}

Goal: ${goal}
${direction ? `Direction: ${direction}` : ''}

Generate 4 distinct campaign concepts. Return ONLY valid JSON array:
[
  {
    "title": "Campaign title",
    "concept": "2-3 sentence concept description",
    "hook": "The attention-grabbing hook",
    "angle": "Unique creative angle",
    "platforms": ["instagram", "linkedin"]
  }
]`

    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o', input: prompt, max_output_tokens: 1200 }),
    })

    const data = await res.json()
    const text = data.output?.[0]?.content?.[0]?.text || '[]'
    const clean = text.replace(/```json\n?|\n?```/g, '').trim()
    let concepts = []
    try { concepts = JSON.parse(clean) } catch { concepts = [] }

    const { data: campaign, error } = await supabase
      .from('brand_campaigns')
      .insert({ brand_id: brandId, goal, direction, concepts })
      .select().single()

    if (error) throw error
    return NextResponse.json(campaign)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
