import { NextRequest, NextResponse } from 'next/server'
import { validateMuAPIKey } from '../_helpers'
import { validateUploadFile } from '../_validation'
import { createClient } from '@supabase/supabase-js'

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

    // Try MuAPI upload first
    const muapiForm = new FormData()
    muapiForm.append('file', file)

    const res = await fetch('https://api.muapi.ai/api/v1/upload_file', {
      method: 'POST',
      headers: { 'x-api-key': apiKey },
      body: muapiForm,
    })

    if (res.ok) {
      const data = await res.json()
      const url = data.url || data.file_url || data.data?.url

      if (url && typeof url === 'string') {
        return NextResponse.json({
          url,
          name: file.name,
          size: file.size,
          type: file.type,
        })
      }
    }

    // Fallback: upload to Supabase Storage
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      const errText = await res.text().catch(() => 'Upload failed')
      return NextResponse.json({ error: errText || 'Upload failed and no fallback storage configured' }, { status: res.status || 502 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const fileExt = file.name.split('.').pop() || 'jpg'
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
    const bucket = 'vfx-uploads'

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('[VFX upload supabase fallback]', uploadError)
      return NextResponse.json({ error: `Supabase upload failed: ${uploadError.message}` }, { status: 502 })
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName)

    return NextResponse.json({
      url: urlData.publicUrl,
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
