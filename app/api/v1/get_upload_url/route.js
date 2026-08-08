import { NextResponse } from 'next/server';

const MUAPI_BASE = 'https://api.muapi.ai';

function getApiKey(request) {
    const headerKey = request.headers.get('x-api-key');
    if (headerKey) return headerKey;
    // Support Bearer token auth from the upstream client.
    const auth = request.headers.get('authorization');
    if (auth && auth.startsWith('Bearer ')) return auth.slice(7);
    return null;
}

function cleanHeaders(request) {
    const headers = new Headers(request.headers);
    headers.delete('host');
    headers.delete('connection');
    headers.delete('cookie');
    return headers;
}

export async function GET(request) {
    const apiKey = getApiKey(request);
    if (!apiKey) {
        return NextResponse.json({ error: 'Unauthorized: Missing API key' }, { status: 401 });
    }

    const { search } = new URL(request.url);
    const targetUrl = `${MUAPI_BASE}/app/get_file_upload_url${search}`;

    const headers = cleanHeaders(request);
    headers.set('x-api-key', apiKey);

    try {
        const response = await fetch(targetUrl, {
            headers,
            method: 'GET',
        });

        const data = await response.json();

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
