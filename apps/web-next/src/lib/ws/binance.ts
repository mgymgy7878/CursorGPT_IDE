'use client'

type Listener = (msg: any) => void

export class BinanceWs {
  private url: string
  private ws?: WebSocket
  private listeners: Set<Listener> = new Set()
  private closed = false
  private retry = 0

  constructor(streamUrl: string) {
    this.url = streamUrl
  }

  start() {
    this.closed = false
    this.connect()
  }

  stop() {
    this.closed = true
    try { this.ws?.close() } catch {}
  }

  on(fn: Listener) { this.listeners.add(fn); return () => this.listeners.delete(fn) }

  private connect() {
    const ws = new WebSocket(this.url)
    this.ws = ws
    ws.onopen = () => { this.retry = 0 }
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(String(ev.data))
        for (const l of this.listeners) l(data)
      } catch {}
    }
    ws.onclose = () => {
      if (this.closed) return
      const backoff = Math.min(30000, 500 * Math.pow(2, this.retry++)) + Math.floor(Math.random() * 500)
      setTimeout(() => this.connect(), backoff)
    }
    ws.onerror = () => { try { ws.close() } catch {} }
  }
}


