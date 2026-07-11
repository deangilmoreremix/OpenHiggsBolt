import { NextResponse } from 'next/server';
import { rewriteThumbnails } from './thumbnail-rewrite.js';

const MUAPI_BASE = 'https://api.muapi.ai';

// The MuAPI API returns thumbnail URLs pointing at cdn.muapi.ai. Some of those
// assets are unreliable in the browser, so we rewrite any known thumbnail to a
// same-origin local path (public/thumbnails/...) that the app serves. This runs
// server-side so every consumer (including the browser) gets local URLs.
function withLocalThumbnails(data) {
    if (Array.isArray(data)) {
        return rewriteThumbnails(data);
    }
    if (data && typeof data === 'object') {
        if (Array.isArray(data.workflows)) data.workflows = rewriteThumbnails(data.workflows);
        if (Array.isArray(data.agents)) data.agents = rewriteThumbnails(data.agents);
        if (Array.isArray(data.items)) data.items = rewriteThumbnails(data.items);
    }
    return data;
}

function getApiKey(request) {
    return (
        request.headers.get('x-api-key') ||
        request.cookies.get('muapi_key')?.value ||
        process.env.MUAPI_API_KEY ||
        process.env.MUAPI_KEY ||
        null
    );
}

function cleanHeaders(request) {
    const headers = new Headers(request.headers);
    headers.delete('host');
    headers.delete('connection');
    headers.delete('cookie'); // CRITICAL: Stop forwarding browser cookies to MuAPI to avoid auth conflicts
    return headers;
}

export async function GET(request, { params }) {
    const slug = await params;
    const pathSegments = slug.path || [];
    const path = pathSegments.join('/');
    
    const { search } = new URL(request.url);
    const targetUrl = `${MUAPI_BASE}/workflow/${path}${search}`;

    const headers = cleanHeaders(request);

    const apiKey = getApiKey(request);
    console.log(`[proxy GET] ${targetUrl} | apiKey: ${apiKey ? apiKey.slice(0,8)+'...' : 'MISSING'}`);
    if (apiKey) headers.set('x-api-key', apiKey);

    try {
        const response = await fetch(targetUrl, {
            headers,
            method: 'GET',
        });
        const data = await response.json();
        return NextResponse.json(withLocalThumbnails(data), { status: response.status });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request, { params }) {
    const slug = await params;
    const pathSegments = slug.path || [];
    const path = pathSegments.join('/');

    const { search } = new URL(request.url);
    const targetUrl = `${MUAPI_BASE}/workflow/${path}${search}`;

    const headers = cleanHeaders(request);

    const apiKey = getApiKey(request);
    console.log(`[proxy POST] ${targetUrl} | apiKey: ${apiKey ? apiKey.slice(0,8)+'...' : 'MISSING'} | cookie: ${request.cookies.get('muapi_key')?.value?.slice(0,8) || 'NONE'} | header: ${request.headers.get('x-api-key')?.slice(0,8) || 'NONE'}`);
    if (apiKey) headers.set('x-api-key', apiKey);

    try {
        const body = await request.arrayBuffer();
        // Decode body to see what workflow_id is being sent
        try {
            const parsed = JSON.parse(Buffer.from(body).toString('utf-8'));
            console.log(`[proxy POST] body: workflow_id=${parsed.workflow_id}, source_workflow_id=${parsed.source_workflow_id}, name=${parsed.name}`);
        } catch(e) { /* ignore decode errors */ }

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers,
            body
        });
        const data = await response.json();
        console.log(`[proxy POST] response: status=${response.status}`, JSON.stringify(data).slice(0, 200));
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    const slug = await params;
    const pathSegments = slug.path || [];
    const path = pathSegments.join('/');

    const { search } = new URL(request.url);
    const targetUrl = `${MUAPI_BASE}/workflow/${path}${search}`;

    const headers = cleanHeaders(request);

    const apiKey = getApiKey(request);
    if (apiKey) headers.set('x-api-key', apiKey);

    try {
        const response = await fetch(targetUrl, {
            method: 'DELETE',
            headers
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    const slug = await params;
    const pathSegments = slug.path || [];
    const path = pathSegments.join('/');

    const { search } = new URL(request.url);
    const targetUrl = `${MUAPI_BASE}/workflow/${path}${search}`;

    const headers = cleanHeaders(request);

    const apiKey = getApiKey(request);
    if (apiKey) headers.set('x-api-key', apiKey);

    try {
        const body = await request.arrayBuffer();
        const response = await fetch(targetUrl, {
            method: 'PUT',
            headers,
            body
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
