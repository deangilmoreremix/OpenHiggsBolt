const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-openai-key',
};

module.exports = { handler: async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders }, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const openAiKey = event.headers['x-openai-key'] || event.headers['X-OpenAI-Key'];
    if (!openAiKey) {
      return { statusCode: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders }, body: JSON.stringify({ error: 'Missing OpenAI API key' }) };
    }

    const model = body.model || 'gpt-image-2.5-flare';
    const prompt = String(body.prompt || '').trim();
    if (!prompt) {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders }, body: JSON.stringify({ error: 'Missing prompt' }) };
    }

    const imageUrl = String(body.image_url || '');
    if (!imageUrl) {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders }, body: JSON.stringify({ error: 'Missing image_url' }) };
    }

    const n = Math.min(Math.max(Number(body.n) || 1, 1), 4);
    const aspectRatio = String(body.aspect_ratio || '16:9');
    const quality = String(body.quality || 'auto');
    const background = String(body.background || 'auto');
    const outputFormat = String(body.output_format || 'png');
    const customSize = body.size ? String(body.size) : undefined;
    const strength = body.strength !== undefined ? Number(body.strength) : 0.5;

    let size = customSize || 'auto';
    if (!customSize) {
      const aspectToSize: Record<string, string> = {
        '16:9': '1792x1024',
        '1:1': '1024x1024',
        '4:5': '1024x1280',
        '9:16': '1024x1792',
      };
      size = aspectToSize[aspectRatio] || '1024x1024';
    }

    const formData = new FormData();
    formData.append('model', model);
    formData.append('prompt', prompt);
    formData.append('n', String(n));
    formData.append('size', size);
    formData.append('quality', quality);
    formData.append('background', background);
    formData.append('output_format', outputFormat);
    formData.append('strength', String(strength));

    const imageBlob = dataUrlToBlob(imageUrl);
    if (imageBlob) formData.append('image', imageBlob, 'source.png');

    const maskUrl = body.mask_data_url ? String(body.mask_data_url) : undefined;
    if (maskUrl) {
      const maskBlob = dataUrlToBlob(maskUrl);
      if (maskBlob) formData.append('mask', maskBlob, 'mask.png');
    }

    const openaiResponse = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openAiKey}` },
      body: formData,
    });

    const data = await openaiResponse.json();
    if (!openaiResponse.ok) {
      return { statusCode: openaiResponse.status, headers: { 'Content-Type': 'application/json', ...corsHeaders }, body: JSON.stringify(data) };
    }

    const urls = (data.data || []).map((item: any) => item.url).filter(Boolean);
    return { statusCode: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders }, body: JSON.stringify({ urls, request_id: data.request_id || data.id || undefined, revised_prompt: data.revised_prompt || undefined }) };
  } catch (err) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders }, body: JSON.stringify({ error: err.message || 'Internal server error' }) };
  }
}};

function dataUrlToBlob(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return null;
  const [header, base64] = dataUrl.split(',');
  if (!header || !base64) return null;
  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const binary = Buffer.from(base64, 'base64');
  return new Blob([binary], { type: mime });
}
