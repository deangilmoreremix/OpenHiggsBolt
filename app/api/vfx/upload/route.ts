import { NextRequest, NextResponse } from 'next/server'
import { validateMuAPIKey } from '../_helpers'
import { validateUploadFile } from '../_validation'

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Request must be multipart/form-data' }, { status: 400 })
    }

    const formData = await req.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 })
    }

    const validationError = validateUploadFile(file)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const apiKey = await validateMuAPIKey()

    const muapiForm = new FormData()
    muapiForm.append('file', file)

    const res = await fetch('https://api.muapi.ai/api/v1/upload_file', {
      method: 'POST',
      headers: { 'x-api-key': apiKey },
      body: muapiForm,
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('[VFX upload]', res.status, errText)
      return NextResponse.json({ error: errText || 'Upload failed' }, { status: res.status })
    }

    const data = await res.json()
    const url = data.url || data.file_url || data.data?.url

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'No URL returned from upload' }, { status: 502 })
    }

    return NextResponse.json({
      url,
      name: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[VFX upload exception]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
