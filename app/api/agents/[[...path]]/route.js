import { NextResponse } from 'next/server';

const MUAPI_BASE = 'https://api.muapi.ai';

// Rewrite upstream artwork URLs (icon_url / thumbnail / agent_icon_url) into our
// same-origin /api/thumbnail proxy so CDN hotlink protection can't block them in
// the browser. Idempotent: already-local or already-proxied URLs pass through.
function proxyArtworkUrl(url) {
  if (!url || typeof url !== 'string' || url.startsWith('/')) return url;
  return `/api/thumbnail?url=${encodeURIComponent(url)}`;
}

function rewriteArtwork(item) {
  if (!item || typeof item !== 'object') return item;
  const next = { ...item };
  for (const key of ['icon_url', 'thumbnail', 'agent_icon_url']) {
    if (next[key]) next[key] = proxyArtworkUrl(next[key]);
  }
  return next;
}

function withProxiedArtwork(data) {
  if (Array.isArray(data)) return data.map(rewriteArtwork);
  if (data && typeof data === 'object') {
    if (Array.isArray(data.agents)) data.agents = data.agents.map(rewriteArtwork);
    if (Array.isArray(data.items)) data.items = data.items.map(rewriteArtwork);
    if (Array.isArray(data.conversations)) data.conversations = data.conversations.map(rewriteArtwork);
  }
  return data;
}

function getApiKey(request) {
    // Priority 1: Direct x-api-key header
    const headerKey = request.headers.get('x-api-key');
    if (headerKey) return headerKey;

    // Priority 2: muapi_key cookie
    const cookieKey = request.cookies.get('muapi_key')?.value;
    return cookieKey;
}

function cleanHeaders(request) {
    const headers = new Headers(request.headers);
    headers.delete('host');
    headers.delete('connection');
    headers.delete('cookie'); // CRITICAL: Stop forwarding browser cookies to MuAPI
    return headers;
}

// Build the target URL without a trailing slash when path is empty.
// e.g. GET /api/agents?is_template=true  → https://api.muapi.ai/agents?is_template=true
// e.g. GET /api/agents/by-slug/foo       → https://api.muapi.ai/agents/by-slug/foo
function buildTargetUrl(pathSegments, search) {
    const path = pathSegments.join('/');
    const base = `${MUAPI_BASE}/agents`;
    return path ? `${base}/${path}${search}` : `${base}${search}`;
}

export async function GET(request, { params }) {
    const slug = await params;
    const pathSegments = slug.path || [];
    const { search } = new URL(request.url);
    const targetUrl = buildTargetUrl(pathSegments, search);

    const headers = cleanHeaders(request);
    const apiKey = getApiKey(request);
    console.log(`[agents proxy GET] ${targetUrl} | apiKey: ${apiKey ? apiKey.slice(0,8)+'...' : 'MISSING'}`);
    if (apiKey) headers.set('x-api-key', apiKey);

    try {
        const response = await fetch(targetUrl, { headers, method: 'GET' });
        const data = await response.json();
        return NextResponse.json(withProxiedArtwork(data), { status: response.status });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request, { params }) {
    const slug = await params;
    const pathSegments = slug.path || [];
    const { search } = new URL(request.url);
    const targetUrl = buildTargetUrl(pathSegments, search);

    const headers = cleanHeaders(request);
    const apiKey = getApiKey(request);
    console.log(`[agents proxy POST] ${targetUrl} | apiKey: ${apiKey ? apiKey.slice(0,8)+'...' : 'MISSING'}`);
    if (apiKey) headers.set('x-api-key', apiKey);

    try {
        const body = await request.arrayBuffer();
        const response = await fetch(targetUrl, { method: 'POST', headers, body });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    const slug = await params;
    const pathSegments = slug.path || [];
    const { search } = new URL(request.url);
    const targetUrl = buildTargetUrl(pathSegments, search);

    const headers = cleanHeaders(request);
    const apiKey = getApiKey(request);
    if (apiKey) headers.set('x-api-key', apiKey);

    try {
        const response = await fetch(targetUrl, { method: 'DELETE', headers });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    const slug = await params;
    const pathSegments = slug.path || [];
    const { search } = new URL(request.url);
    const targetUrl = buildTargetUrl(pathSegments, search);

    const headers = cleanHeaders(request);
    const apiKey = getApiKey(request);
    if (apiKey) headers.set('x-api-key', apiKey);

    try {
        const body = await request.arrayBuffer();
        const response = await fetch(targetUrl, { method: 'PUT', headers, body });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
