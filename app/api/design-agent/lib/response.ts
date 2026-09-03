import { NextResponse } from 'next/server';

export async function safeJson(res: Response) {
  const text = await res.text();
  if (!text) {
    return {};
  }
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export function formatApiError(err: unknown) {
  if (err instanceof Response) {
    return { status: err.status, body: safeJson(err) };
  }
  return { status: 500, body: { error: err instanceof Error ? err.message : 'Internal server error' } };
}
