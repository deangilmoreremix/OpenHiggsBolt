import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Access env vars directly so Next.js can inline NEXT_PUBLIC_* at build time.
// A dynamic helper would prevent inlining and leave `process.env` empty in the browser.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL

const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY

export const supabase: SupabaseClient = createClient(
  supabaseUrl ?? 'https://placeholder.invalid',
  supabaseKey ?? 'placeholder'
)

export function getSupabase(): SupabaseClient {
  return supabase
}
