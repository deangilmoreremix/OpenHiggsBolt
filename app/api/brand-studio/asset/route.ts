import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/shared/api/supabase'

export const maxDuration = 120

const OPENAI_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY || ''

const PLATFORMS: Record<string, { width: number; height: number; label: string; copyLimit: number }> = {
  instagram_feed:  { width: 1080, height: 1080, label: 'Instagram Feed',    copyLimit: 125 },
  instagram_story: { width: 1080, height: 1920, label: 'Instagram Story',   copyLimit: 80  },
  linkedin:        { width: 1200, height: 627,  label: 'LinkedIn Post',     copyLimit: 150 },
  facebook_ad:     { width: 1200, height: 628,  label: 'Facebook Ad',       copyLimit: 125 },
  twitter:         { width: 1600, height: 900,  label: 'X / Twitter',       copyLimit: 100 },
  web_banner:      { width: 1920, height: 600,  label: 'Web Banner',        copyLimit: 60  },
  email_header:    { width: 600,  height: 200,  label: 'Email Header',      copyLimit: 50  },
  youtube_thumb:   { width: 1280, height: 720,  label: 'YouTube Thumbnail', copyLimit: 60  },
}

export async function POST(req: NextRequest) {
  try {
    const { brandId, campaignId, conceptIndex, platform } = await req.json()

    const [{ data: brand }, { data: campaign }] = await Promise.all([
      supabase.from('brand_dna').select('*').eq('id', brandId).single(),
      supabase.from('brand_campaigns').select('*').eq('id', campaignId).single(),
    ])

    if (!brand || !campaign) return NextResponse.json({ error: 'Brand or campaign not found' }, { status: 404 })

    const concept = campaign.concepts?.[conceptIndex] || campaign.concepts?.[0]
    const spec = PLATFORMS[platform] || PLATFORMS.instagram_feed

    // Generate copy
    const copyPrompt = `Write ${spec.label} ad copy for ${brand.name}.
Concept: ${concept?.title} — ${concept?.concept}
Hook: ${concept?.hook}
Brand tone: ${brand.tone?.join(', ')}
Max ${spec.copyLimit} characters for body.
Return JSON: { "headline": "...", "body": "...", "cta": "..." }`

    const copyRes = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o', input: copyPrompt, max_output_tokens: 400 }),
    })
    const copyData = await copyRes.json()
    const copyText = copyData.output?.[0]?.content?.[0]?.text || '{}'
    let copy = { headline: '', body: '', cta: 'Learn More' }
    try { copy = JSON.parse(copyText.replace(/```json\n?|\n?```/g, '').trim()) } catch {}

    // Generate image using OpenAI gpt-image-2
    const imagePrompt = `${spec.label} marketing visual for ${brand.name}. ${concept?.concept}. Brand colors: ${brand.primary_color} and ${brand.secondary_color}. Style: ${brand.personality?.join(', ')}. Professional marketing image, no text overlays.`

    const openaiSize = spec.width === spec.height ? '1024x1024' :
      spec.width > spec.height ? '1792x1024' : '1024x1792'

    const imgRes = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-image-2',
        prompt: imagePrompt,
        n: 1,
        size: openaiSize,
        quality: 'medium',
      }),
    })
    const imgData = await imgRes.json()
    const b64 = imgData.data?.[0]?.b64_json
    const imageUrl = b64 ? `data:image/png;base64,${b64}` : null

    // Save to Supabase
    const { data: asset, error } = await supabase.from('brand_assets').insert({
      brand_id: brandId,
      campaign_id: campaignId,
      platform,
      concept_index: conceptIndex,
      headline: copy.headline,
      body: copy.body,
      cta: copy.cta,
      image_url: imageUrl,
    }).select().single()

    if (error) throw error
    return NextResponse.json(asset)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
