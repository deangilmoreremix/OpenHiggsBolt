/**
 * Server-side helper: download an image from a public URL and return it as a
 * base64 data URL so the client can upload it through the existing
 * `uploadAsset()` / `uploadFile()` lifecycle.
 */

import axios from 'axios'

export async function downloadImageAsDataUrl(url: string, maxBytes = 5 * 1024 * 1024): Promise<string> {
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 15_000,
    maxRedirects: 5,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; AssetDiscovery/1.0; +https://example.com/bot)',
    },
  })

  const buffer = Buffer.from(response.data)
  if (buffer.length > maxBytes) {
    throw new Error(`Image exceeds maximum size of ${maxBytes} bytes`)
  }

  const contentType = String(response.headers['content-type'] || 'application/octet-stream')
  if (!contentType.startsWith('image/')) {
    throw new Error(`Invalid content type: ${contentType}`)
  }

  const base64 = buffer.toString('base64')
  return `data:${contentType};base64,${base64}`
}
