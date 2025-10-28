'use client'

import useSWR from 'swr'
import { fetchJson } from '@/lib/health'
import { EngineHealthSchema, type EngineHealth } from '@/schema/api'

export function useEngineHealth() {
  // Use unknown to enforce runtime validation - we validate with Zod before use
  const { data, error } = useSWR<unknown>('/api/public/engine-health', fetchJson, {
    refreshInterval: 10000
  })
  
  // Runtime validation with Zod schema
  const validated = data ? EngineHealthSchema.safeParse(data) : null
  
  return {
    ok: validated?.success === true && validated.data.running && !error,
    data: validated?.success ? validated.data : null,
    error: error || (validated?.success === false ? new Error('Invalid engine health data') : null)
  }
}

