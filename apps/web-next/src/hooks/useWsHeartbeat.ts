'use client'

import { useMarketStore } from '@/stores/marketStore'

/**
 * WebSocket health status from market store.
 * 
 * Returns:
 * - true: WS connected and healthy
 * - false: WS down or degraded
 * - undefined: WS connecting
 * 
 * To use manual ping test instead (fallback when no real WS):
 * Set NEXT_PUBLIC_USE_WS_PING_TEST=true in .env.local
 */
export function useWsHeartbeat() {
  const usePingTest = process.env.NEXT_PUBLIC_USE_WS_PING_TEST === 'true'
  const marketStatus = useMarketStore(s => s.status)
  
  if (usePingTest) {
    // Fallback to ping test (dev mode without real WS)
    // For now, return undefined (would need separate ping logic)
    return undefined
  }
  
  // Use real market store status
  if (marketStatus === 'healthy') return true
  if (marketStatus === 'degraded' || marketStatus === 'down') return false
  return undefined // connecting
}

