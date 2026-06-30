import { NextResponse } from 'next/server'
import {
  getApiKey,
  cleanHeaders,
  buildTargetUrl,
  runProxy,
} from './_proxyCore.js'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
}

function decorate(response) {
  const headers = new Headers(response.headers)
  for (const [k, v] of Object.entries(CORS_HEADERS)) headers.set(k, v)
  headers.set('Cache-Control', 'no-store')
  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

export async function proxyToCreativeAgent(request, { pathSegments, queryParams } = {}) {
  const targetUrl = buildTargetUrl(pathSegments, queryParams)
  const initHeaders = cleanHeaders(request)
  const apiKey = getApiKey(request)
  if (apiKey) initHeaders.set('x-api-key', apiKey)

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD'
  const bodyBuf = hasBody ? await request.arrayBuffer() : undefined
  if (hasBody && !initHeaders.has('Content-Type')) {
    initHeaders.set('Content-Type', 'application/json')
  }

  const init = { method: request.method, headers: initHeaders }
  if (hasBody) init.body = bodyBuf
  const res = await runProxy(targetUrl, init)
  return decorate(res)
}

export function corsPreflight() {
  return new NextResponse(null, { status: 204, headers: { ...CORS_HEADERS, 'Cache-Control': 'no-store' } })
}
