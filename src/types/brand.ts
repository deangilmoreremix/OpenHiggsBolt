export interface CampaignConcept {
  title: string
  concept: string
  hook: string
  angle: string
  platforms: string[]
}

export interface BrandDNA {
  id: string
  url: string
  brand_name: string
  industry: string
  tagline: string
  value_proposition: string
  target_audience: string
  tone_of_voice: string
  brand_personality: string
  key_messages: string
  primary_colors: string
  secondary_colors: string
  imagery_style: string
  layout_style: string
  fonts: string
  logo_url: string
  screenshot_url: string
  raw_json?: any
  created_at?: string
  updated_at?: string
}

export interface BrandCampaign {
  id: string
  brand_id: string
  goal: string
  direction: string
  concepts: CampaignConcept[]
  created_at?: string
}

export interface BrandAsset {
  id: string
  brand_id: string
  campaign_id: string
  platform: string
  concept_index: number
  headline: string
  body: string
  cta: string
  image_url: string
  canvas_data?: any
  created_at?: string
}

export interface BrandPhotoshoot {
  id: string
  brand_id: string
  style: string
  category: string
  product_url: string
  image_url: string
  created_at?: string
}

export interface BrandAnimation {
  id: string
  brand_id: string
  source_url: string
  video_url: string
  resolution: string
  duration: number
  created_at?: string
}

export interface CampaignGoal {
  id: string
  label: string
  icon: string
  description: string
}

export const CAMPAIGN_GOALS: CampaignGoal[] = [
  {
    id: 'product_launch',
    label: 'Product Launch',
    icon: 'Rocket',
    description: 'Create buzz and awareness for a new product or feature release.',
  },
  {
    id: 'lead_generation',
    label: 'Lead Generation',
    icon: 'UserPlus',
    description: 'Capture leads and drive sign-ups with targeted messaging and offers.',
  },
  {
    id: 'brand_awareness',
    label: 'Brand Awareness',
    icon: 'Globe',
    description: 'Expand reach and make your brand memorable to new audiences.',
  },
  {
    id: 'engagement',
    label: 'Engagement',
    icon: 'Heart',
    description: 'Spark conversations, likes, shares, and community interaction.',
  },
  {
    id: 'thought_leadership',
    label: 'Thought Leadership',
    icon: 'Lightbulb',
    description: 'Establish authority and share expert perspectives in your industry.',
  },
  {
    id: 'sales',
    label: 'Sales',
    icon: 'TrendingUp',
    description: 'Drive conversions and revenue with direct-response creative.',
  },
]

export type DalleSize = '1024x1024' | '1792x1024' | '1024x1792'

export interface Platform {
  id: string
  label: string
  width: number
  height: number
  dalleSize: DalleSize
  wordCap: number
}

export const PLATFORMS: Platform[] = [
  {
    id: 'instagram_feed',
    label: 'Instagram Feed',
    width: 1080,
    height: 1080,
    dalleSize: '1024x1024',
    wordCap: 125,
  },
  {
    id: 'instagram_story',
    label: 'Instagram Story',
    width: 1080,
    height: 1920,
    dalleSize: '1024x1792',
    wordCap: 80,
  },
  {
    id: 'linkedin',
    label: 'LinkedIn Post',
    width: 1200,
    height: 627,
    dalleSize: '1792x1024',
    wordCap: 150,
  },
  {
    id: 'facebook_ad',
    label: 'Facebook Ad',
    width: 1200,
    height: 628,
    dalleSize: '1792x1024',
    wordCap: 125,
  },
  {
    id: 'twitter',
    label: 'X / Twitter',
    width: 1600,
    height: 900,
    dalleSize: '1792x1024',
    wordCap: 100,
  },
  {
    id: 'web_banner',
    label: 'Web Banner',
    width: 1920,
    height: 600,
    dalleSize: '1792x1024',
    wordCap: 60,
  },
  {
    id: 'email_header',
    label: 'Email Header',
    width: 600,
    height: 200,
    dalleSize: '1792x1024',
    wordCap: 50,
  },
  {
    id: 'youtube_thumb',
    label: 'YouTube Thumbnail',
    width: 1280,
    height: 720,
    dalleSize: '1792x1024',
    wordCap: 60,
  },
]

export interface PhotoStyle {
  style: string
  prompt: string
}

export interface PhotoCategory {
  category: string
  styles: PhotoStyle[]
}

