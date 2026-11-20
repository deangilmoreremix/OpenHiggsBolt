import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import PublicPage from './PublicPage'
import { getContactTokens, getPublishedPage } from '@/src/lib/landingPages/server/pages.js'
import { sanitizeConfig, fillTokens } from '@/src/lib/landingPages/templates.js'
import { CONTACT_ID_RE } from '@/src/lib/landingPages/ids.js'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

async function load(slug: string) {
  const { createServerClient } = await import('@/lib/supabase')
  const db = createServerClient()
  const page = await getPublishedPage(db, slug)
  return { db, page }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  try {
    const { page } = await load(slug)
    if (!page) return { title: 'Page not found', robots: { index: false } }
    const cfg = sanitizeConfig(page.config)
    const title = fillTokens(page.title || 'Video', {}) || 'Video'
    const description = String(cfg.subhead || '').slice(0, 200) || undefined
    return {
      title,
      description,
      openGraph: { title, description, type: 'video.other', ...(page.poster_url ? { images: [page.poster_url] } : {}) },
      twitter: { card: page.poster_url ? 'summary_large_image' : 'summary', title, description },
    }
  } catch {
    return { title: 'Video' }
  }
}

/** Public landing page: /p/<slug>. No sign-in. `?c=<contactId>` personalises it from that contact's saved fields. */
export default async function Page({ params, searchParams }: Props) {
  const { slug } = await params
  const sp = await searchParams
  let loaded
  try {
    loaded = await load(slug)
  } catch {
    notFound()
  }
  const { db, page } = loaded
  if (!page) notFound()
  const cfg = sanitizeConfig(page.config)
  if (!cfg.puck) notFound()
  const raw = typeof sp.c === 'string' ? sp.c : ''
  const contactId = CONTACT_ID_RE.test(raw) ? raw : null
  const tokens = contactId ? await getContactTokens(db, page.id, contactId) : {}
  const pub = { id: page.id, title: page.title, video_url: page.video_url, poster_url: page.poster_url ?? null, duration: page.duration ?? null }
  return <PublicPage page={pub} data={cfg.puck} contactId={contactId} tokens={tokens} />
}
