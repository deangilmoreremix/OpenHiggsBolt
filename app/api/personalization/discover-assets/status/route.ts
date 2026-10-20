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

  if (!userId) {
    // Security: require an authenticated session. Previously this route fell
    // back to getDiscoveryJobById(jobId) with no ownership check, allowing any
    // unauthenticated caller to read any discovery job (audit Finding 4.1).
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Owner-scoped lookup: a job that belongs to another user is not found.
  const job = await getDiscoveryJobForUser(jobId, userId)

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  return NextResponse.json(buildDiscoveryJobResponse(job))
}
