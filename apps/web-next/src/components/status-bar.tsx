/**
 * TopStatusBar - Figma Parity v1
 *
 * 3-section layout (left/center/right) with overflow protection
 * Figma design: dark, thin, pill-based status indicators
 */

'use client'

import { StatusDot } from './status-dot'
import { HealthPill } from './status-pill'
import { SparkMark } from './spark-mark'
import { useHeartbeat } from '@/hooks/useHeartbeat'
import { useWsHeartbeat } from '@/hooks/useWsHeartbeat'
import { useEngineHealth } from '@/hooks/useEngineHealth'
import { useWebNextHealth } from '@/hooks/useWebNextHealth'
import { useExecutorHealth } from '@/hooks/useExecutorHealth'
// CommandButton kaldırıldı - Figma parity: hotkey hint ComposerBar'da
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
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
    orderBus: 'Sağlıklı', // data?.status === 'UP' ? 'Sağlıklı' : 'Degraded',
    transactions: 42, // TODO: Gerçek datadan al
    volume: '1.2M$', // TODO: Gerçek datadan al
    alerts: '1/3', // TODO: Gerçek datadan al
  }
}

// Breadcrumb mapping for pathnames
function getBreadcrumb(pathname: string | null): string | null {
  if (!pathname) return null

  const routes: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/strategies': 'Stratejiler',
    '/running': 'Çalışan Stratejiler',
    '/market-data': 'Piyasa Verileri',
    '/control': 'Operasyon Merkezi',
    '/settings': 'Ayarlar',
  }

  // Check exact match first
  if (routes[pathname]) return routes[pathname]

  // Check prefix matches (e.g., /control with tabs)
  if (pathname.startsWith('/control')) return 'Operasyon Merkezi'
  if (pathname.startsWith('/strategies')) return 'Stratejiler'
  if (pathname.startsWith('/market-data')) return 'Piyasa Verileri'

  return null
}

