import { NextRequest, NextResponse } from 'next/server'
import { brands, type Brand } from '@/shared/brandStore'

// GET    /api/brand?id=...   -> full brand record
// PATCH  /api/brand?id=...   -> update editable fields
export async function GET(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const brand = brands.get(id)
  if (!brand) return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
  return NextResponse.json(brand)
}

export async function PATCH(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const brand = brands.get(id)
  if (!brand) return NextResponse.json({ error: 'Brand not found' }, { status: 404 })

  let body: Partial<Brand> = {}
  try { body = await req.json() } catch {}
  // Never allow overwriting identity/url via PATCH.
  const { id: _i, url: _u, created_at: _c, ...rest } = body
  const updated: Brand = { ...brand, ...rest, id, url: brand.url, created_at: brand.created_at }
  brands.set(id, updated)
  return NextResponse.json(updated)
}
