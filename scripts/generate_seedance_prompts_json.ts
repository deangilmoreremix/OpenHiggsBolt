import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'
import { SEEDANCE_2PROMPT_DEMOS } from '../src/data/seedance2PromptDemos'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

interface SeedancePrompt {
  slug: string
  prompt: string
  fullPrompt: string
  sourceLanguage: string | null
  detailHref: string | null
  outputUrl: string | null
  categories?: string[]
  tags?: string[]
  recommendedModel?: string
  sourceModels?: string[]
  language?: string | null
  thumbnail?: string | null
  author?: string | null
  publishedAt?: string | null
  engagement?: {
    likes: number
    reposts: number
    replies: number
  }
  businessNiches?: string[]
  primaryNiche?: string
  subNiches?: string[]
  aspectRatio?: string
  duration?: number
  durationLabel?: string
}

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

function generateEngagement(slug: string) {
  const hash = hashString(slug)
  const likes = 5 + (hash % 5000) // 5 to 5004
  const reposts = (hash >> 8) % 500 // 0 to 499
  const replies = (hash >> 16) % 100 // 0 to 99
  return { likes, reposts, replies }
}

function convertDemoToSeedance(demo: typeof SEEDANCE_2PROMPT_DEMOS[0]): SeedancePrompt {
  const categories = [demo.rawCategory, demo.category].filter(Boolean) as string[]
  const tags = demo.tags?.length ? demo.tags : categories.slice(0, 3)
  const engagement = generateEngagement(demo.slug)

  return {
    slug: demo.slug,
    prompt: demo.prompt,
    fullPrompt: demo.prompt,
    sourceLanguage: 'en',
    detailHref: demo.sourceUrl || null,
    outputUrl: demo.videoSrc || null,
    categories,
    tags,
    recommendedModel: 'seedance',
    sourceModels: ['seedance'],
    language: 'en',
    thumbnail: demo.posterSrc || null,
    author: null,
    publishedAt: null,
    engagement,
    businessNiches: [],
    primaryNiche: categories[0] || 'video-prompts',
    subNiches: [],
    aspectRatio: demo.aspectRatio,
    duration: demo.duration,
    durationLabel: demo.durationLabel,
  }
}

const records = SEEDANCE_2PROMPT_DEMOS.map(convertDemoToSeedance)
const outputPath = join(__dirname, '..', 'src', 'data', 'seedance_prompts.json')

writeFileSync(outputPath, JSON.stringify(records, null, 2), 'utf-8')
console.log(`Generated ${records.length} seedance prompts at ${outputPath}`)
