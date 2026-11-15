import { NextRequest, NextResponse } from 'next/server'
import { ENTITLEMENTS } from '@/access/entitlements'
import { entitlementForbiddenResponse, requireApiEntitlement } from '@/access/apiRequireEntitlement'
import { encryptMuapiKey, decryptMuapiKey } from '@/src/lib/muapiKeyCrypto'
import { getOwnedPage, listContacts, HttpError } from '@/src/lib/landingPages/server/pages.js'
import { checkKey, listGroups, MAX_CONTACTS, ProviderError, pushContacts, validGroupId } from '@/src/lib/landingPages/server/mailerlite.js'
import { deleteKey, getSavedKey, maskKey, plausibleKey, saveKey } from '@/src/lib/landingPages/server/syncSettings.js'
import { personalUrl } from '@/src/lib/landingPages/ids.js'
import { errorResponse, limited, readJson, serviceDb, signedInUser, unauthenticated } from '@/src/lib/landingPages/server/http'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * MailerLite sync for Video Pages (customer's own MailerLite key, stored encrypted server-side).
 *   GET                      → { connected, masked }
 *   PUT    { apiKey }        → verifies the key, stores it encrypted → { connected: true, masked }
 *   DELETE                   → removes the key
 *   POST   { action: 'groups' }                                   → { groups }
 *   POST   { action: 'push', pageId, groupId?, offset? }          → { pushed, failed, rateLimited, retryAfter, next }
 *          sends up to 200 of the page's contacts that have an email, each with their personal link
 */
async function gate() {
  const userId = await signedInUser()
  if (!userId) return { res: unauthenticated() }
  const g = await requireApiEntitlement(ENTITLEMENTS.SMARTVIDEO_GO)
  if (!g.allowed) return { res: g.status === 401 ? unauthenticated() : entitlementForbiddenResponse(g.entitlement) }
  return { userId }
}

const providerResponse = (err: unknown) => {
  if (err instanceof ProviderError && (err.status === 401 || err.status === 403)) return NextResponse.json({ error: 'MailerLite rejected the key. Check it and try again.', code: 'BAD_KEY' }, { status: 409 })
  if (err instanceof ProviderError && err.status === 429) return NextResponse.json({ error: 'MailerLite is rate limiting requests. Wait a minute and try again.', code: 'RATE_LIMITED' }, { status: 429 })
  if (err instanceof ProviderError) return NextResponse.json({ error: err.message, code: 'PROVIDER_ERROR' }, { status: 502 })
  return null
}

export async function GET() {
  const g = await gate()
  if (!g.userId) return g.res
  try {
    const key = await getSavedKey(await serviceDb(), g.userId, decryptMuapiKey)
    return NextResponse.json({ connected: !!key, masked: maskKey(key) }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    return errorResponse(err)
  }
}

export async function PUT(req: NextRequest) {
  const g = await gate()
  if (!g.userId) return g.res
  const blocked = limited(`lp-sync-key:${g.userId}`, { windowMs: 10 * 60_000, max: 10 })
  if (blocked) return blocked
  const body = await readJson(req, 10_000)
  const apiKey = typeof body?.apiKey === 'string' ? body.apiKey.trim() : ''
  if (!plausibleKey(apiKey)) return NextResponse.json({ error: 'That does not look like a MailerLite API token.', code: 'BAD_KEY' }, { status: 400 })
  try {
    await checkKey({ key: apiKey })
    await saveKey(await serviceDb(), g.userId, apiKey, encryptMuapiKey)
    return NextResponse.json({ connected: true, masked: maskKey(apiKey) })
  } catch (err) {
    return providerResponse(err) || errorResponse(err)
  }
}

export async function DELETE() {
  const g = await gate()
  if (!g.userId) return g.res
  try {
    await deleteKey(await serviceDb(), g.userId)
    return NextResponse.json({ connected: false })
  } catch (err) {
    return errorResponse(err)
  }
}

export async function POST(req: NextRequest) {
  const g = await gate()
  if (!g.userId) return g.res
  const blocked = limited(`lp-sync:${g.userId}`, { windowMs: 60_000, max: 20 })
  if (blocked) return blocked
  const body = await readJson(req, 10_000)
  if (!body) return NextResponse.json({ error: 'Send JSON', code: 'BAD_BODY' }, { status: 400 })
  try {
    const db = await serviceDb()
    const key = await getSavedKey(db, g.userId, decryptMuapiKey)
    if (!key) return NextResponse.json({ error: 'Connect your MailerLite account first.', code: 'NO_KEY' }, { status: 409 })
    const ctx = { key }
    if (body.action === 'groups') return NextResponse.json({ groups: await listGroups(ctx) })
    if (body.action === 'push') {
      const pageId = String(body.pageId || '')
      if (!validGroupId(body.groupId)) return NextResponse.json({ error: 'Invalid group', code: 'BAD_GROUP' }, { status: 400 })
      await getOwnedPage(db, g.userId, pageId)
      const withEmail = (await listContacts(db, g.userId, pageId)).filter((c: any) => c.fields?.email)
      const offset = Math.max(0, Math.floor(Number(body.offset) || 0))
      const batch = withEmail.slice(offset, offset + MAX_CONTACTS)
      if (!batch.length) return NextResponse.json({ pushed: 0, failed: [], rateLimited: false, retryAfter: null, next: null, total: withEmail.length })
      const origin = new URL(req.url).origin
      const rows = batch.map((c: any) => ({ email: c.fields.email, firstname: c.fields.firstname || '', lastname: c.fields.lastname || '', company: c.fields.company || '', link: personalUrl(pageId, c.id, origin) }))
      const out = await pushContacts(ctx, rows, body.groupId || null)
      const next = out.rateLimited || offset + MAX_CONTACTS >= withEmail.length ? null : offset + MAX_CONTACTS
      return NextResponse.json({ ...out, next, total: withEmail.length })
    }
    return NextResponse.json({ error: 'Unknown action', code: 'BAD_ACTION' }, { status: 400 })
  } catch (err) {
    if (err instanceof HttpError) return errorResponse(err)
    return providerResponse(err) || errorResponse(err)
  }
}
