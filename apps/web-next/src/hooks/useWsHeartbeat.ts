'use client'

import { useEffect, useState } from 'react'

export function useWsHeartbeat(intervalMs = 20000) {
  const [ok, setOk] = useState<boolean | undefined>(undefined)
  
  useEffect(() => {
    let stop = false
    let timer: any
    
    async function tick() {
      const url = process.env.NEXT_PUBLIC_WS_URL
      if (!url) {
        setOk(undefined)
        return
      }
      
      try {
        const ws = new WebSocket(url)
        const timeout = setTimeout(() => {
          try { ws.close() } catch {}
          setOk(false)
        }, 3000)
        
        ws.onopen = () => {
          clearTimeout(timeout)
          setOk(true)
          ws.close()
        }
        
        ws.onerror = () => {
          clearTimeout(timeout)
          setOk(false)
        }
      } catch {
        setOk(false)
      }
      
      if (!stop) timer = setTimeout(tick, intervalMs)
    }
    
    tick()
    return () => {
      stop = true
      if (timer) clearTimeout(timer)
    }
  }, [intervalMs])
  
  return ok
}

