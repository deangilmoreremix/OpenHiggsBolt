import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const supabase = createClient(supabaseUrl, serviceRole);

function toStringArray(v: unknown): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === 'string');
  if (typeof v === 'string') return v.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400, headers: corsHeaders });
    }
    const { data, error } = await supabase
      .from('brand_dna')
      .select('*, brand_campaigns(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return NextResponse.json(data, { status: 200, headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}

export async function PATCH(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400, headers: corsHeaders });
    }
    const patch = await request.json().catch(() => ({}));
    const allowedFields = [
      'brand_name', 'industry', 'tagline', 'value_proposition',
      'tone_of_voice', 'brand_personality', 'target_audience',
      'key_messages', 'primary_colors', 'secondary_colors',
      'fonts', 'logo_url', 'screenshot_url', 'imagery_style',
      'layout_style', 'raw_json',
    ];
    const whitelisted: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (patch[key] !== undefined) {
        whitelisted[key] = patch[key];
      }
    }
    if (whitelisted.tone_of_voice !== undefined) whitelisted.tone_of_voice = toStringArray(whitelisted.tone_of_voice).join(', ');
    if (whitelisted.brand_personality !== undefined) whitelisted.brand_personality = toStringArray(whitelisted.brand_personality).join(', ');
    if (whitelisted.key_messages !== undefined) whitelisted.key_messages = toStringArray(whitelisted.key_messages).join(', ');
    if (whitelisted.primary_colors !== undefined) whitelisted.primary_colors = toStringArray(whitelisted.primary_colors).join(', ');
    if (whitelisted.secondary_colors !== undefined) whitelisted.secondary_colors = toStringArray(whitelisted.secondary_colors).join(', ');
    if (whitelisted.fonts !== undefined) whitelisted.fonts = toStringArray(whitelisted.fonts).join(', ');
    whitelisted.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('brand_dna')
      .update(whitelisted)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data, { status: 200, headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}

export async function DELETE(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400, headers: corsHeaders });
    }
    const { error } = await supabase.from('brand_dna').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ ok: true }, { status: 200, headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