export default function StatusBar() {
  const pathname = usePathname()
  const { data, error, isLoading } = useHeartbeat()
  const apiOk = !error && !!data
  const wsOk = useWsHeartbeat()
  const { ok: engineOk } = useEngineHealth()
  const { ok: webNextOk } = useWebNextHealth()
  const { ok: executorOk, latencyMs: executorLatencyMs } = useExecutorHealth()
  const metrics = useHealthzMetrics()
  const breadcrumb = getBreadcrumb(pathname)

  // Dashboard'da TopStatusBar minimal olsun (Figma parity: terminal tarzı)
  const isDashboard = pathname === '/dashboard' || pathname === '/'

  // Track last successful ping times
  const [lastOkTimes, setLastOkTimes] = useState<Record<string, number>>({})

  useEffect(() => {
    const now = Date.now()
    if (webNextOk) setLastOkTimes(prev => ({ ...prev, webnext: now }))
    if (executorOk) setLastOkTimes(prev => ({ ...prev, executor: now }))
  }, [webNextOk, executorOk])

  const getLastOkText = (key: string) => {
    const lastOk = lastOkTimes[key]
    if (!lastOk) return 'Never'
    const secondsAgo = Math.floor((Date.now() - lastOk) / 1000)
    if (secondsAgo < 60) return `${secondsAgo}s ago`
    return `${Math.floor(secondsAgo / 60)}m ago`
  }

  // DEV mode (her zaman true, local development için)
  const devOk = true

  return (
    <div className="sticky top-0 z-50 border-b border-white/10 bg-[#0B0F14]/80 backdrop-blur">
      <div className="mx-auto flex h-12 items-center gap-3 px-3">

        {/* LEFT: Brand + Canary + Breadcrumb (shrink-0) */}
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-[3px] text-[13px] font-medium text-white/90 border border-white/10 leading-none">
            <SparkMark />
            <span>Spark Trading</span>
          </div>
          <div className="rounded-full bg-emerald-500/15 px-2 py-[3px] text-[13px] font-medium text-emerald-200 border border-emerald-400/30 leading-none">
            Canary
          </div>
          {/* UI-1: Breadcrumb (replaces page H1) */}
          {breadcrumb && !isDashboard && (
            <>
              <span className="text-white/30 text-[11px]">/</span>
              <span className="text-[11px] text-white/70 font-medium">{breadcrumb}</span>
            </>
          )}
        </div>

        {/* MIDDLE: Health indicators + Metrics (flex-1, overflow-safe with edge fade) */}
        <div className="min-w-0 flex-1 relative">
          {/* Edge fade mask (left) */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#0B0F14] to-transparent pointer-events-none z-10" />
          {/* Edge fade mask (right) */}
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0B0F14] to-transparent pointer-events-none z-10" />
          <div className="flex min-w-0 items-center gap-2 overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-2">
            {/* Health Pills - Figma order: API | WS | Executor | DEV */}
            <HealthPill
              ok={apiOk}
              label="API"
              title={`API Status: ${apiOk ? 'UP' : 'DOWN'}`}
            />
            <HealthPill
              ok={wsOk}
              label="WS"
              title={`WebSocket Status: ${wsOk ? 'Connected' : 'Disconnected'}`}
            />
            <HealthPill
              ok={executorOk}
              label="Executor"
              latency={executorLatencyMs ?? null}
              onClick={() => window.open('http://127.0.0.1:4001/healthz', '_blank')}
              title={`Executor (port 4001)\nStatus: ${executorOk ? 'UP' : 'DOWN'}\nLatency: ${executorLatencyMs !== undefined ? `${executorLatencyMs}ms` : 'N/A'}\nLast OK: ${getLastOkText('executor')}\nClick to open health endpoint`}
            />
            <HealthPill
              ok={'degraded' as any} // DEV is always amber (mode indicator, not health)
              label="DEV"
              title="Development Mode"
            />

            {/* Divider */}
            <div className="w-px h-4 bg-white/10 shrink-0" />

            {/* Metrics - P95 · RT Delay · WS Staleness · OrderBus (PATCH H: Telemetri metrikleri) */}
            <span className="text-[13px] text-white/60 tabular-nums whitespace-nowrap shrink-0 min-w-[52px] text-right font-medium">
              P95: {metrics.p95 !== null ? `${metrics.p95}ms` : '—'}
            </span>
            <span className="text-white/35 shrink-0">·</span>
            <span className="text-[13px] text-white/60 tabular-nums whitespace-nowrap shrink-0 min-w-[52px] text-right font-medium">
              <span className="hidden sm:inline">RT Delay: </span>
              <span className="sm:hidden">RT: </span>
              {metrics.rtDelay !== null ? `${metrics.rtDelay}ms` : '—'}
            </span>
            <span className="text-white/35 shrink-0">·</span>
            {/* PATCH H: WS Staleness (mock - would come from WS heartbeat) */}
            <span className="text-[13px] text-white/60 tabular-nums whitespace-nowrap shrink-0 min-w-[40px] text-right font-medium">
              <span className="hidden sm:inline">WS: </span>
              <span className={wsOk ? "text-emerald-300" : "text-amber-400"}>
                {wsOk ? '<1s' : '—'}
              </span>
            </span>
            <span className="text-white/35 shrink-0">·</span>
            <span className="text-[13px] whitespace-nowrap shrink-0 font-medium">
              <span className="hidden sm:inline text-white/60">OrderBus: </span>
              <span className="sm:hidden text-white/60">OB: </span>
              <span className="text-emerald-300">{metrics.orderBus}</span>
            </span>
          </div>
        </div>

        {/* RIGHT: Metrics + Actions (shrink-0) */}
        <div className="flex shrink-0 items-center gap-3">
          {/* İşlem · Hacim · Uyarılar (Figma separator style, consistent typography) */}
          <div className="flex items-center gap-1.5 text-[13px] text-white/70 font-medium">
            <span className="tabular-nums whitespace-nowrap">İşlem: {metrics.transactions}</span>
            <span className="text-white/35">·</span>
            <span className="tabular-nums whitespace-nowrap">Hacim: {metrics.volume}</span>
            <span className="text-white/35">·</span>
            <span className="whitespace-nowrap">Uyarılar: {metrics.alerts}</span>
          </div>

          {/* Action Buttons - Dashboard'da gizli (Figma parity: terminal tarzı minimal bar) */}
          {!isDashboard && (
            <>
          {/* Divider */}
          <div className="w-px h-4 bg-white/10 shrink-0" />

          {/* Action Buttons - Figma pill style (subtle hover, consistent typography) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => window.location.href = '/strategy-lab'}
              className="rounded-full bg-white/5 hover:bg-white/8 border border-white/10 px-3 py-[3px] text-[13px] font-medium text-white/90 transition-colors h-8 whitespace-nowrap leading-none"
              aria-label="Strateji Oluştur"
            >
              Strateji Oluştur
            </button>
            <button
              onClick={() => console.log('Create alert')}
              className="rounded-full bg-white/5 hover:bg-white/8 border border-white/10 px-3 py-[3px] text-[13px] font-medium text-white/80 transition-colors h-8 whitespace-nowrap leading-none"
              aria-label="Uyarı Oluştur"
            >
              Uyarı Oluştur
            </button>
          </div>
            </>
          )}

          {/* Right Icons - Figma parity: CommandButton yok, hotkey (Ctrl+K) ComposerBar'da */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 transition-colors"
              aria-label="Bildirimler"
            >
              <span className="text-sm">🔔</span>
            </button>
            <button
              className="w-6 h-6 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Kullanıcı menüsü"
            >
              <span className="text-xs">👤</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
