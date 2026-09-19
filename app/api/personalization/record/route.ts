import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';

const MAX_PAYLOAD_SIZE = 1_000_000
const MAX_STRING_LENGTH = 100_000
const MAX_ARRAY_LENGTH = 100

function sanitizeErrorMessage(message: string): string {
  return message
    .replace(/sk-[a-zA-Z0-9]{20,}/g, '[REDACTED]')
    .replace(/AIza[a-zA-Z0-9_-]{35}/g, '[REDACTED]')
    .replace(/Bearer\s+[a-zA-Z0-9._-]+/g, 'Bearer [REDACTED]')
}

function sanitizeValue(value: unknown, maxLength = MAX_STRING_LENGTH): unknown {
  if (typeof value === 'string') {
    return value.length > maxLength ? value.slice(0, maxLength) + '...' : value
  }
  if (Array.isArray(value)) {
    return value.slice(0, MAX_ARRAY_LENGTH).map((item) => sanitizeValue(item, maxLength))
  }
  if (value && typeof value === 'object') {
    const sanitized: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value)) {
      sanitized[key] = sanitizeValue(val, maxLength)
    }
    return sanitized
  }
  return value
}

export async function POST(req: NextRequest) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30_000)

  try {
    const { userId } = await auth();
    if (!userId) {
      clearTimeout(timeoutId)
      return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
    }

    const contentLength = req.headers.get('content-length')
    if (contentLength && Number(contentLength) > MAX_PAYLOAD_SIZE) {
      clearTimeout(timeoutId)
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      clearTimeout(timeoutId)
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const rawEntry =
      typeof (body as { entry?: unknown } | null | undefined)?.entry === 'object' &&
      (body as { entry?: unknown } | null | undefined)?.entry !== null
        ? ((body as { entry: unknown }).entry)
        : (body as unknown)
    if (!rawEntry || typeof rawEntry !== 'object') {
      clearTimeout(timeoutId)
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const entry = sanitizeValue(rawEntry) as Record<string, unknown>

    const allowedStringFields = [
      'originStudio', 'sourceType', 'sourceDemoId', 'sourceDemoSlug',
      'viralRecordId', 'sourceMedia', 'sourceUrl', 'personalizationMode',
      'model', 'originalPrompt', 'personalizedPrompt', 'outputType',
    ]

    const sanitizedEntry: Record<string, unknown> = {}
    for (const field of allowedStringFields) {
      if (field in entry) {
        const value = entry[field]
        sanitizedEntry[field] = typeof value === 'string' ? value.slice(0, MAX_STRING_LENGTH) : null
      }
    }

    const arrayFields = [
      'identityAssetIds', 'logoAssetIds', 'productAssetIds',
      'brandReferenceAssetIds', 'outputUrls',
    ]
    for (const field of arrayFields) {
      if (field in entry) {
        const value = entry[field]
        sanitizedEntry[field] = Array.isArray(value) ? value.slice(0, MAX_ARRAY_LENGTH) : []
      }
    }

    sanitizedEntry.first_frame_asset_id = typeof entry.firstFrameAssetId === 'string' ? entry.firstFrameAssetId.slice(0, 100) : null
    sanitizedEntry.last_frame_asset_id = typeof entry.lastFrameAssetId === 'string' ? entry.lastFrameAssetId.slice(0, 100) : null
    sanitizedEntry.client_id = typeof entry.clientId === 'string' ? entry.clientId.slice(0, 100) : null

    const supabase = createServerClient();

    await supabase.rpc('set_config', {
      setting: 'app.clerk_user_id',
      value: userId,
      is_local: true,
    });

    const { data, error } = await supabase
      .from('personalization_outputs')
      .insert({
        clerk_user_id: userId,
        origin_studio: sanitizedEntry.originStudio || 'demo-personalization',
        source_type: sanitizedEntry.sourceType || 'unknown',
        source_demo_id: sanitizedEntry.sourceDemoId || null,
        source_demo_slug: sanitizedEntry.sourceDemoSlug || null,
        viral_record_id: sanitizedEntry.viralRecordId || null,
        source_media: sanitizedEntry.sourceMedia || null,
        source_url: sanitizedEntry.sourceUrl || null,
        personalization_mode: sanitizedEntry.personalizationMode || null,
        model: sanitizedEntry.model || null,
        original_prompt: sanitizedEntry.originalPrompt || '',
        personalized_prompt: sanitizedEntry.personalizedPrompt || '',
        identity_asset_ids: sanitizedEntry.identityAssetIds || [],
        logo_asset_ids: sanitizedEntry.logoAssetIds || [],
        product_asset_ids: sanitizedEntry.productAssetIds || [],
        brand_reference_asset_ids: sanitizedEntry.brandReferenceAssetIds || [],
        first_frame_asset_id: sanitizedEntry.first_frame_asset_id,
        last_frame_asset_id: sanitizedEntry.last_frame_asset_id,
        output_urls: sanitizedEntry.outputUrls || [],
        output_type: sanitizedEntry.outputType || 'prompt',
        client_id: sanitizedEntry.client_id,
      })
      .select('id, created_at')
      .single();

    clearTimeout(timeoutId)

    if (error) {
      const safeMessage = sanitizeErrorMessage(error.message)
      return NextResponse.json({ error: safeMessage }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    clearTimeout(timeoutId)
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json({ error: 'Request timed out' }, { status: 504 })
    }
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { error: sanitizeErrorMessage(message) },
      { status: 500 }
    );
  }
}
