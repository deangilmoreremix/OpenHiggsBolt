// app/api/proxy-muapi/route.js

export async function POST(request) {
  const muApiUrl = 'https://api.muapi.ai/api/v1/generate_wan_ai_effects';
  const apiKey = request.headers.get('x-api-key');
  const payload = await request.json();

  if (!apiKey) {
    return Response.json({ error: 'Missing x-api-key header' }, { status: 400 });
  }
  if (!payload || Object.keys(payload).length === 0) {
    return Response.json({ error: 'Missing or empty payload' }, { status: 400 });
  }

  try {
    const muApiRes = await fetch(muApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(payload),
    });

    let data;
    try {
      data = await muApiRes.json();
    } catch (jsonErr) {
      const text = await muApiRes.text();
      return Response.json({ error: 'Non-JSON response from MuApi', details: text }, { status: muApiRes.status });
    }

    return Response.json(data, { status: muApiRes.status });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const apiKey = request.headers.get('x-api-key');

  if (!apiKey) {
    return Response.json({ error: 'Missing x-api-key header' }, { status: 400 });
  }
  if (!id) {
    return Response.json({ error: 'Missing id' }, { status: 400 });
  }

  const muApiStatusUrl = `https://api.muapi.ai/api/v1/predictions/${id}/result`;

  try {
    const muApiRes = await fetch(muApiStatusUrl, {
      headers: { 'x-api-key': apiKey },
    });

    let data;
    try {
      data = await muApiRes.json();
    } catch (jsonErr) {
      const text = await muApiRes.text();
      return Response.json({ error: 'Non-JSON response from MuApi', details: text }, { status: muApiRes.status });
    }

    return Response.json(data, { status: muApiRes.status });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}