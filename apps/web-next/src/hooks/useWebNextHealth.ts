'use client'

import useSWR from 'swr'

/**
 * WebNext (Next.js dev server) health check
 * Checks if the Next.js server is responding (port 3003)
 */
export function useWebNextHealth() {
  const { data, error } = useSWR(
    '/api/healthz',
    async (url) => {
      try {
        const res = await fetch(url, {
          cache: 'no-store',
          signal: AbortSignal.timeout(2000) // 2s timeout
        })
        return res.ok ? { ok: true } : null
      } catch {
        return null
      }
    },
    {
      refreshInterval: 5000, // 5s refresh
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  )

  return {
    ok: !!data && !error,
    error,
    isLoading: !data && !error
  }
}

