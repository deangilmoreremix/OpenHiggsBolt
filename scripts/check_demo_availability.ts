import { SEEDANCE_2PROMPT_DEMOS } from '../src/data/seedance2PromptDemos'
import { SEEDANCE_25_DEMOS } from '../src/data/seedance25Demos'
import { SEEDANCE_1_DEMOS } from '../src/data/seedance1Demos'
import { PROMPTFEED_DEMOS } from '../src/data/promptFeedDemos'
import { MINIMAX_H3_DEMOS } from '../src/data/minimaxH3Demos'

type VideoDemo = {
  id: number
  slug: string
  title: string
  videoSrc?: string
  posterSrc?: string
  prompt?: string
  sourceRepo: string
  mediaType?: string
}

const datasets: Record<string, { demos: VideoDemo[]; mediaType?: string }> = {
  seedance2Prompt: { demos: SEEDANCE_2PROMPT_DEMOS as unknown as VideoDemo[], mediaType: 'video' },
  seedance25: { demos: SEEDANCE_25_DEMOS as unknown as VideoDemo[], mediaType: 'video' },
  seedance1: { demos: SEEDANCE_1_DEMOS as unknown as VideoDemo[], mediaType: 'video' },
  promptFeed: { demos: PROMPTFEED_DEMOS as unknown as VideoDemo[], mediaType: 'video' },
  minimaxH3: { demos: MINIMAX_H3_DEMOS as unknown as VideoDemo[], mediaType: 'video' },
}

let total = 0
let missingVideo = 0
let missingPrompt = 0
let missingBoth = 0
const issues: string[] = []

for (const [name, { demos, mediaType }] of Object.entries(datasets)) {
  for (const d of demos) {
    total++
    const hasVideo = !!d.videoSrc && d.videoSrc.trim() !== ''
    const hasPrompt = !!d.prompt && d.prompt.trim() !== ''
    
    if (!hasVideo) {
      missingVideo++
      issues.push(`${name}:${d.id} ${d.slug} - missing videoSrc`)
    }
    if (!hasPrompt) {
      missingPrompt++
      issues.push(`${name}:${d.id} ${d.slug} - missing prompt`)
    }
    if (!hasVideo && !hasPrompt) {
      missingBoth++
    }
  }
}

console.log(`\n=== Demo Video Availability Report ===\n`)
console.log(`Total demo videos: ${total}`)
console.log(`Missing videoSrc: ${missingVideo}`)
console.log(`Missing prompt: ${missingPrompt}`)
console.log(`Missing both video + prompt: ${missingBoth}`)
console.log(`\nDetailed issues:`)
issues.forEach(i => console.log(`  - ${i}`))
