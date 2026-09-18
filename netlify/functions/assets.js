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
    const campaignId = event.queryStringParameters?.campaign_id;
    const id = event.queryStringParameters?.id;

    if (event.httpMethod === 'GET') {
      if (id) {
        const { data, error } = await supabase.from('brand_assets').select('*').eq('id', id).single();
        if (error) throw error;
        return { statusCode: 200, headers: { 'Content-Type': 'application/json', ...buildCorsHeaders(event) }, body: JSON.stringify(data) };
      }
      if (campaignId) {
        const { data, error } = await supabase.from('brand_assets').select('*').eq('campaign_id', campaignId).order('created_at', { ascending: false });
        if (error) throw error;
        return { statusCode: 200, headers: { 'Content-Type': 'application/json', ...buildCorsHeaders(event) }, body: JSON.stringify(data || []) };
      }
      return { statusCode: 400, headers: { 'Content-Type': 'application/json', ...buildCorsHeaders(event) }, body: JSON.stringify({ error: 'Missing campaign_id or id' }) };
    }

    if (event.httpMethod === 'POST') {
      const payload = JSON.parse(event.body || '{}');
      const res = await fetch(`${supabaseUrl}/functions/v1/asset-generate`, {
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

    if (event.httpMethod === 'PATCH' && id) {
      const patch = JSON.parse(event.body || '{}');
      const { data, error } = await supabase.from('brand_assets').update(patch).eq('id', id).select().single();
      if (error) throw error;
      return { statusCode: 200, headers: { 'Content-Type': 'application/json', ...buildCorsHeaders(event) }, body: JSON.stringify(data) };
    }

    return { statusCode: 405, headers: buildCorsHeaders(event), body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (err) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json', ...buildCorsHeaders(event) }, body: JSON.stringify({ error: err.message }) };
  }
}};
