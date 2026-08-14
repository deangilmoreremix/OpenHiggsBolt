import { NextRequest, NextResponse } from 'next/server'
import { brands, type Brand } from '@/shared/brandStore'
import { apiError } from '@/lib/apiError'

export async function GET(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return apiError('bad_request', 'id required', 400)
  const brand = brands.get(id)
  if (!brand) return apiError('not_found', 'Brand not found', 404)
  return NextResponse.json(brand)
}

export async function PATCH(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return apiError('bad_request', 'id required', 400)
  const brand = brands.get(id)
  if (!brand) return apiError('not_found', 'Brand not found', 404)

  let body: Partial<Brand> = {}
  try { body = await req.json() } catch {}
  const { id: _i, url: _u, created_at: _c, ...rest } = body
  const updated: Brand = { ...brand, ...rest, id, url: brand.url, created_at: brand.created_at }
  brands.set(id, updated)
  return NextResponse.json(updated)
}
