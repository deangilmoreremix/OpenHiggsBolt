import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { brands, getBrandForUser, type Brand } from '@/shared/brandStore'
import { apiError } from '@/lib/apiError'
import { requireApiEntitlement, entitlementForbiddenResponse } from '@/access/apiRequireEntitlement'
import { ENTITLEMENTS } from '@/access/entitlements'

export const dynamic = "force-dynamic";

async function requireUserId(): Promise<{ userId: string } | { response: NextResponse }> {
  // H4: these handlers used to be fully unauthenticated while exposing a
  // module-level store shared by every user.
  const { userId } = await auth()
  if (!userId) {
    return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  return { userId }
}

export async function GET(req: NextRequest) {
  const session = await requireUserId()
  if ('response' in session) return session.response

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return apiError('bad_request', 'id required', 400)
  // Ownership-scoped lookup; a non-owned id is indistinguishable from a
  // missing one and reported as 404.
  const brand = getBrandForUser(id, session.userId)
  if (!brand) return apiError('not_found', 'Brand not found', 404)
  return NextResponse.json(brand)
}

export async function PATCH(req: NextRequest) {
  const session = await requireUserId()
  if ('response' in session) return session.response

  const entitlementCheck = await requireApiEntitlement(ENTITLEMENTS.SMARTVIDEO_GO)
  if (!entitlementCheck.allowed) {
    if (entitlementCheck.status === 401) {
      return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
    }
    return entitlementForbiddenResponse(ENTITLEMENTS.SMARTVIDEO_GO)
  }

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return apiError('bad_request', 'id required', 400)
  const brand = getBrandForUser(id, session.userId)
  if (!brand) return apiError('not_found', 'Brand not found', 404)

  let body: Partial<Brand> = {}
  try { body = await req.json() } catch {}
  // `owner` is never client-settable: a caller must not be able to hand a
  // brand to another user, or to leave it unowned.
  const { id: _i, url: _u, created_at: _c, owner: _o, ...rest } = body
  const updated: Brand = {
    ...brand,
    ...rest,
    id,
    owner: brand.owner,
    url: brand.url,
    created_at: brand.created_at,
  }
  brands.set(id, updated)
  return NextResponse.json(updated)
}
