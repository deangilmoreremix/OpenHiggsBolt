import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
    }

    const body = await req.json();
    const entry = typeof body?.entry === 'object' ? body.entry : body;

    if (!entry || typeof entry !== 'object') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Set Clerk user context for RLS
    await supabase.rpc('set_config', {
      setting: 'app.clerk_user_id',
      value: userId,
      is_local: true,
    });

    const { data, error } = await supabase
      .from('personalization_outputs')
      .insert({
        clerk_user_id: userId,
        origin_studio: entry.originStudio || 'demo-personalization',
        source_type: entry.sourceType || 'unknown',
        source_demo_id: entry.sourceDemoId || null,
        source_demo_slug: entry.sourceDemoSlug || null,
        viral_record_id: entry.viralRecordId || null,
        source_media: entry.sourceMedia || null,
        source_url: entry.sourceUrl || null,
        personalization_mode: entry.personalizationMode || null,
        model: entry.model || null,
        original_prompt: entry.originalPrompt || '',
        personalized_prompt: entry.personalizedPrompt || '',
        identity_asset_ids: Array.isArray(entry.identityAssetIds) ? entry.identityAssetIds : [],
        logo_asset_ids: Array.isArray(entry.logoAssetIds) ? entry.logoAssetIds : [],
        product_asset_ids: Array.isArray(entry.productAssetIds) ? entry.productAssetIds : [],
        brand_reference_asset_ids: Array.isArray(entry.brandReferenceAssetIds) ? entry.brandReferenceAssetIds : [],
        first_frame_asset_id: entry.firstFrameAssetId || null,
        last_frame_asset_id: entry.lastFrameAssetId || null,
        output_urls: Array.isArray(entry.outputUrls) ? entry.outputUrls : [],
        output_type: entry.outputType || 'prompt',
        client_id: entry.clientId || null,
      })
      .select('id, created_at')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
