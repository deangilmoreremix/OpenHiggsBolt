import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/shared/api/supabase'

export const maxDuration = 120

const OPENAI_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY || ''

const PHOTO_STYLES: Record<string, Record<string, string>> = {
  'E-commerce': {
    'Studio White':    'pure white seamless background, professional product photography, soft diffused lighting, clean minimal',
    'Marble Clean':    'white marble surface, elegant product placement, soft shadows, luxury minimalist',
    'Dark Moody':      'dark background, dramatic side lighting, moody atmosphere, premium product shot',
    'Gradient Pop':    'colorful gradient background, vibrant, eye-catching product photography',
    'Flat Lay':        'overhead flat lay, product arranged artfully on neutral surface, lifestyle elements',
  },
  'Lifestyle': {
    'Urban Street':    'urban street scene, natural daylight, lifestyle product photography, authentic feel',
    'Golden Hour':     'golden hour sunlight, warm tones, lifestyle photography, natural outdoor setting',
    'Cozy Interior':   'warm cozy interior, natural light from window, lifestyle home setting',
    'Scandi Living':   'scandinavian minimal interior, white walls, natural wood, clean lifestyle shot',
    'Café Scene':      'coffee shop background, warm ambiance, lifestyle product placement, blurred bokeh',
  },
  'Food & Beverage': {
    'Restaurant Plated': 'restaurant fine dining, professional food photography, perfect plating, dramatic lighting',
    'Rustic Table':      'rustic wooden table, natural ingredients, overhead food photography, warm tones',
    'Bright & Fresh':    'bright white background, fresh ingredients, clean food photography, natural light',
    'Dark Kitchen':      'dark moody kitchen, dramatic lighting, premium food photography, restaurant quality',
    'Flat Lay Food':     'overhead flat lay food photography, colorful ingredients, styled composition',
  },
  'Tech & Electronics': {
    'Dark Techy':      'dark background, blue accent lighting, tech product photography, futuristic feel',
    'Clean Desk':      'minimal clean desk setup, natural light, tech lifestyle photography',
    'Neon Glow':       'neon lighting, dark studio, cyberpunk aesthetic, tech product glowing',
    'Blueprint':       'technical blueprint style, dark blue, engineering aesthetic, precision product shot',
    'Holographic':     'holographic background, iridescent colors, futuristic tech product photography',
  },
  'Beauty & Fashion': {
    'Beauty Flat Lay': 'beauty product flat lay, pink and white tones, makeup photography, elegant',
    'Skin Texture':    'macro product photography, skin texture, beauty close-up, soft lighting',
    'Fashion Editorial': 'fashion editorial photography, dramatic lighting, artistic composition',
    'Pastel Minimal':  'soft pastel background, minimal beauty photography, elegant product placement',
    'Gold Luxury':     'gold and black luxury background, premium beauty photography, glamorous',
  },
  'Health & Wellness': {
    'Nature Organic':  'natural organic setting, green plants, earthy tones, wellness product photography',
    'Spa Minimal':     'spa aesthetic, white marble, eucalyptus, minimal wellness photography',
    'Active Sports':   'active lifestyle, sports setting, energetic product photography, dynamic',
    'Clean Science':   'clinical clean background, scientific aesthetic, health product photography',
    'Sunrise Glow':    'sunrise golden light, outdoor wellness, meditation aesthetic, soft warm tones',
  },
}

export async function POST(req: NextRequest) {
  try {
    const { brandId, category, style, productImageUrl } = await req.json()

    const { data: brand } = await supabase.from('brand_dna').select('*').eq('id', brandId).single()

    const stylePrompt = PHOTO_STYLES[category]?.[style] || 'professional product photography'
    const brandContext = brand ? `Brand: ${brand.name}. Colors: ${brand.primary_color}.` : ''

    // Use gpt-image-2 edit if product image provided, else generate
    let imageUrl: string | null = null

    if (productImageUrl) {
      // Edit mode — use reference image
      const imgRes = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${OPENAI_KEY}` },
        body: (() => {
          const fd = new FormData()
          fd.append('model', 'gpt-image-2')
          fd.append('prompt', `Professional product photography. ${stylePrompt}. ${brandContext} Keep the product exactly as-is, only change the background and lighting.`)
          fd.append('n', '1')
          fd.append('size', '1024x1024')
          return fd
        })(),
      })
      const imgData = await imgRes.json()
      const b64 = imgData.data?.[0]?.b64_json
      imageUrl = b64 ? `data:image/png;base64,${b64}` : null
    } else {
      // Generate mode
      const imgRes = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-image-2',
          prompt: `Professional product photography. ${stylePrompt}. ${brandContext} High quality, commercial photography.`,
          n: 1,
          size: '1024x1024',
          quality: 'high',
        }),
      })
      const imgData = await imgRes.json()
      const b64 = imgData.data?.[0]?.b64_json
      imageUrl = b64 ? `data:image/png;base64,${b64}` : null
    }

    const { data: shoot, error } = await supabase.from('brand_photoshoots').insert({
      brand_id: brandId,
      style,
      category,
      product_url: productImageUrl || null,
      image_url: imageUrl,
    }).select().single()

    if (error) throw error
    return NextResponse.json(shoot)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
