import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export function createServerClient(): SupabaseClient {
  const url = Deno.env.get('NEXT_PUBLIC_SUPABASE_URL') || Deno.env.get('SUPABASE_URL') || ''
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable')
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
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
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
