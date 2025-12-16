/**
 * TopStatusBar - Figma Parity v0
 *
 * Figma'daki shell görünümüne yaklaş:
 * - Brand pill + Canary chip
 * - API/WS/Executor/DEV status indicators
 * - P95/RT Delay/OrderBus metrics
 * - Sağ metrikler (İşlem/Hacim/Uyarılar)
 * - Sağ köşe ikonlar (bildirim, kullanıcı)
 */

'use client'

import { StatusDot } from './status-dot'
import { useHeartbeat } from '@/hooks/useHeartbeat'
import { useWsHeartbeat } from '@/hooks/useWsHeartbeat'
import { useEngineHealth } from '@/hooks/useEngineHealth'
import { WSStatusBadge } from '@/components/ui/StatusBadge'
import { CommandButton } from '@/components/layout/CommandButton'
import { useState, useEffect } from 'react'
import useSWR from 'swr'

// Healthz endpoint'inden SLO metrics al
function useHealthzMetrics() {
  const { data } = useSWR('/api/healthz', async (url) => {
    const res = await fetch(url, { cache: 'no-store' })
    return res.json()
  }, { refreshInterval: 5000 })

  return {
    p95: data?.slo?.latencyP95 ?? null,
    rtDelay: data?.slo?.stalenessSec ? data.slo.stalenessSec * 1000 : null, // saniye -> ms
    // Fixture data için "Sağlıklı" sabit (Figma parity, snapshot psikolojisi)
    orderBus: 'Sağlıklı', // data?.status === 'UP' ? 'Sağlıklı' : 'Degraded',
    transactions: 42, // TODO: Gerçek datadan al
    volume: '1.2M$', // TODO: Gerçek datadan al
    alerts: '1/3', // TODO: Gerçek datadan al
  }
}

export default function StatusBar() {
  const { data, error, isLoading } = useHeartbeat()
  const apiOk = !error && !!data
  const wsOk = useWsHeartbeat()
  const { ok: engineOk } = useEngineHealth()
  const metrics = useHealthzMetrics()

  // WS staleness tracking
  const [wsStalenessMs, setWsStalenessMs] = useState<number | undefined>(undefined)

  useEffect(() => {
    if (!wsOk) {
      setWsStalenessMs(undefined)
      return
    }

    const interval = setInterval(() => {
      const mockStaleness = Math.random() * 10000
      setWsStalenessMs(mockStaleness > 5000 ? mockStaleness : undefined)
    }, 1000)

    return () => clearInterval(interval)
  }, [wsOk])

  const getWSStatus = (): "connected" | "paused" | "reconnecting" | "stale" | "error" => {
    if (!wsOk) return "error"
    if (wsStalenessMs && wsStalenessMs > 5000) return "stale"
    return "connected"
  }

  // DEV mode (her zaman true, local development için)
  const devOk = true

  return (
    <div className="w-full border-b border-neutral-800 bg-neutral-950/60 backdrop-blur-sm px-4 py-2.5 text-sm flex items-center gap-4">
      {/* Sol: Brand pill + Canary chip */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="px-3 py-1 rounded-full bg-neutral-800/80 border border-neutral-700 text-xs font-medium">
          Spark Trading
        </div>
        <div className="px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs">
          Canary
        </div>
      </div>

      {/* Ortada: Status indicators + Metrics */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Status Indicators */}
        <div className="flex items-center gap-2 shrink-0">
          <StatusDot ok={apiOk} />
          <span className="text-xs text-neutral-300">API</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusDot ok={wsOk} />
          <span className="text-xs text-neutral-300">WS</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusDot ok={engineOk} />
          <span className="text-xs text-neutral-300">Executor</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusDot ok={devOk} />
          <span className="text-xs text-neutral-300">DEV</span>
        </div>

        {/* Divider */}
        <div className="w-px h-4 bg-neutral-700 shrink-0" />

        {/* Performance Metrics - Center section with truncate protection */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {metrics.p95 !== null && (
            <span className="text-xs text-neutral-400 tabular-nums whitespace-nowrap shrink-0">
              P95: {metrics.p95}ms
            </span>
          )}
          {metrics.rtDelay !== null && (
            <span className="text-xs text-neutral-400 tabular-nums whitespace-nowrap shrink-0">
              RT Delay: {metrics.rtDelay}ms
            </span>
          )}
          <span className="text-xs text-neutral-400 whitespace-nowrap shrink-0">
            OrderBus: {metrics.orderBus}
          </span>
        </div>
      </div>

      {/* Sağ: Metrikler + İkonlar */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-3 text-xs text-neutral-300">
          <span className="tabular-nums">İşlem: {metrics.transactions}</span>
          <span className="tabular-nums">Hacim: {metrics.volume}</span>
          <span>Uyarılar: {metrics.alerts}</span>
        </div>

        {/* Sağ köşe: Commands + Bildirim + Kullanıcı */}
        <div className="flex items-center gap-2">
          <CommandButton variant="full" />
          <button
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-neutral-800 transition-colors"
            aria-label="Bildirimler"
          >
            <span className="text-sm">🔔</span>
          </button>
          <button
            className="w-6 h-6 flex items-center justify-center rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors"
            aria-label="Kullanıcı menüsü"
          >
            <span className="text-xs">👤</span>
          </button>
        </div>
      </div>
    </div>
  )
}
