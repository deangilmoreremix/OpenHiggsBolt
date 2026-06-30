'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { pollForResult } from '@/lib/muapi'

export function useSubmitAndPoll({
  endpoint, apiKey, payload, onRequestId, maxAttempts = 60, interval = 2000,
} = {}) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [status, setStatus] = useState('idle')
  const cancelledRef = useRef(false)
  const onRequestIdRef = useRef(onRequestId)
  onRequestIdRef.current = onRequestId
  const payloadRef = useRef(payload)
  payloadRef.current = payload

  const cancel = useCallback(() => {
    cancelledRef.current = true
    setStatus((s) => (s === 'polling' ? 'cancelled' : s))
  }, [])

  const submit = useCallback(async () => {
    if (!endpoint || !apiKey) {
      setError(new Error('endpoint and apiKey are required'))
      return setStatus('failed')
    }
    cancelledRef.current = false
    setStatus('polling')
    setError(null)
    setData(null)
    try {
      const res = await fetch(`/api/v1/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body: JSON.stringify(payloadRef.current || {}),
      })
      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`Submit failed: ${res.status} - ${errText.slice(0, 100)}`)
      }
      const submitData = await res.json()
      const requestId = submitData.request_id || submitData.id
      if (!requestId) {
        if (cancelledRef.current) return
        setData(submitData)
        return setStatus('succeeded')
      }
      onRequestIdRef.current?.(requestId)
      const result = await pollForResult(requestId, apiKey, maxAttempts, interval)
      if (cancelledRef.current) return
      const outputUrl = result.outputs?.[0] || result.url || result.output?.url
      setData({ ...result, url: outputUrl })
      setStatus('succeeded')
    } catch (err) {
      if (cancelledRef.current) return
      setError(err)
      setStatus('failed')
    }
  }, [endpoint, apiKey, maxAttempts, interval])

  useEffect(() => () => { cancelledRef.current = true }, [])

  return { data, error, status, submit, cancel }
}

export default useSubmitAndPoll
