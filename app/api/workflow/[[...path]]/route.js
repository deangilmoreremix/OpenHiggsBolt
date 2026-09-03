import { safeApiJson } from '@/lib/safeApiResponse';
import { NextResponse } from 'next/server';
import { rewriteThumbnails } from './thumbnail-rewrite.js';
import { requireApiEntitlement, entitlementForbiddenResponse } from '@/access/apiRequireEntitlement';
import { ENTITLEMENTS } from '@/access/entitlements';

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
    // Only accept x-api-key header. Cookie-based auth is removed for security:
    // cookies without HttpOnly flag can be stolen by XSS (CWE-522).
    const headerKey = request.headers.get('x-api-key');
    return headerKey || null;
}

function cleanHeaders(request) {
    const headers = new Headers(request.headers);
    headers.delete('host');
    headers.delete('connection');
    headers.delete('cookie'); // CRITICAL: Stop forwarding browser cookies to MuAPI to avoid auth conflicts
    return headers;
}

async function requireAuthAndEntitlement(request) {
    const entitlementCheck = await requireApiEntitlement(ENTITLEMENTS.SMARTVIDEO_GO);
    if (!entitlementCheck.allowed) {
        if (entitlementCheck.status === 401) {
            return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
        }
        return entitlementForbiddenResponse(ENTITLEMENTS.SMARTVIDEO_GO);
    }
    return null;
}

export async function GET(request, { params }) {
    const slug = await params;
    const pathSegments = slug.path || [];
    const path = pathSegments.join('/');
    
    const { search } = new URL(request.url);
    const targetUrl = `${MUAPI_BASE}/workflow/${path}${search}`;

    const headers = cleanHeaders(request);

    const apiKey = getApiKey(request);
    // NOTE: credential logging removed for security (CWE-200)
    if (apiKey) headers.set('x-api-key', apiKey);

    try {
        const response = await fetch(targetUrl, {
            headers,
            method: 'GET',
            signal: AbortSignal.timeout(30000),
        });
        const data = await safeApiJson(response);
        return NextResponse.json(withLocalThumbnails(data), { status: response.status });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request, { params }) {
    const errorResponse = await requireAuthAndEntitlement(request);
    if (errorResponse) return errorResponse;

    const slug = await params;
    const pathSegments = slug.path || [];
    const path = pathSegments.join('/');

    const { search } = new URL(request.url);
    const targetUrl = `${MUAPI_BASE}/workflow/${path}${search}`;

    const headers = cleanHeaders(request);

    const apiKey = getApiKey(request);
    // NOTE: credential logging removed for security (CWE-200)
    if (apiKey) headers.set('x-api-key', apiKey);

    try {
        const body = await request.arrayBuffer();

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers,
            body,
            signal: AbortSignal.timeout(60000),
        });
        const data = await safeApiJson(response);
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    const errorResponse = await requireAuthAndEntitlement(request);
    if (errorResponse) return errorResponse;

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
            headers,
            signal: AbortSignal.timeout(30000),
        });
        const data = await safeApiJson(response);
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    const errorResponse = await requireAuthAndEntitlement(request);
    if (errorResponse) return errorResponse;

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
            body,
            signal: AbortSignal.timeout(60000),
        });
        const data = await safeApiJson(response);
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
