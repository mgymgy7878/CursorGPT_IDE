'use client'
import { useEffect, useState } from "react"

export default function SseDiag() {
  const [state, setState] = useState<'connecting'|'connected'|'error'>('connecting')
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    const es = new EventSource('/api/public/events/orders')
    es.onopen = () => setState('connected')
    es.onerror = () => setState('error')
    es.onmessage = () => setCount(c => c + 1)
    return () => es.close()
  }, [])
  
  return <div className="text-xs opacity-70">SSE: {state} · msgs:{count}</div>
} 