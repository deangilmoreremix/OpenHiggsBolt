/**
 * Inventory scanner for OpenHiggsBolt template audit - v2
 * Produces a structured JSON summary of all templates.
 */
import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'src', 'data')

interface TemplateRecord {
  id: number
  slug: string
  title: string
  category: string
  rawCategory: string
  useCase: string
  duration?: number
  aspectRatio?: string
  videoSrc: string
  posterSrc: string
  prompt: string
  studioTab: string
  tags: string[]
  sourceUrl?: string
  sourceRepo: string
  model?: string
  modelName?: string
  featured?: boolean
  hero?: boolean
  interactive?: boolean
  language: 'ENGLISH' | 'MIXED' | 'NON_ENGLISH' | 'UNKNOWN'
  languageConfidence: number
  shortDescription?: string
  displayTitle?: string
}

// Common English words for detection
const ENGLISH_WORDS = new Set([
  'the','a','an','is','are','was','were','be','been','being','have','has','had','do','does','did',
  'will','would','could','should','can','may','might','must','shall','need','dare','ought','used',
  'create','video','scene','camera','shot','image','light','color','motion','sound','audio','music',
  'and','with','from','this','that','for','you','your','in','on','at','to','of','it','he','she',
  'they','his','her','their','my','we','us','our','i','me','mine','yours','ours','theirs','hers',
  'but','or','if','then','so','than','more','most','some','any','all','each','every','both','few',
  'many','much','such','only','own','same','other','another','just','also','very','often','however',
  'about','above','after','again','below','beside','between','during','except','inside','outside',
  'through','under','until','upon','within','without','not','no','yes','and','or','but','yet','so',
  'style','shot','cuts','cut','fade','transition','zoom','pan','track','orbit','dolly','crane',
  'close','wide','medium','long','extreme','fast','slow','motion','blur','focus','depth','field',
  'natural','real','realistic','cinematic','commercial','premium','luxury','elegant','modern',
  'young','woman','man','girl','boy','child','adult','beautiful','handsome','professional',
  'standing','walking','running','sitting','looking','turning','moving','talking','smiling',
  'wearing','holding','carrying','opening','closing','entering','leaving','coming','going',
  'red','blue','green','yellow','black','white','pink','purple','orange','gold','silver',
  'dark','light','bright','soft','warm','cold','cool','warm','hot','cool','natural','sunlight',
  'city','street','road','room','house','office','kitchen','bedroom','bathroom','garden','park',
  'car','truck','motorcycle','bike','boat','plane','train','bus','vehicle','driver','rider',
])

function detectLanguage(prompt: string, title: string): { lang: TemplateRecord['language']; confidence: number } {
  const text = `${title} ${prompt}`.toLowerCase()
  const cleanText = text.replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim()
  const words = cleanText.split(' ').filter(w => w.length > 1)
  
  // Count CJK characters
  const cjkMatches = text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []
  const cjkRatio = cjkMatches.length / Math.max(text.length, 1)
  
  // Count English words
  const enWordCount = words.filter(w => ENGLISH_WORDS.has(w)).length
  const uniqueEnWords = new Set(words.filter(w => ENGLISH_WORDS.has(w))).size
  const alphaRatio = (text.match(/[a-z]/g) || []).length / Math.max(text.length, 1)
  
  // Short prompts need lower thresholds
  const isShort = words.length < 20
  
  if (cjkRatio > 0.25) {
    return { lang: 'NON_ENGLISH', confidence: Math.min(85 + cjkRatio * 100, 95) }
  }
  if (cjkRatio > 0.05 && uniqueEnWords < 3) {
    return { lang: 'MIXED', confidence: 60 }
  }
  if (uniqueEnWords >= 2 || (isShort && uniqueEnWords >= 1 && alphaRatio > 0.3)) {
    return { lang: 'ENGLISH', confidence: Math.min(75 + uniqueEnWords * 3, 92) }
  }
  if (alphaRatio > 0.2) {
    return { lang: 'ENGLISH', confidence: 60 }
  }
  return { lang: 'UNKNOWN', confidence: 30 }
}

// Generate a simple short description from prompt
function generateShortDescription(prompt: string, title: string): string {
  const firstSentence = prompt.split(/[.\n]/)[0]?.trim() || ''
  if (firstSentence.length > 120) {
    return firstSentence.substring(0, 117) + '...'
  }
  return firstSentence || title
}

