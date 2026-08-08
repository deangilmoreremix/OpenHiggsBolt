import { NextResponse } from 'next/server';

const MUAPI_BASE = 'https://api.muapi.ai';

function getApiKey(request: Request): string | null {
  const headerKey = request.headers.get('x-api-key');
  if (headerKey) return headerKey;
  return null;
}

function cleanHeaders(request: Request): Headers {
  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('connection');
  headers.delete('cookie');
  return headers;
}

async function proxy(request: Request, path: string): Promise<NextResponse> {
  const { search } = new URL(request.url);
  const targetUrl = `${MUAPI_BASE}/api/storyboard/${path}${search}`;

  const headers = cleanHeaders(request);
  const apiKey = getApiKey(request);
  if (apiKey) headers.set('x-api-key', apiKey);

  const init: RequestInit = { method: request.method, headers };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const body = await request.arrayBuffer();
    init.body = body;
  }

  try {
    const response = await fetch(targetUrl, init);
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Proxy error' }, { status: 500 });
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await params;
  return proxy(request, path.join('/'));
}

export async function POST(request: Request, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await params;
  return proxy(request, path.join('/'));
}

export async function PUT(request: Request, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await params;
  return proxy(request, path.join('/'));
}

export async function DELETE(request: Request, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await params;
  return proxy(request, path.join('/'));
}
