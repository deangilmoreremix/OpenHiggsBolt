import { NextResponse } from 'next/server';
import { getDesignAgentApiKey } from '../../../design-agent/lib/auth';
import { getMuApiKeyFromRequest } from '../../lib/auth';
import { requireApiEntitlement, entitlementForbiddenResponse } from '@/access/apiRequireEntitlement';
import { ENTITLEMENTS } from '@/access/entitlements';
import { safeApiJson } from '@/lib/safeApiResponse';

const BASE = 'https://api.muapi.ai/api/v1/creative-agent';

function cleanHeaders(request) {
    const headers = new Headers(request.headers);
    headers.delete('host');
    headers.delete('connection');
    headers.delete('cookie');
    headers.delete('Authorization');
    headers.delete('x-api-key');
    return headers;
}

/**
 * Resolves the API key from either:
 * 1. `Authorization: Bearer <token>` — upstream CreativeCanvas client
 * 2. Clerk session — Next.js app routes
 */
async function resolveKey(request) {
    // Try Bearer token first (upstream client compat)
    try {
        return await getMuApiKeyFromRequest(request);
    } catch {
        // Fall back to Clerk session (Next.js app)
        return await getDesignAgentApiKey(request);
    }
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
    const errorResponse = await requireAuthAndEntitlement(request);
    if (errorResponse) return errorResponse;

    const slug = await params;
    const pathSegments = slug.path || [];
    const path = pathSegments.join('/');
    
    const { search } = new URL(request.url);
    const targetUrl = `${BASE}/${path}${search}`;

    const headers = cleanHeaders(request);
    try {
        const key = await resolveKey(request);
        headers.set('x-api-key', key);
    } catch (err) {
        const status = err instanceof Response ? err.status : 401;
        const message = status === 401 ? 'Unauthorized' : err.message || 'Unauthorized';
        return NextResponse.json({ error: message }, { status });
    }

    try {
        const response = await fetch(targetUrl, {
            headers,
            method: 'GET',
            signal: AbortSignal.timeout(60000),
        });
        const data = await safeApiJson(response);
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request, { params }) {
    const entitlementCheck = await requireApiEntitlement(ENTITLEMENTS.SMARTVIDEO_GO);
    if (!entitlementCheck.allowed) {
        if (entitlementCheck.status === 401) {
            return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
        }
        return entitlementForbiddenResponse(ENTITLEMENTS.SMARTVIDEO_GO);
    }

    const slug = await params;
    const pathSegments = slug.path || [];
    const path = pathSegments.join('/');
    
    const { search } = new URL(request.url);
    const targetUrl = `${BASE}/${path}${search}`;

    const headers = cleanHeaders(request);
    try {
        const key = await resolveKey(request);
        headers.set('x-api-key', key);
    } catch (err) {
        const status = err instanceof Response ? err.status : 401;
        const message = status === 401 ? 'Unauthorized' : err.message || 'Unauthorized';
        return NextResponse.json({ error: message }, { status });
    }

    try {
        const contentType = request.headers.get('content-type') || '';
        let body;
        if (contentType.includes('multipart/form-data')) {
            body = await request.formData();
        } else {
            const jsonBody = await request.json().catch(() => ({}));
            body = JSON.stringify(jsonBody);
            headers.set('content-type', 'application/json');
        }
        const response = await fetch(targetUrl, {
            method: 'POST',
            headers,
            body,
            signal: AbortSignal.timeout(120000),
        });
        const data = await safeApiJson(response);
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(request, { params }) {
    const entitlementCheck = await requireApiEntitlement(ENTITLEMENTS.SMARTVIDEO_GO);
    if (!entitlementCheck.allowed) {
        if (entitlementCheck.status === 401) {
            return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
        }
        return entitlementForbiddenResponse(ENTITLEMENTS.SMARTVIDEO_GO);
    }

    const slug = await params;
    const pathSegments = slug.path || [];
    const path = pathSegments.join('/');
    
    const { search } = new URL(request.url);
    const targetUrl = `${BASE}/${path}${search}`;

    const headers = cleanHeaders(request);
    try {
        const key = await resolveKey(request);
        headers.set('x-api-key', key);
    } catch (err) {
        const status = err instanceof Response ? err.status : 401;
        const message = status === 401 ? 'Unauthorized' : err.message || 'Unauthorized';
        return NextResponse.json({ error: message }, { status });
    }

    try {
        const body = await request.json();
        const response = await fetch(targetUrl, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(60000),
        });
        const data = await safeApiJson(response);
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    const entitlementCheck = await requireApiEntitlement(ENTITLEMENTS.SMARTVIDEO_GO);
    if (!entitlementCheck.allowed) {
        if (entitlementCheck.status === 401) {
            return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
        }
        return entitlementForbiddenResponse(ENTITLEMENTS.SMARTVIDEO_GO);
    }

    const slug = await params;
    const pathSegments = slug.path || [];
    const path = pathSegments.join('/');
    
    const { search } = new URL(request.url);
    const targetUrl = `${BASE}/${path}${search}`;

    const headers = cleanHeaders(request);
    try {
        const key = await resolveKey(request);
        headers.set('x-api-key', key);
    } catch (err) {
        const status = err instanceof Response ? err.status : 401;
        const message = status === 401 ? 'Unauthorized' : err.message || 'Unauthorized';
        return NextResponse.json({ error: message }, { status });
    }

    try {
        const response = await fetch(targetUrl, { method: 'DELETE', headers, signal: AbortSignal.timeout(60000) });
        const data = await safeApiJson(response);
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
