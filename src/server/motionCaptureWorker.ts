/**
 * The background capture the `motion-studio-capture-background` Netlify function runs (compiled to
 * `netlify/lib/motion-capture.cjs` by `scripts/build-motion-capture.mjs`). A web request can only take
 * ~30 s on the host, too little to start a browser and photograph a heavy page; the background function
 * has minutes. The result is a job record the client polls (`/api/motion-studio/capture/status`).
 */
import { BrowserSsrfError, capturePageScreenshots } from './browserDiscovery'
import {
  CAPTURE_JOB_ID,
  buildCaptureResponse,
  captureImages,
  captureIsEmpty,
  storeCaptureImages,
  writeCaptureJob,
  type CaptureStorage,
} from './motionCapture'

/** How long the background capture may take: the host allows minutes, the client stops waiting after ~2. */
export const WORKER_CAPTURE_OPTIONS = { hardMs: 90_000, budgetMs: 60_000, firstShotMs: 25_000, navigationMs: 30_000 } as const

export interface MotionCaptureJobRequest {
  jobId: string
  userId: string
  url: string
}

/** Runs one capture job and always leaves a `done` or `error` record behind. */
export async function runMotionCapture(job: MotionCaptureJobRequest, storage: CaptureStorage): Promise<void> {
  const { jobId, userId, url } = job
  const finish = (error: { code: string; message: string }) =>
    writeCaptureJob(storage, userId, jobId, { state: 'error', finishedAt: new Date().toISOString(), code: error.code, error: error.message })
  try {
    const capture = await capturePageScreenshots(url, { ...WORKER_CAPTURE_OPTIONS })
    if (captureIsEmpty(capture)) return await finish({ code: 'CAPTURE_FAILED', message: 'The page could not be captured' })
    const urls = await storeCaptureImages(storage, userId, captureImages(capture))
    await writeCaptureJob(storage, userId, jobId, { state: 'done', finishedAt: new Date().toISOString(), capture: buildCaptureResponse(capture, urls) })
  } catch (err) {
    const rejected = err instanceof BrowserSsrfError
    console.warn('[motion-studio/capture-worker] failed', err instanceof Error ? err.message : String(err))
    await finish(
      rejected
        ? { code: 'URL_REJECTED', message: 'That address cannot be captured. Use a public http(s) page.' }
        : { code: 'CAPTURE_FAILED', message: 'The page could not be captured' },
    ).catch(() => undefined)
  }
}

/** Parses a dispatch body; null when it is not a well-formed job. */
export function parseJobRequest(body: unknown): MotionCaptureJobRequest | null {
  if (!body || typeof body !== 'object') return null
  const b = body as Record<string, unknown>
  if (typeof b.jobId !== 'string' || !CAPTURE_JOB_ID.test(b.jobId)) return null
  if (typeof b.userId !== 'string' || !b.userId || b.userId.length > 128) return null
  if (typeof b.url !== 'string' || !/^https?:\/\//i.test(b.url) || b.url.length > 2048) return null
  return { jobId: b.jobId, userId: b.userId, url: b.url }
}
