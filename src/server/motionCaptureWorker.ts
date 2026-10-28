/**
 * The background capture the `motion-studio-capture-background` Netlify function runs (compiled to
 * `netlify/lib/motion-capture.cjs` by `scripts/build-motion-capture.mjs`). A web request can only take
 * ~30 s on the host, too little to start a browser and photograph a heavy page; the background function
 * has minutes. The result is a job record the client polls (`/api/motion-studio/capture/status`).
 */
import { BrowserSsrfError, capturePageScreenshots, type PageCapture } from './browserDiscovery'
import {
  CAPTURE_JOB_ID,
  buildCaptureResponse,
  captureImages,
  captureIsEmpty,
  storeCaptureImages,
  WORKER_WATCHDOG_MS,
  writeCaptureJob,
  type CaptureJob,
  type CaptureStorage,
} from './motionCapture'

/** How long the background capture may take: the host allows minutes, the client stops waiting after ~2. */
export const WORKER_CAPTURE_OPTIONS = { hardMs: 90_000, budgetMs: 60_000, firstShotMs: 25_000, navigationMs: 30_000 } as const

export interface MotionCaptureJobRequest {
  jobId: string
  userId: string
  url: string
}

/** A capture that fails this fast (browser start, first navigation) is tried once more within the same budget. */
const RETRY_WITHIN_MS = 15_000

/** Why a capture failed, safe to show: the first line of the error, no addresses, short. */
const reasonOf = (err: unknown): string =>
  (err instanceof Error ? err.message : String(err)).split('\n')[0].replace(/https?:\/\/\S+/gi, 'the address').slice(0, 160)

/** Runs one capture job and always leaves exactly one `done` or `error` record behind. */
export async function runMotionCapture(job: MotionCaptureJobRequest, storage: CaptureStorage, opts: { watchdogMs?: number } = {}): Promise<void> {
  const { jobId, userId, url } = job
  const started = Date.now()
  let written = false
  // One record wins: a late capture never overwrites the watchdog's error, nor the other way round.
  const write = async (record: CaptureJob) => {
    if (written) return
    written = true
    try {
      await writeCaptureJob(storage, userId, jobId, record)
    } catch (err) {
      written = false
      throw err
    }
  }
  const fail = (code: string, message: string, timing?: unknown) =>
    write({ state: 'error', finishedAt: new Date().toISOString(), code, error: message, ...(timing && typeof timing === 'object' ? { timing: timing as Record<string, number> } : {}) })

  const run = async () => {
    let capture: PageCapture
    try {
      capture = await capturePageScreenshots(url, { ...WORKER_CAPTURE_OPTIONS })
    } catch (err) {
      if (err instanceof BrowserSsrfError || Date.now() - started > RETRY_WITHIN_MS) throw err
      console.warn('[motion-studio/capture-worker] retrying after', reasonOf(err))
      const hardMs = WORKER_CAPTURE_OPTIONS.hardMs - (Date.now() - started)
      capture = await capturePageScreenshots(url, { ...WORKER_CAPTURE_OPTIONS, hardMs, budgetMs: Math.min(WORKER_CAPTURE_OPTIONS.budgetMs, hardMs - 20_000) })
    }
    if (captureIsEmpty(capture)) return fail('CAPTURE_FAILED', 'The page could not be captured: it showed no picture and no text')
    const urls = await storeCaptureImages(storage, userId, captureImages(capture))
    await write({ state: 'done', finishedAt: new Date().toISOString(), capture: buildCaptureResponse(capture, urls) })
  }

  let watchdog: ReturnType<typeof setTimeout> | undefined
  const running = run()
  // After the watchdog has answered, a late failure has nothing left to report.
  running.catch(() => undefined)
  try {
    await Promise.race([
      running,
      new Promise<void>((resolve) => {
        watchdog = setTimeout(() => {
          resolve(fail('TIMEOUT', 'The capture took longer than 2 minutes'))
        }, opts.watchdogMs ?? WORKER_WATCHDOG_MS)
      }),
    ])
  } catch (err) {
    console.warn('[motion-studio/capture-worker] failed', reasonOf(err))
    await (err instanceof BrowserSsrfError
      ? fail('URL_REJECTED', 'That address cannot be captured. Use a public http(s) page.')
      : fail('CAPTURE_FAILED', `The page could not be captured: ${reasonOf(err)}`, (err as { timing?: unknown })?.timing)
    ).catch(() => undefined)
  } finally {
    clearTimeout(watchdog)
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
