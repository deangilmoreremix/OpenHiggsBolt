'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { processMotionControl, resumeGeneration } from '@/packages/studio/src/muapi'
import {
  buildRecastParams,
  clearRecastJob,
  createRecastJob,
  loadRecastJob,
  restoredRecastJob,
  saveRecastJob,
  type RecastJob,
  type StartRecastInput,
} from './recastJob'

function outputUrlOf(result: unknown): string {
  const r = result as { url?: string; outputs?: string[]; output?: { url?: string } } | null
  return r?.url || r?.outputs?.[0] || r?.output?.url || ''
}

function isCancel(error: unknown, signal: AbortSignal): boolean {
  return signal.aborted || (error instanceof Error && error.name === 'AbortError')
}

/**
 * Owns the Full Body Recast job for the open source. It lives in the
 * personalization provider (not the panel), so it keeps running when the user
 * switches tabs or closes the modal, and it resumes from storage after a page
 * reload. `onDone` runs when a job finishes while its source is open; a job
 * that finished while the modal was closed (or before a reload) is left with
 * `applied: false` for the provider to apply once that source is open again.
 */
export function useRecastJob({
  apiKey,
  sourceId,
  onDone,
}: {
  apiKey: string
  sourceId: string | null | undefined
  onDone: (job: RecastJob) => void
}) {
  const [job, setJobState] = useState<RecastJob | null>(null)
  const jobRef = useRef<RecastJob | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone
  // The source open in the modal right now (null while the modal is closed).
  const openSourceRef = useRef<string | null>(sourceId || null)
  openSourceRef.current = sourceId || null

  const setJob = useCallback((next: RecastJob | null) => {
    jobRef.current = next
    setJobState(next)
    if (next) saveRecastJob(next)
  }, [])

  const patch = useCallback((id: string, changes: Partial<RecastJob>) => {
    const current = jobRef.current
    if (!current || current.id !== id) return null
    const next = { ...current, ...changes }
    setJob(next)
    return next
  }, [setJob])

  const finish = useCallback((id: string, url: string) => {
    if (!url) {
      patch(id, { status: 'error', error: 'The recast finished but returned no video.', finishedAt: Date.now() })
      return
    }
    const done = patch(id, { status: 'done', resultUrl: url, error: '', finishedAt: Date.now() })
    // Applied now if its source is open; otherwise when that source reopens.
    if (done && !done.applied && openSourceRef.current === done.sourceId) onDoneRef.current(done)
  }, [patch])

  const fail = useCallback((id: string, error: unknown) => {
    patch(id, {
      status: 'error',
      error: error instanceof Error ? error.message : 'Full body recast failed.',
      finishedAt: Date.now(),
    })
  }, [patch])

  const poll = useCallback(async (current: RecastJob) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const result = await resumeGeneration(apiKey, current.requestId, { signal: controller.signal })
      if (controller.signal.aborted) return
      finish(current.id, outputUrlOf(result))
    } catch (error) {
      if (isCancel(error, controller.signal)) return
      fail(current.id, error)
    }
  }, [apiKey, finish, fail])

  // Closing the modal (no source) leaves a running recast alone. Opening a
  // source picks up its job: the one already in memory, or one stored by an
  // earlier page load (resumed if it is still running).
  useEffect(() => {
    if (!sourceId) return
    const current = jobRef.current
    if (current && current.sourceId === sourceId) return
    // A different source: stop watching the old job (it stays stored and
    // resumes when its own source is opened again).
    abortRef.current?.abort()
    const stored = loadRecastJob(sourceId)
    if (!stored) {
      jobRef.current = null
      setJobState(null)
      return
    }
    const { job: restored, resume } = restoredRecastJob(stored)
    if (resume && !apiKey) {
      // It can't be checked without a key: say so instead of spinning forever.
      setJob({ ...restored, status: 'error', error: 'Connect your SmartVideo (MuAPI) API key in Settings, then Retry to finish this recast.', finishedAt: Date.now() })
      return
    }
    setJob(restored)
    if (resume) void poll(restored)
  }, [sourceId, apiKey, poll, setJob])

  useEffect(() => () => abortRef.current?.abort(), [])

  const start = useCallback(async (input: StartRecastInput) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const created = createRecastJob(input)
    setJob(created)
    try {
      const result = await processMotionControl(apiKey, {
        ...buildRecastParams(created),
        signal: controller.signal,
        // Stored straight away so a reload can resume this exact request.
        onRequestId: (requestId: string) => { patch(created.id, { requestId }) },
      })
      if (controller.signal.aborted) return
      finish(created.id, outputUrlOf(result))
    } catch (error) {
      if (isCancel(error, controller.signal)) return
      fail(created.id, error)
    }
  }, [apiKey, finish, fail, patch, setJob])

  const cancel = useCallback(() => {
    abortRef.current?.abort()
    const current = jobRef.current
    if (current?.status === 'running') {
      patch(current.id, { status: 'cancelled', finishedAt: Date.now() })
    }
  }, [patch])

  /** Re-check the same request after an error (no new charge). */
  const retry = useCallback(() => {
    const current = jobRef.current
    if (!current || current.status !== 'error' || !current.requestId) return false
    const running = patch(current.id, { status: 'running', error: '', finishedAt: 0 })
    if (running) void poll(running)
    return true
  }, [patch, poll])

  const markApplied = useCallback(() => {
    const current = jobRef.current
    if (current && !current.applied) patch(current.id, { applied: true })
  }, [patch])

  const dismiss = useCallback(() => {
    abortRef.current?.abort()
    const current = jobRef.current
    if (current) clearRecastJob(current.sourceId)
    jobRef.current = null
    setJobState(null)
  }, [])

  return { job, start, cancel, retry, markApplied, dismiss }
}

export type RecastJobApi = ReturnType<typeof useRecastJob>
