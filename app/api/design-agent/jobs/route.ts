import { safeApiJson } from '@/lib/safeApiResponse';
import { NextRequest, NextResponse } from 'next/server'
import { getDesignAgentApiKey } from '../lib/auth'
import { auth } from '@clerk/nextjs/server'
import { requireOwnership, recordOwnership } from '../lib/ownership'

export const dynamic = "force-dynamic";

const BASE = 'https://api.muapi.ai/api/v1/creative-agent'

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
    }

    const key = await getDesignAgentApiKey(req)
    const { searchParams } = new URL(req.url)
    const jobId = searchParams.get('jobId')
    const sessionId = searchParams.get('sessionId')

    if (jobId) {
      const ownershipResult = await requireOwnership(jobId, 'job');
      if (ownershipResult instanceof Response) {
        return NextResponse.json({ error: ownershipResult.status === 401 ? 'UNAUTHENTICATED' : 'Forbidden' }, { status: ownershipResult.status });
      }

      const qs = new URLSearchParams()
      const since = searchParams.get('since')
      const limit = searchParams.get('limit')
      if (since) qs.set('since', since)
      if (limit) qs.set('limit', limit)
      const q = qs.toString()
      const res = await fetch(`${BASE}/jobs/${jobId}/events${q ? `?${q}` : ''}`, {
        headers: { 'x-api-key': key },
        signal: AbortSignal.timeout(30000),
      })
      const data = await safeApiJson(res)
      return NextResponse.json(data, { status: res.status })
    }

    if (sessionId) {
      const ownershipResult = await requireOwnership(sessionId, 'session');
      if (ownershipResult instanceof Response) {
        return NextResponse.json({ error: ownershipResult.status === 401 ? 'UNAUTHENTICATED' : 'Forbidden' }, { status: ownershipResult.status });
      }

      const res = await fetch(`${BASE}/sessions/${sessionId}/jobs`, { headers: { 'x-api-key': key }, signal: AbortSignal.timeout(30000) })
      const data = await safeApiJson(res)

      // Record ownership for any jobs returned
      if (Array.isArray(data)) {
        for (const job of data) {
          if (job?.id) {
            recordOwnership({ userId, sessionId, jobId: job.id });
          }
        }
      }

      return NextResponse.json(data, { status: res.status })
    }
    return NextResponse.json({ error: 'jobId or sessionId required' }, { status: 400 })
  } catch (err: any) {
    const status = err instanceof Response ? err.status : 500
    const message = status === 401 ? 'Unauthorized' : status === 400 ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status })
  }
}
