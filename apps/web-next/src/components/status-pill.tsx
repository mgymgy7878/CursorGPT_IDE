'use client'

import { StatusDot } from './status-dot'

interface HealthPillProps {
  ok: boolean | 'degraded' | undefined
  label: string
  latency?: number | null
  onClick?: () => void
  title?: string
  'data-testid'?: string
}

/**
 * Health Pill Component - Figma parity
 *
 * Displays health status with dot, label, and optional latency
 * Responsive: shows only dot + label on small screens, adds latency on larger screens
 * Supports degraded state (amber) for slow responses
 */
export function HealthPill({ ok, label, latency, onClick, title, 'data-testid': testId }: HealthPillProps) {
  // Consistent pill typography token (Figma parity)
  const baseClasses = "flex items-center gap-1.5 shrink-0 rounded-full bg-white/5 px-2 py-[3px] text-[13px] font-medium text-white/80 leading-none"
  const interactiveClasses = onClick ? "cursor-pointer hover:bg-white/8 transition-colors" : ""

  // Determine status: ok, degraded (slow), or error
  const isDegraded = ok && latency !== null && latency !== undefined && latency > 800
  const status = ok === undefined ? undefined : isDegraded ? 'degraded' : ok

  return (
    <div
      data-testid={testId}
      className={`${baseClasses} ${interactiveClasses}`}
      onClick={onClick}
      title={title}
    >
      <StatusDot ok={status} />
      <span className="whitespace-nowrap">{label}</span>
      {ok && latency !== undefined && latency !== null && (
        <span className="text-white/50 tabular-nums min-w-[52px] text-right hidden sm:inline">
          {latency}ms
        </span>
      )}
    </div>
  )
}

