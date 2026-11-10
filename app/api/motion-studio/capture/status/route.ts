import { NextRequest, NextResponse } from 'next/server'
import { CAPTURE_BUCKET, CaptureStorageError, readCaptureJob, type CaptureStorage } from '@/src/server/motionCapture'
import { requireMotionStudioUser } from '../../lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/motion-studio/capture/status?jobId=…
 *   → { state: 'running' } | { state: 'done', capture } | { state: 'error', code, error }
 *
 * The record of a background capture (see `POST /api/motion-studio/capture`). A job is only visible to the
 * user it was started for: the record lives under that user's storage prefix.
 */
export async function GET(req: NextRequest) {
  const user = await requireMotionStudioUser(req)
  if (!user.ok) return user.response
  const jobId = req.nextUrl.searchParams.get('jobId') ?? ''
  let job
  try {
    const { createServerClient } = await import('@/lib/supabase')
    const storage = createServerClient().storage.from(CAPTURE_BUCKET) as unknown as CaptureStorage
    job = await readCaptureJob(storage, user.userId, jobId)
  } catch (error) {
    // Storage being down is not "no such capture": the client keeps polling on a 503.
    const message = error instanceof CaptureStorageError ? error.message : 'Capture storage is unavailable'
    return NextResponse.json({ error: message, code: 'STORAGE_UNAVAILABLE' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
  if (!job) return NextResponse.json({ error: 'No such capture', code: 'NOT_FOUND' }, { status: 404, headers: { 'Cache-Control': 'no-store' } })
  return NextResponse.json(job, { headers: { 'Cache-Control': 'no-store' } })
}
