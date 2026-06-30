'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { pollForResult } from '@/lib/muapi'

export type PollStatus = 'idle' | 'polling' | 'succeeded' | 'failed' | 'cancelled'

export interface UsePollResultOptions {
  requestId: string | null
  apiKey: string
  maxAttempts?: number
  interval?: number
  onComplete?: (data: any) => void
}

export interface UsePollResultReturn {
  data: any
  error: Error | null
  status: PollStatus
  cancel: () => void
}

export function usePollResult({
  requestId,
  apiKey,
  maxAttempts = 900,
  interval = 2000,
  onComplete,
}: UsePollResultOptions): UsePollResultReturn {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<Error | null>(null)
  const [status, setStatus] = useState<PollStatus>('idle')
  const cancelledRef = useRef(false)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const cancel = useCallback(() => {
    cancelledRef.current = true
    setStatus((s) => (s === 'polling' ? 'cancelled' : s))
  }, [])

  useEffect(() => {
    if (!requestId) {
      setStatus('idle')
      return
    }
    cancelledRef.current = false
    setStatus('polling')
    setError(null)
    setData(null)
    let active = true
    pollForResult(requestId, apiKey, maxAttempts, interval)
      .then((result: any) => {
        if (!active || cancelledRef.current) return
        setData(result)
        setStatus('succeeded')
        onCompleteRef.current?.(result)
      })
      .catch((err: Error) => {
        if (!active || cancelledRef.current) return
        setError(err)
        setStatus('failed')
      })
    return () => {
      active = false
      cancelledRef.current = true
    }
  }, [requestId, apiKey, maxAttempts, interval])

  return { data, error, status, cancel }
}

export default usePollResult
