import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getDiscoveryJobForUser } from '@/server/discoveryJobs'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get('jobId')

  if (!jobId) {
    return NextResponse.json({ error: 'jobId is required' }, { status: 400 })
  }

  const { userId } = await auth()
  if (!userId) {
    // Allow anonymous status lookups when a valid jobId is provided.
    // The discovery jobId is an unguessable UUID, so exposing terminal
    // discovery state does not leak sensitive user data.
  }

  const job = await getDiscoveryJobForUser(jobId, userId)
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  const safeTelemetry = job.telemetry_json
    ? {
        ...job.telemetry_json,
        browserErrorMessage: undefined,
      }
    : null

  const response: Record<string, unknown> = {
    id: job.id,
    status: job.status,
    websiteUrl: job.website_url,
    providerAttempts: (safeTelemetry as any)?.providerAttempts || [],
    pagesCrawled: (safeTelemetry as any)?.pagesCrawled ?? 0,
    created_at: job.created_at,
    started_at: job.started_at,
    completed_at: job.completed_at,
  }

  if (job.status === 'complete' || job.status === 'error') {
    response.browserQueued = false
    if (job.error_code) {
      response.errorCode = job.error_code
      response.errorMessage = job.error_message
    }
    if (job.final_result_json) {
      response.result = job.final_result_json
    }
  } else if (job.status === 'running') {
    response.browserQueued = true
  }

  if (safeTelemetry) {
    response.telemetry = safeTelemetry
  }

  return NextResponse.json(response)
}