export const PHOTO_CATEGORIES: PhotoCategory[] = [
  {
    category: 'E-commerce',
    styles: [
      {
        style: 'Studio White',
        prompt:
          'pure white seamless background, professional product photography, soft diffused lighting, clean minimal',
      },
      {
        style: 'Marble Clean',
        prompt:
          'white marble surface, elegant product placement, soft shadows, luxury minimalist',
      },
      {
        style: 'Dark Moody',
        prompt:
          'dark background, dramatic side lighting, moody atmosphere, premium product shot',
      },
      {
        style: 'Gradient Pop',
        prompt:
          'colorful gradient background, vibrant, eye-catching product photography',
      },
      {
        style: 'Flat Lay',
        prompt:
          'overhead flat lay, product arranged artfully on neutral surface, lifestyle elements',
      },
    ],
  },
  {
    category: 'Lifestyle',
    styles: [
      {
        style: 'Urban Street',
        prompt:
          'urban street scene, natural daylight, lifestyle product photography, authentic feel',
      },
      {
        style: 'Golden Hour',
        prompt:
          'golden hour sunlight, warm tones, lifestyle photography, natural outdoor setting',
      },
      {
        style: 'Cozy Interior',
        prompt:
          'warm cozy interior, natural light from window, lifestyle home setting',
      },
      {
        style: 'Scandi Living',
        prompt:
          'scandinavian minimal interior, white walls, natural wood, clean lifestyle shot',
      },
      {
        style: 'Café Scene',
        prompt:
          'coffee shop background, warm ambiance, lifestyle product placement, blurred bokeh',
      },
    ],
  },
  {
    category: 'Food & Beverage',
    styles: [
      {
        style: 'Restaurant Plated',
        prompt:
          'restaurant fine dining, professional food photography, perfect plating, dramatic lighting',
      },
      {
        style: 'Rustic Table',
        prompt:
          'rustic wooden table, natural ingredients, overhead food photography, warm tones',
      },
      {
        style: 'Bright & Fresh',
        prompt:
          'bright white background, fresh ingredients, clean food photography, natural light',
      },
      {
        style: 'Dark Kitchen',
        prompt:
          'dark moody kitchen, dramatic lighting, premium food photography, restaurant quality',
      },
      {
        style: 'Flat Lay Food',
        prompt:
          'overhead flat lay food photography, colorful ingredients, styled composition',
      },
    ],
  },
  {
    category: 'Tech & Electronics',
    styles: [
      {
        style: 'Dark Techy',
        prompt:
          'dark background, blue accent lighting, tech product photography, futuristic feel',
      },
      {
        style: 'Clean Desk',
        prompt:
          'minimal clean desk setup, natural light, tech lifestyle photography',
      },
      {
        style: 'Neon Glow',
        prompt:
          'neon lighting, dark studio, cyberpunk aesthetic, tech product glowing',
      },
      {
        style: 'Blueprint',
        prompt:
          'technical blueprint style, dark blue, engineering aesthetic, precision product shot',
      },
      {
        style: 'Holographic',
        prompt:
          'holographic background, iridescent colors, futuristic tech product photography',
      },
    ],
  },
  {
    category: 'Beauty & Fashion',
    styles: [
      {
        style: 'Beauty Flat Lay',
        prompt:
          'beauty product flat lay, pink and white tones, makeup photography, elegant',
      },
      {
        style: 'Skin Texture',
        prompt:
          'macro product photography, skin texture, beauty close-up, soft lighting',
      },
      {
        style: 'Fashion Editorial',
        prompt:
          'fashion editorial photography, dramatic lighting, artistic composition',
      },
      {
        style: 'Pastel Minimal',
        prompt:
          'soft pastel background, minimal beauty photography, elegant product placement',
      },
      {
        style: 'Gold Luxury',
        prompt:
          'gold and black luxury background, premium beauty photography, glamorous',
      },
    ],
  },
  {
    category: 'Health & Wellness',
    styles: [
      {
        style: 'Nature Organic',
        prompt:
          'natural organic setting, green plants, earthy tones, wellness product photography',
      },
      {
        style: 'Spa Minimal',
        prompt:
          'spa aesthetic, white marble, eucalyptus, minimal wellness photography',
      },
      {
        style: 'Active Sports',
        prompt:
          'active lifestyle, sports setting, energetic product photography, dynamic',
      },
      {
        style: 'Clean Science',
        prompt:
          'clinical clean background, scientific aesthetic, health product photography',
      },
      {
        style: 'Sunrise Glow',
        prompt:
          'sunrise golden light, outdoor wellness, meditation aesthetic, soft warm tones',
      },
    ],
  },
]
