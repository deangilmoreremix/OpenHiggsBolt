const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const supabase = createClient(supabaseUrl, serviceRole);

function toStringArray(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter((x) => typeof x === 'string');
  if (typeof v === 'string') return v.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
}

module.exports = { handler: async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  try {
    const id = event.queryStringParameters?.id;

    if (event.httpMethod === 'GET' && id) {
      const { data, error } = await supabase
        .from('brand_dna')
        .select('*, brand_campaigns(*)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return { statusCode: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders }, body: JSON.stringify(data) };
    }

    if (event.httpMethod === 'PATCH' && id) {
      const patch = JSON.parse(event.body || '{}');
      if (patch.tone_of_voice) patch.tone_of_voice = toStringArray(patch.tone_of_voice).join(', ');
      if (patch.brand_personality) patch.brand_personality = toStringArray(patch.brand_personality).join(', ');
      if (patch.key_messages) patch.key_messages = toStringArray(patch.key_messages).join(', ');
      if (patch.primary_colors) patch.primary_colors = toStringArray(patch.primary_colors).join(', ');
      if (patch.secondary_colors) patch.secondary_colors = toStringArray(patch.secondary_colors).join(', ');
      if (patch.fonts) patch.fonts = toStringArray(patch.fonts).join(', ');
      patch.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('brand_dna')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return { statusCode: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders }, body: JSON.stringify(data) };
    }

    if (event.httpMethod === 'DELETE' && id) {
      const { error } = await supabase.from('brand_dna').delete().eq('id', id);
      if (error) throw error;
      return { statusCode: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders }, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (err) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders }, body: JSON.stringify({ error: err.message }) };
  }
}};
