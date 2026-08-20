import { NextResponse } from 'next/server';
import { isValidStoryboardModel, DEFAULT_STORYBOARD_MODEL_ID } from '@/apps/storyboard/models';

const MUAPI_BASE = 'https://api.muapi.ai';

function getApiKey(request: Request): string | null {
  const headerKey = request.headers.get('x-api-key');
  if (headerKey) return headerKey;
  const cookieKey = request.headers.get('cookie')?.match(/muapi_key=([^;]+)/)?.[1];
  return cookieKey || null;
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
    // For shot generation (POST .../episodes/{id}/shots) the selected image model
    // is carried in the JSON body. Validate it against the catalog so an unknown
    // model id fails fast with a clear error instead of an opaque MuAPI 404.
    if (/\/episodes\/[^/]+\/shots$/.test(path)) {
      try {
        const text = await request.text();
        const parsed = text ? JSON.parse(text) : {};
        const requested = typeof parsed.model === 'string' ? parsed.model : DEFAULT_STORYBOARD_MODEL_ID;
        if (!isValidStoryboardModel(requested)) {
          return NextResponse.json(
            {
              error: `Unknown storyboard image model: "${requested}". Choose one of the available models in the Shot Editor.`,
            },
            { status: 400 }
          );
        }
        // Normalize to a known id and forward.
        parsed.model = requested;
        init.body = JSON.stringify(parsed);
      } catch {
        // If the body isn't JSON we still forward it; MuAPI will reject if needed.
        const body = await request.arrayBuffer();
        init.body = body;
      }
    } else {
      const body = await request.arrayBuffer();
      init.body = body;
    }
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
