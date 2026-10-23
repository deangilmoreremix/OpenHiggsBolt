import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getDiscoveryJobForUser, updateDiscoveryJob } from '@/server/discoveryJobs'
import { buildDiscoveryJobResponse } from '@/server/discoveryJobResponse'

export const dynamic = "force-dynamic";

export const runtime = 'nodejs'

// A job that stays `running` longer than this was never picked up by the
// background worker (dispatch failed, worker crashed, site never responded).
// Mark it terminal so the caller stops polling instead of waiting forever.
const STALE_JOB_MS = 75_000

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
  // user, or to another anonymous caller, is not found (404).
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || undefined
  const jobOwnerId = userId || (clientIp ? `anon-${clientIp}` : 'anon')

  // Owner-scoped lookup: a job that belongs to another user is not found.
  const job = await getDiscoveryJobForUser(jobId, jobOwnerId)

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  // Stale-job watchdog: recover jobs stuck in `running` that the background
  // worker will never finish.
  if (job.status === 'running' && job.started_at) {
    const started = new Date(job.started_at).getTime()
    if (Date.now() - started > STALE_JOB_MS) {
      await updateDiscoveryJob(job.id, {
        status: 'error',
        completedAt: new Date().toISOString(),
        errorCode: 'BACKGROUND_DISPATCH_FAILED',
        errorMessage: 'Background discovery did not complete in time',
      }).catch((persistErr) => {
        console.error('[discover-assets/status] Failed to mark stale job:', persistErr)
      })
      return NextResponse.json(
        buildDiscoveryJobResponse({
          ...job,
          status: 'error',
          error_code: 'BACKGROUND_DISPATCH_FAILED',
          error_message: 'Background discovery did not complete in time',
        }),
      )
    }
  }

  return NextResponse.json(buildDiscoveryJobResponse(job))
}
