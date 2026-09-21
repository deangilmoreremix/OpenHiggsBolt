const { createClient } = require('@supabase/supabase-js');
const { buildCorsHeaders, getCorsResponse, requireClerkAuth } = require('./_shared/auth.js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceRole);

function toStringArray(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter((x) => typeof x === 'string');
  if (typeof v === 'string') return v.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
}

module.exports = { handler: async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return getCorsResponse(204, event);
  }

  const authResult = await requireClerkAuth(event);
  if (!authResult.ok) {
    return authResult.response;
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
      return { statusCode: 200, headers: { 'Content-Type': 'application/json', ...buildCorsHeaders(event) }, body: JSON.stringify(data) };
    }

    if (event.httpMethod === 'PATCH' && id) {
      const patch = JSON.parse(event.body || '{}');
      const allowedFields = [
        'brand_name', 'industry', 'tagline', 'value_proposition',
        'tone_of_voice', 'brand_personality', 'target_audience',
        'key_messages', 'primary_colors', 'secondary_colors',
        'fonts', 'logo_url', 'screenshot_url', 'imagery_style',
        'layout_style', 'raw_json',
      ];
      const whitelisted = {};
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
      return { statusCode: 200, headers: { 'Content-Type': 'application/json', ...buildCorsHeaders(event) }, body: JSON.stringify(data) };
    }

    if (event.httpMethod === 'DELETE' && id) {
      const { error } = await supabase.from('brand_dna').delete().eq('id', id);
      if (error) throw error;
      return { statusCode: 200, headers: { 'Content-Type': 'application/json', ...buildCorsHeaders(event) }, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 405, headers: buildCorsHeaders(event), body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (err) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json', ...buildCorsHeaders(event) }, body: JSON.stringify({ error: err.message }) };
  }
}};
