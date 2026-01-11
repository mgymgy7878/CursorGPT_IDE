'use client'

export function StatusDot({ ok }: { ok: boolean | 'degraded' | undefined }) {
  const color = ok === undefined
    ? 'bg-zinc-400 animate-pulse'
    : ok === 'degraded'
    ? 'bg-amber-500'
    : ok
    ? 'bg-green-500'
    : 'bg-red-500'

  return <span className={`inline-block h-2 w-2 rounded-full ${color} shrink-0`} />
}

