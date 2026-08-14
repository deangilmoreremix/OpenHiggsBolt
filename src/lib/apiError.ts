import { NextResponse } from 'next/server';

export function ok(data: unknown, pagination?: { page: number; pageSize: number; total: number; totalPages: number }) {
  const body: Record<string, unknown> = { data }
  if (pagination !== undefined) body.pagination = pagination
  return NextResponse.json(body)
}

export function apiError(code: string, message: string, status: number, details?: unknown) {
  return NextResponse.json({ error: { code, message, ...(details !== undefined ? { details } : {}) } }, { status })
}
