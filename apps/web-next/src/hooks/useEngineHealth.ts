'use client'

import useSWR from 'swr'
import { fetchJson } from '@/lib/health'

export function useEngineHealth() {
  const { data, error } = useSWR('/api/public/engine-health', fetchJson, {
    refreshInterval: 10000
  })
  return {
    ok: !!data && data.running && !error,
    data,
    error
  }
}

