import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getDiscoveryJobForUser } from '@/server/discoveryJobs'
import { buildDiscoveryJobResponse } from '@/server/discoveryJobResponse'

export const dynamic = "force-dynamic";

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get('jobId')

  if (!jobId) {
    return NextResponse.json({ error: 'jobId is required' }, { status: 400 })
  }

  const { userId } = await auth()

  // Discovery is FREE, so an anonymous caller may poll its own job — but the
  // scope is the caller's identity, exactly as the POST handler scopes it:
  // the signed-in user's id, else `anon-<client ip>`, else plain `anon`.
  // There is deliberately NO unscoped fallback: a job that belongs to another
  // user, or to another anonymous caller, is not found (404). Previously this
  // route fell back to getDiscoveryJobById(jobId) with no ownership check,
  // letting any unauthenticated caller read any discovery job (audit
  // Finding 4.1) — that hole stays closed.
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || undefined
  const jobOwnerId = userId || (clientIp ? `anon-${clientIp}` : 'anon')

  // Owner-scoped lookup: a job that belongs to another user is not found.
  const job = await getDiscoveryJobForUser(jobId, jobOwnerId)

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  return NextResponse.json(buildDiscoveryJobResponse(job))
}
