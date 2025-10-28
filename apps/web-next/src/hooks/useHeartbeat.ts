'use client'

import useSWR from 'swr'
import { fetchJson } from '@/lib/health'
import { ErrorBudgetSchema, type ErrorBudget } from '@/schema/api'

export function useHeartbeat() {
  const { data, error, isLoading } = useSWR<unknown>('/api/public/error-budget', fetchJson, {
    refreshInterval: 5000
  })
  
  // Runtime validation with Zod schema
  const validated = data ? ErrorBudgetSchema.safeParse(data) : null
  
  return {
    data: validated?.success ? validated.data : null,
    error: error || (validated?.success === false ? new Error('Invalid error budget data') : null),
    isLoading
  }
}

