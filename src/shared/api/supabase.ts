import { createClient, SupabaseClient } from '@supabase/supabase-js'

function env(name: string, fallback = '') {
  return (process.env as Record<string, string | undefined>)[name] ?? fallback
}

const supabaseUrl = env('NEXT_PUBLIC_SUPABASE_URL') || env('VITE_SUPABASE_URL') || env('SUPABASE_URL') || ''
const supabaseKey = env('NEXT_PUBLIC_SUPABASE_ANON_KEY') || env('VITE_SUPABASE_ANON_KEY') || env('SUPABASE_ANON_KEY') || ''

let cached: SupabaseClient | null | undefined

function createInst() {
  if (!supabaseUrl || !supabaseKey) {
    return createClient('https://placeholder.invalid', 'placeholder') as SupabaseClient
  }
  return createClient(supabaseUrl, supabaseKey)
}

export { createInst as getSupabase }

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_, prop: keyof SupabaseClient) {
    return (...args: unknown[]) => {
      const instance = createInst()
      const fn = (instance as unknown as Record<string, unknown>)[String(prop)]

      if (typeof fn === 'function') {
        return (...rest: unknown[]) => (fn as (...a: unknown[]) => unknown)(...rest)
      }

      return fn
    }
  },
})
