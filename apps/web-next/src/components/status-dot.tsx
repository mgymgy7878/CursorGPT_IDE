'use client'

export function StatusDot({ ok }: { ok: boolean | undefined }) {
  const color = ok === undefined 
    ? 'bg-zinc-400 animate-pulse' 
    : ok 
    ? 'bg-green-500' 
    : 'bg-red-500'
  
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} />
}

