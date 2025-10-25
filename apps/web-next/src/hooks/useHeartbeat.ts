'use client'

import useSWR from 'swr'
import { fetchJson } from '@/lib/health'

export function useHeartbeat() {
  const { data, error, isLoading } = useSWR('/api/public/error-budget', fetchJson, {
    refreshInterval: 5000
  })
  return { data, error, isLoading }
}

