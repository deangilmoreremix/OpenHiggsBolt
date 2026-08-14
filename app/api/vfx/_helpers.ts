export async function resolveMuAPIKey(req?: { headers: Headers }): Promise<string> {
  const envKey = process.env.MUAPI_API_KEY || process.env.MUAPI_KEY || ''
  if (envKey) return envKey

  const headerKey = req?.headers.get('x-api-key')?.trim()
  if (headerKey) return headerKey

  return ''
}

export async function validateMuAPIKey(req?: { headers: Headers }): Promise<string> {
  const key = await resolveMuAPIKey(req)
  if (!key) {
    throw new Error('MUAPI_API_KEY is not configured and no user API key was provided')
  }
  return key
}
