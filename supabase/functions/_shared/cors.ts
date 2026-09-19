const DEFAULT_ALLOWED_ORIGIN = 'http://localhost:3000';

export function corsHeadersFor(request: Request): Record<string, string> {
  const origin =
    request.headers.get('origin') ||
    request.headers.get('Origin') ||
    (typeof Deno !== 'undefined' && Deno.env.get('NEXT_PUBLIC_APP_URL')) ||
    DEFAULT_ALLOWED_ORIGIN;

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, x-openai-key',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

export function handleCors(request: Request): Response {
  return new Response('ok', { headers: corsHeadersFor(request) });
}
