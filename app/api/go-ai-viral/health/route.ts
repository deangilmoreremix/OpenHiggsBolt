import { NextResponse } from 'next/server'
import { readFile } from 'node:fs/promises'
import { stat } from 'node:fs/promises'

const DATA_PATH = '/tmp/seedance_prompts.json'
const FEED_JSONL = 'https://raw.githubusercontent.com/Hanyuyu/visual-prompt-feed/main/data/prompts.jsonl'
const FEED_STATS = 'https://raw.githubusercontent.com/Hanyuyu/visual-prompt-feed/main/stats.json'

export async function GET() {
  const seedanceFile = await checkSeedanceFile()
  const feedSource = await checkFeedSource()

  const allOk = seedanceFile.exists && feedSource.status === 'reachable'
  const status = allOk ? 'ok' : 'degraded'

  return NextResponse.json({
    status,
    seedanceFile,
    feedSource,
  })
}

async function checkSeedanceFile() {
  try {
    const stats = await stat(DATA_PATH)
    return { exists: true, size: stats.size }
  } catch {
    return { exists: false, size: 0 }
  }
}

async function checkFeedSource() {
  try {
    const res = await Promise.all([
      fetch(FEED_JSONL, { method: 'HEAD', next: { revalidate: 60 } }),
      fetch(FEED_STATS, { method: 'HEAD', next: { revalidate: 60 } }),
    ])
    const [jsonlOk, statsOk] = res
    if (jsonlOk.ok || statsOk.ok) {
      return { status: 'reachable' }
    }
    return { status: 'unreachable', code: jsonlOk.status || statsOk.status }
  } catch {
    return { status: 'unreachable' }
  }
}
