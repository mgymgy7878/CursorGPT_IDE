'use client'

import Link from 'next/link'
import { StatusDot } from './status-dot'
import { useHeartbeat } from '@/hooks/useHeartbeat'
import { useWsHeartbeat } from '@/hooks/useWsHeartbeat'
import { useEngineHealth } from '@/hooks/useEngineHealth'

export default function StatusBar() {
  const { data, error, isLoading } = useHeartbeat()
  const apiOk = !error && !!data
  const wsOk = useWsHeartbeat()
  const { ok: engineOk } = useEngineHealth()
  
  return (
    <div className="w-full border-b bg-zinc-950/40 backdrop-blur px-4 py-2 text-sm flex items-center gap-4">
      <div className="flex items-center gap-2">
        <StatusDot ok={apiOk} />
        <span>API</span>
        {data && <span className="text-zinc-400">(EB {(data.errorBudget * 100).toFixed(0)}%)</span>}
      </div>
      <div className="flex items-center gap-2">
        <StatusDot ok={wsOk} />
        <span>WS</span>
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

