const { createClient } = require('@supabase/supabase-js');
const { buildCorsHeaders, getCorsResponse, requireClerkAuth } = require('./_shared/auth.js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceRole);

module.exports = { handler: async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return getCorsResponse(204, event);
  }

  const authResult = await requireClerkAuth(event);
  if (!authResult.ok) {
    return authResult.response;
  }

  try {
    const brandId = event.queryStringParameters?.brand_id;

    if (event.httpMethod === 'GET') {
      let query = supabase.from('brand_campaigns').select('*, brand_assets(*)');
      if (brandId) query = query.eq('brand_id', brandId);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return { statusCode: 200, headers: { 'Content-Type': 'application/json', ...buildCorsHeaders(event) }, body: JSON.stringify(data || []) };
    }

    if (event.httpMethod === 'POST') {
      const payload = JSON.parse(event.body || '{}');
      const res = await fetch(`${supabaseUrl}/functions/v1/campaign-generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRole}`,
        },
        body: JSON.stringify({
          ...payload,
          workspace_id: payload.workspace_id || event.queryStringParameters?.workspace_id || null,
        }),
      });
      const data = await res.json();
      return { statusCode: res.status, headers: { 'Content-Type': 'application/json', ...buildCorsHeaders(event) }, body: JSON.stringify(data) };
    }

    return { statusCode: 405, headers: buildCorsHeaders(event), body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (err) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json', ...buildCorsHeaders(event) }, body: JSON.stringify({ error: err.message }) };
  }
}};
