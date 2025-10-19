'use client'

type Listener = (msg: any) => void

export class BtcturkMockWs {
  private timer?: number
  private listeners: Set<Listener> = new Set()
  private running = false

  constructor(private symbols: string[]) {}

  start() {
    if (this.running) return
    this.running = true
    const tick = () => {
      const now = Date.now()
      for (const s of this.symbols) {
        const price = 100 + Math.sin(now / 2000) * 5 + Math.random()
        const msg = { s, p: Number(price.toFixed(2)), t: now }
        for (const l of this.listeners) l(msg)
      }
      this.timer = window.setTimeout(tick, 1000)
    }
    tick()
  }

  stop() {
    this.running = false
    if (this.timer) window.clearTimeout(this.timer)
  }

  on(fn: Listener) { this.listeners.add(fn); return () => this.listeners.delete(fn) }
}


