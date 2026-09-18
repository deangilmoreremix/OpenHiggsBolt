import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const file = form.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'missing file' }, { status: 400 })
  }

  const buf = Buffer.from(await file.arrayBuffer())
  const filename = file.name || `animate-${Date.now()}.png`
  const contentType = file.type || 'application/octet-stream'

  try {
    const { data, error } = await supabase.storage
      .from('brand-assets')
      .upload(`${Date.now()}-${filename}`, buf, { contentType })

    if (error) throw error

    const { data: urlData } = supabase.storage
      .from('brand-assets')
      .getPublicUrl(data.path)

    return NextResponse.json({ url: urlData.publicUrl })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'upload failed' }, { status: 500 })
  }
}
