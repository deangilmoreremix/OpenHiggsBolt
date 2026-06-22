const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const supabase = createClient(supabaseUrl, serviceRole);

module.exports = { handler: async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  try {
    const brandId = event.queryStringParameters?.brand_id;

    if (event.httpMethod === 'GET') {
      let query = supabase.from('brand_photoshoots').select('*');
      if (brandId) query = query.eq('brand_id', brandId);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return { statusCode: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders }, body: JSON.stringify(data || []) };
    }

    if (event.httpMethod === 'POST') {
      const payload = JSON.parse(event.body || '{}');
      const res = await fetch(`${supabaseUrl}/functions/v1/photo-studio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRole}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      return { statusCode: res.status, headers: { 'Content-Type': 'application/json', ...corsHeaders }, body: JSON.stringify(data) };
    }

    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (err) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders }, body: JSON.stringify({ error: err.message }) };
  }
}};
