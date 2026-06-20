import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/shared/api/supabase'

export const maxDuration = 60

const OPENAI_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY || ''

export async function POST(req: NextRequest) {
  try {
    const { url, title, description, bodyText, colors, fonts, logos, ogImage } = await req.json()

    // Use OpenAI Responses API to analyze brand
    const prompt = `You are a brand strategist. Analyze this website data and extract brand DNA.

Website: ${url}
Title: ${title}
Description: ${description}
Body text excerpt: ${bodyText?.slice(0, 1500)}
Colors found: ${colors?.join(', ')}
Fonts found: ${fonts?.join(', ')}

Return ONLY valid JSON with this exact structure:
{
  "name": "Brand name",
  "tagline": "Brand tagline or slogan",
  "description": "2-3 sentence brand description",
  "tone": ["professional", "innovative", "friendly"],
  "personality": ["bold", "trustworthy", "creative"],
  "messages": ["key message 1", "key message 2", "key message 3"],
  "primary_color": "#hexcolor from the site",
  "secondary_color": "#hexcolor from the site",
  "accent_color": "#hexcolor from the site"
}`

    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o',
        input: prompt,
        max_output_tokens: 800,
      }),
    })

    const data = await res.json()
    const text = data.output?.[0]?.content?.[0]?.text || '{}'
    const clean = text.replace(/```json\n?|\n?```/g, '').trim()
    
    let brandData: any = {}
    try { brandData = JSON.parse(clean) } catch { brandData = { name: title, description } }

    // Save to Supabase
    const { data: brand, error } = await supabase
      .from('brand_dna')
      .insert({
        url,
        name: brandData.name || title,
        tagline: brandData.tagline || '',
        description: brandData.description || description,
        tone: brandData.tone || [],
        personality: brandData.personality || [],
        messages: brandData.messages || [],
        primary_color: brandData.primary_color || colors?.[0] || '#000000',
        secondary_color: brandData.secondary_color || colors?.[1] || '#ffffff',
        accent_color: brandData.accent_color || colors?.[2] || '#0066cc',
        fonts: fonts || [],
        logo_url: logos?.[0] || ogImage || '',
        raw_colors: colors || [],
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(brand)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
