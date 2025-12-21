'use client'

import useSWR from 'swr'

/**
 * Executor service health check (port 4001)
 * Uses proxy endpoint to avoid CORS issues
 */
export function useExecutorHealth() {
  const { data, error } = useSWR(
    '/api/executor-healthz',
    async (url) => {
      try {
        const res = await fetch(url, {
          cache: 'no-store',
          signal: AbortSignal.timeout(2000) // 2s timeout
        })
        if (!res.ok) return null
        const json = await res.json()
        return json.ok ? { ok: true, latencyMs: json.latencyMs, data: json } : null
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
    isLoading: !data && !error,
    latencyMs: data?.latencyMs,
    data
  }
}

