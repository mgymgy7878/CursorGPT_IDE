'use client'

import Link from 'next/link'
import { StatusDot } from './status-dot'
import { useHeartbeat } from '@/hooks/useHeartbeat'
import { useWsHeartbeat } from '@/hooks/useWsHeartbeat'
import { useEngineHealth } from '@/hooks/useEngineHealth'
import { WSStatusBadge } from '@/components/ui/StatusBadge'
import { useState, useEffect } from 'react'

export default function StatusBar() {
  const { data, error, isLoading } = useHeartbeat()
  const apiOk = !error && !!data
  const wsOk = useWsHeartbeat()
  const { ok: engineOk } = useEngineHealth()
  
  // WS staleness tracking (örnek: son mesaj zamanı)
  const [wsStalenessMs, setWsStalenessMs] = useState<number | undefined>(undefined)
  
  useEffect(() => {
    if (!wsOk) {
      setWsStalenessMs(undefined)
      return
    }
    
    // Staleness tracking: her 1 saniyede bir güncelle
    const interval = setInterval(() => {
      // TODO: Gerçek WS son mesaj zamanını store'dan al
      // Şimdilik örnek: 5 saniyeden fazla eskiyse stale
      const mockStaleness = Math.random() * 10000 // 0-10s arası
      setWsStalenessMs(mockStaleness > 5000 ? mockStaleness : undefined)
    }, 1000)
    
    return () => clearInterval(interval)
  }, [wsOk])
  
  // WS durumunu belirle
  const getWSStatus = (): "connected" | "paused" | "reconnecting" | "stale" | "error" => {
    if (!wsOk) return "error"
    if (wsStalenessMs && wsStalenessMs > 5000) return "stale"
    // TODO: paused/reconnecting state'leri store'dan al
    return "connected"
  }
  
  return (
    <div className="w-full border-b bg-zinc-950/40 backdrop-blur px-4 py-2 text-sm flex items-center gap-4">
      <div className="flex items-center gap-2">
        <StatusDot ok={apiOk} />
        <span>API</span>
        {data && <span className="text-zinc-400">(EB {(data.errorBudget * 100).toFixed(0)}%)</span>}
      </div>
      <div className="flex items-center gap-2">
        <WSStatusBadge status={getWSStatus()} stalenessMs={wsStalenessMs} />
      </div>
      <div className="flex items-center gap-2">
        <StatusDot ok={engineOk} />
        <span>Engine</span>
      </div>
      <div className="ml-auto">
        <Link 
          className="underline hover:no-underline text-zinc-400 hover:text-zinc-200" 
          href={process.env.NEXT_PUBLIC_GUARD_VALIDATE_URL || '#'} 
          target="_blank"
        >
          Guard Validate
        </Link>
      </div>
    </div>
  )
}

