// Brand Studio brand storage behind one async interface.
//   - Supabase (table brand_studio_brands, migration 20261124010000): durable, owner-scoped. Used whenever the service-role env is set.
//   - Memory (the old per-instance Map in brandStore.ts): used in tests and local development without Supabase.
// Every read and write is keyed by the owning Clerk user id, so a caller can only see and change their own brands; a non-owned id
// is reported as missing, never as forbidden.
import { brands, type Brand } from './brandStore'
import { getSupabaseAdmin } from '../lib/supabaseServer'

export interface BrandRepo {
  list(userId: string): Promise<Brand[]>
  get(id: string, userId: string): Promise<Brand | undefined>
  save(brand: Brand): Promise<void>
}

export function memoryBrandRepo(): BrandRepo {
  return {
    list: async (userId) => [...brands.values()].filter((b) => b.owner === userId),
    get: async (id, userId) => {
      const b = brands.get(id)
      return b && b.owner === userId ? b : undefined
    },
    save: async (brand) => { brands.set(brand.id, brand) },
  }
}

const TABLE = 'brand_studio_brands'

/** @param admin a service-role Supabase client */
export function supabaseBrandRepo(admin: any): BrandRepo {
  const unwrap = ({ data, error }: any) => { if (error) throw error; return data }
  return {
    list: async (userId) => {
      const rows = unwrap(await admin.from(TABLE).select('data').eq('clerk_user_id', userId).order('created_at', { ascending: false }))
      return (rows || []).map((r: any) => r.data as Brand)
    },
    get: async (id, userId) => {
      const row = unwrap(await admin.from(TABLE).select('data').eq('id', id).eq('clerk_user_id', userId).maybeSingle())
      return row ? (row.data as Brand) : undefined
    },
    save: async (brand) => {
      unwrap(await admin.from(TABLE).upsert({ id: brand.id, clerk_user_id: brand.owner, data: brand, updated_at: new Date().toISOString() }, { onConflict: 'id' }))
    },
  }
}

const hasSupabase = () => !!((process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) && process.env.SUPABASE_SERVICE_ROLE_KEY)

let cached: BrandRepo | null = null
/** The repo the routes use. BRAND_STORE=memory forces the in-memory one. */
export function getBrandRepo(): BrandRepo {
  if (cached) return cached
  if (process.env.BRAND_STORE !== 'memory' && hasSupabase()) {
    cached = supabaseBrandRepo(getSupabaseAdmin())
  } else {
    cached = memoryBrandRepo()
  }
  return cached
}
/** For tests. */
export function resetBrandRepo(): void { cached = null }
