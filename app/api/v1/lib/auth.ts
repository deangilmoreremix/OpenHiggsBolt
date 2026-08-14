import { NextRequest, NextResponse } from 'next/server';

/**
 * Extracts the MuAPI key from the request.
 *
 * Priority:
 * 1. `Authorization: Bearer <token>` — used by the upstream CreativeCanvas client
 * 2. `x-api-key` header — used by the Next.js app proxy routes
 *
 * Returns 401 if no key is present.
 */
export async function getMuApiKeyFromRequest(req: NextRequest): Promise<string> {
  const authHeader = req.headers.get('authorization') || '';
  const bearerKey = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const xApiKey = req.headers.get('x-api-key')?.trim();

  const key = bearerKey || xApiKey;
  if (!key) {
    throw new Response('Unauthorized: Missing API key', { status: 401 });
  }

  return key;
}
