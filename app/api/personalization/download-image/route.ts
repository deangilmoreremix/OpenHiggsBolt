import { NextRequest, NextResponse } from 'next/server'
import { downloadImageAsDataUrl } from '@/server/downloadImage'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const urls = Array.isArray(body?.urls) ? body.urls : []

    if (urls.length === 0) {
      return NextResponse.json({ error: 'urls array is required' }, { status: 400 })
    }

    const results = await Promise.all(
      urls.map(async (url: string) => {
        try {
          const dataUrl = await downloadImageAsDataUrl(url)
          return { url, dataUrl, ok: true }
        } catch (err) {
          return { url, error: err instanceof Error ? err.message : 'Download failed', ok: false }
        }
      }),
    )

    return NextResponse.json({ ok: true, results })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
