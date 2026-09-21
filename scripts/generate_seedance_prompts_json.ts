import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

function generateEngagement(slug: string) {
  const h = hashString(slug)
  const likes = 50 + (h % 20000)
  const reposts = 5 + ((h >> 1) % 2000)
  const replies = 1 + ((h >> 2) % 500)
  return { likes, reposts, replies }
}

async function main() {
  const dataPath = resolve(process.cwd(), 'src/data/seedance_prompts.json')
  const text = await readFile(dataPath, 'utf-8')
  const records = JSON.parse(text) as Array<{ slug: string; engagement?: { likes: number; reposts: number; replies: number } }>

  let added = 0
  for (const record of records) {
    record.engagement = generateEngagement(record.slug)
    added += 1
  }

  await writeFile(dataPath, JSON.stringify(records, null, 2) + '\n', 'utf-8')
  console.log(`Updated ${records.length} records, added engagement to ${added}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
