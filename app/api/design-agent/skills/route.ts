import { NextRequest } from 'next/server'
import { proxyToCreativeAgent, corsPreflight } from '../_proxy'

export async function OPTIONS() {
  return corsPreflight()
}

export async function GET(req: NextRequest) {
  return proxyToCreativeAgent(req, { pathSegments: ['agent-skills'] })
}
