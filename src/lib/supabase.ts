import { createClient, SupabaseClient } from '@supabase/supabase-js'

function env(name: string, fallback = '') {
  return (process.env as Record<string, string | undefined>)[name] ?? fallback
}

const supabaseUrl =
  env('NEXT_PUBLIC_SUPABASE_URL') ||
  env('VITE_SUPABASE_URL') ||
  env('SUPABASE_URL') ||
  ''

const supabaseAnonKey =
  env('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
  env('VITE_SUPABASE_ANON_KEY') ||
  env('SUPABASE_ANON_KEY') ||
  ''

let browserSingleton: SupabaseClient | undefined

function getBrowserClient(): SupabaseClient {
  if (browserSingleton) return browserSingleton

  if (!supabaseUrl || !supabaseAnonKey) {
    browserSingleton = createClient('https://placeholder.invalid', 'placeholder')
  } else {
    browserSingleton = createClient(supabaseUrl, supabaseAnonKey)
  }

  return browserSingleton
}

export const supabase: SupabaseClient = getBrowserClient()

export function createServerClient(): SupabaseClient {
  const url = env('SUPABASE_URL') || env('NEXT_PUBLIC_SUPABASE_URL') || ''
  const key = env('SUPABASE_SERVICE_ROLE_KEY') || ''

  if (!url || !key) {
    throw new Error(
      'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable'
    )
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function mirrorUrlToStorage(
  url: string,
  filename: string,
  folder: string
): Promise<string> {
  const client = createServerClient()

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${url}: ${response.status} ${response.statusText}`
    )
  }

  const blob = await response.blob()
  const path = `${folder}/${filename}`

  const { error } = await client.storage.from('brand-assets').upload(path, blob, {
    upsert: true,
    contentType: blob.type || 'application/octet-stream',
  })

  if (error) throw error

  const { data } = client.storage.from('brand-assets').getPublicUrl(path)
  return data.publicUrl
}