// Generate display title from slug
function slugToTitle(slug: string): string {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

const files = [
  'minimaxH3Demos.ts',
  'seedance25Demos.ts',
  'seedance1Demos.ts',
  'promptFeedDemos.ts',
  'seedance2PromptDemos.ts',
  'seedancePromptsDemos.ts',
]

const allRecords: TemplateRecord[] = []

for (const file of files) {
  const filePath = path.join(DATA_DIR, file)
  if (!fs.existsSync(filePath)) continue
  
  const content = fs.readFileSync(filePath, 'utf-8')
  
  // Extract export name
  const exportMatch = content.match(/export\s+const\s+(\w+_DEMOS)\s*:/)
  const sourceRepo = exportMatch ? exportMatch[1].replace(/_DEMOS$/, '').toLowerCase() : file.replace('Demos.ts', '').toLowerCase()
  
  // Find all record starts - handle both "id": N, and id: N,
  const idMatches = Array.from(content.matchAll(/(?:^|\n)\s*(?:"id"\s*:\s*(\d+),|id\s*:\s*(\d+),)/g))
  
  for (let i = 0; i < idMatches.length; i++) {
    const match = idMatches[i]
    const startIdx = match.index! + match[0].indexOf('id')
    const nextStart = i + 1 < idMatches.length ? idMatches[i + 1].index! : content.length
    const recordText = content.slice(startIdx, nextStart)
    
    try {
      const id = parseInt(match[1] || match[2])
      
      // Extract slug (handle both "slug": and slug:)
      const slugMatch = recordText.match(/(?:"slug"|slug)\s*:\s*"([^"]+)"/)
      const slug = slugMatch ? slugMatch[1] : `unknown-${id}`
      
      // Extract title (handle both "title": and title:)
      const titleMatch = recordText.match(/(?:"title"|title)\s*:\s*"([^"]+)"/)
      const title = titleMatch ? titleMatch[1] : slugToTitle(slug)
      
      // Extract prompt (may be multiline)
      const promptMatch = recordText.match(/(?:"prompt"|prompt)\s*:\s*"([\s\S]*?)(?:"\s*[,}])/)
      const prompt = promptMatch ? promptMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : ''
      
      // Extract videoSrc
      const videoMatch = recordText.match(/(?:"videoSrc"|videoSrc)\s*:\s*"([^"]+)"/)
      const videoSrc = videoMatch ? videoMatch[1] : ''
      
      // Extract posterSrc
      const posterMatch = recordText.match(/(?:"posterSrc"|posterSrc)\s*:\s*"([^"]+)"/)
      const posterSrc = posterMatch ? posterMatch[1] : ''
      
      // Extract studioTab
      const tabMatch = recordText.match(/(?:"studioTab"|studioTab)\s*:\s*"([^"]+)"/)
      const studioTab = tabMatch ? tabMatch[1] : 'video'
      
      // Extract category
      const catMatch = recordText.match(/(?:"category"|category)\s*:\s*"([^"]+)"/)
      const category = catMatch ? catMatch[1] : 'Social'
      
      // Extract rawCategory
      const rawCatMatch = recordText.match(/(?:"rawCategory"|rawCategory)\s*:\s*"([^"]+)"/)
      const rawCategory = rawCatMatch ? rawCatMatch[1] : ''
      
      // Extract useCase
      const useCaseMatch = recordText.match(/(?:"useCase"|useCase)\s*:\s*"([^"]+)"/)
      const useCase = useCaseMatch ? useCaseMatch[1] : ''
      
      // Extract tags
      const tagsMatch = recordText.match(/(?:"tags"|tags)\s*:\s*\[([\s\S]*?)\]/)
      let tags: string[] = []
      if (tagsMatch) {
        tags = tagsMatch[1].match(/"([^"]+)"/g)?.map(t => t.replace(/"/g, '')) || []
      }
      
      // Extract sourceUrl
      const sourceUrlMatch = recordText.match(/(?:"sourceUrl"|sourceUrl)\s*:\s*"([^"]+)"/)
      const sourceUrl = sourceUrlMatch ? sourceUrlMatch[1] : undefined
      
      // Extract model
      const modelMatch = recordText.match(/(?:"model"|model)\s*:\s*"([^"]+)"/)
      const model = modelMatch ? modelMatch[1] : undefined
      
      // Extract modelName
      const modelNameMatch = recordText.match(/(?:"modelName"|modelName)\s*:\s*"([^"]+)"/)
      const modelName = modelNameMatch ? modelNameMatch[1] : undefined
      
      // Extract duration
      const durationMatch = recordText.match(/(?:"duration"|duration)\s*:\s*(\d+)/)
      const duration = durationMatch ? parseInt(durationMatch[1]) : undefined
      
      // Extract aspectRatio
      const aspectMatch = recordText.match(/(?:"aspectRatio"|aspectRatio)\s*:\s*"([^"]+)"/)
      const aspectRatio = aspectMatch ? aspectMatch[1] : undefined
      
      // Extract featured
      const featuredMatch = recordText.match(/(?:"featured"|featured)\s*:\s*(true|false)/)
      const featured = featuredMatch ? featuredMatch[1] === 'true' : undefined
      
      // Extract hero
      const heroMatch = recordText.match(/(?:"hero"|hero)\s*:\s*(true|false)/)
      const hero = heroMatch ? heroMatch[1] === 'true' : undefined
      
      // Extract interactive
      const interactiveMatch = recordText.match(/(?:"interactive"|interactive)\s*:\s*(true|false)/)
      const interactive = interactiveMatch ? interactiveMatch[1] === 'true' : undefined
      
      const langResult = detectLanguage(prompt, title)
      const shortDesc = generateShortDescription(prompt, title)
      
      allRecords.push({
        id,
        slug,
        title,
        category,
        rawCategory,
        useCase,
        duration,
        aspectRatio,
        videoSrc,
        posterSrc,
        prompt,
        studioTab,
        tags,
        sourceUrl,
        sourceRepo,
        model,
        modelName,
        featured,
        hero,
        interactive,
        language: langResult.lang,
        languageConfidence: langResult.confidence,
        shortDescription: shortDesc,
        displayTitle: slugToTitle(slug),
      })
    } catch (e) {
      // Skip malformed records
    }
  }
}

