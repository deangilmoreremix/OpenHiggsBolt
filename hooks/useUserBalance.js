'use client'

import { useQuery } from '@tanstack/react-query'
import { getUserBalance } from 'studio'

/**
 * React Query wrapper around the user-balance fetch used by StandaloneShell.
 * Caches the balance per apiKey and refetches every 30s while the tab is open.
 */
export function useUserBalance(apiKey) {
  return useQuery({
    queryKey: ['balance', apiKey],
    queryFn: () => getUserBalance(apiKey),
    enabled: !!apiKey,
    refetchInterval: 30_000,
  })
}

export default useUserBalance
