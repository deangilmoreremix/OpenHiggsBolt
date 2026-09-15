import { NextResponse } from 'next/server'
import { stat } from 'node:fs/promises'

const DATA_PATH = process.cwd() + '/src/data/seedance_prompts.json'
const FEED_JSONL = 'https://raw.githubusercontent.com/Hanyuyu/visual-prompt-feed/main/data/prompts.jsonl'
const FEED_STATS = 'https://raw.githubusercontent.com/Hanyuyu/visual-prompt-feed/main/stats.json'

export async function GET() {
  const seedanceCheck = await checkSeedanceDataset()
  const feedCheck = await checkFeedSource()

  const allOk = seedanceCheck.status === 'ok' && feedCheck.status === 'ok'
  const status = allOk ? 'ok' : 'degraded'

  return NextResponse.json({
    status,
    promptFeed: feedCheck,
    seedanceDataset: seedanceCheck,
  })
}

async function checkSeedanceDataset() {
  try {
    const stats = await stat(DATA_PATH)
    const size = stats.size

    // Light validation: try parsing the first few bytes as JSON
    // to ensure the file is not corrupt, without loading the whole thing.
    const { open: openFile } = await import('node:fs/promises')
    const fd = await openFile(DATA_PATH, 'r')
    try {
      const buffer = Buffer.alloc(1024)
      await fd.read(buffer, 0, 1024, 0)
      const snippet = buffer.toString('utf-8', 0, Math.min(buffer.length, 1024)).trim()
      if (!snippet.startsWith('[') && !snippet.startsWith('{')) {
        return { status: 'unreachable', error: 'Invalid JSON start', size }
      }
    } finally {
      await fd.close()
    }

    return { status: 'ok', size }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    return { status: 'unreachable', error: message, size: 0 }
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
      return { status: 'ok', jsonl: jsonlOk.status, stats: statsOk.status }
    }
    return { status: 'unreachable', jsonl: jsonlOk.status, stats: statsOk.status }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    return { status: 'unreachable', error: message }
  }
}
