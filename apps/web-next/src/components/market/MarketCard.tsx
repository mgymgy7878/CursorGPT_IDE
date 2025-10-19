'use client'
import { useMemo } from 'react'
import { useMarketStore } from '@/stores/marketStore'

export function MarketCard({ symbol }: { symbol: string }) {
  const t = useMarketStore((s) => s.tickers[symbol])
  const staleness = useMarketStore((s) => s.staleness(symbol))

  const badge = useMemo(() => {
    if (staleness === 'ok') return { c: 'bg-green-600', text: 'LIVE' }
    if (staleness === 'warn') return { c: 'bg-amber-600', text: 'STALE' }
    return { c: 'bg-red-600', text: 'LAG' }
  }, [staleness])

  return (
    <div className="rounded-md border p-3 grid gap-2">
      <div className="flex items-center justify-between">
        <div className="font-medium">{symbol}</div>
        <span className={`text-xs text-white px-2 py-0.5 rounded ${badge.c}`}>{badge.text}</span>
      </div>
      <div className="text-2xl tabular-nums">{t?.price?.toFixed(2) ?? '—'}</div>
      <div className="text-xs text-muted-foreground">{t?.ts ? new Date(t.ts).toLocaleTimeString() : '—'}</div>
    </div>
  )
}