console.log(`Total records scanned: ${allRecords.length}`)

// Language breakdown
const byLang = allRecords.reduce((acc, r) => {
  acc[r.language] = (acc[r.language] || 0) + 1
  return acc
}, {} as Record<string, number>)
console.log('Language breakdown:', byLang)

// By source repo
const byRepo = allRecords.reduce((acc, r) => {
  acc[r.sourceRepo] = (acc[r.sourceRepo] || 0) + 1
  return acc
}, {} as Record<string, number>)
console.log('By source repo:', byRepo)

// By studio tab
const byTab = allRecords.reduce((acc, r) => {
  acc[r.studioTab] = (acc[r.studioTab] || 0) + 1
  return acc
}, {} as Record<string, number>)
console.log('By studio tab:', byTab)

// By category
const byCat = allRecords.reduce((acc, r) => {
  acc[r.category] = (acc[r.category] || 0) + 1
  return acc
}, {} as Record<string, number>)
console.log('By category:', byCat)

// Non-English details
const nonEnglish = allRecords.filter(r => r.language !== 'ENGLISH')
console.log(`\nNon-English records: ${nonEnglish.length}`)
const nonEnglishByRepo = nonEnglish.reduce((acc, r) => {
  acc[r.sourceRepo] = (acc[r.sourceRepo] || 0) + 1
  return acc
}, {} as Record<string, number>)
console.log('Non-English by repo:', nonEnglishByRepo)

// Save full inventory
const outputPath = path.join(process.cwd(), 'data', 'canonical-template-audit.json')
fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, JSON.stringify({
  generatedAt: new Date().toISOString(),
  totalRecords: allRecords.length,
  languageBreakdown: byLang,
  bySourceRepo: byRepo,
  byStudioTab: byTab,
  byCategory: byCat,
  nonEnglishCount: nonEnglish.length,
  records: allRecords,
}, null, 2))

console.log(`\nSaved to ${outputPath}`)

// Sample non-English records
if (nonEnglish.length > 0) {
  console.log('\nSample non-English records:')
  nonEnglish.slice(0, 5).forEach(r => {
    console.log(`  [${r.sourceRepo}] ${r.id}: ${r.title} - ${r.language} (${r.languageConfidence}%)`)
    console.log(`    Prompt preview: ${r.prompt.substring(0, 100)}...`)
  })
}
