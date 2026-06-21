import { cookies } from 'next/headers'

export async function resolveMuAPIKey(): Promise<string> {
  const envKey = process.env.MUAPI_API_KEY || process.env.MUAPI_KEY || ''
  if (envKey) return envKey

  const cookieStore = await cookies()
  const cookieKey = cookieStore.get('muapi_key')?.value
  if (cookieKey) return cookieKey

  return ''
}

export async function validateMuAPIKey(): Promise<string> {
  const key = await resolveMuAPIKey()
  if (!key) {
    throw new Error('MUAPI_API_KEY is not configured and no user API key was provided')
  }
  return key
}
