'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { pollForResult } from '@/lib/muapi'

/**
 * Shared polling hook that wraps `pollForResult` with React state.
 *
 * @param {Object}   opts
 * @param {?string}  opts.requestId
 * @param {string}   opts.apiKey
 * @param {number=}  opts.maxAttempts  default 900
 * @param {number=}  opts.interval     default 2000 (ms)
 * @param {(data:any)=>void=} opts.onComplete
 * @returns {{ data:any, error:Error|null, status:string, cancel: () => void }}
 */
export function usePollResult({
  requestId,
  apiKey,
  maxAttempts = 900,
  interval = 2000,
  onComplete,
} = {}) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [status, setStatus] = useState('idle')
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
      return undefined
    }
    cancelledRef.current = false
    setStatus('polling')
    setError(null)
    setData(null)
    let active = true
    pollForResult(requestId, apiKey, maxAttempts, interval)
      .then((result) => {
        if (!active || cancelledRef.current) return
        setData(result)
        setStatus('succeeded')
        onCompleteRef.current?.(result)
      })
      .catch((err) => {
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
