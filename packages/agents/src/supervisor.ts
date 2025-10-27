export const supervisor = {
  async start(spec: { symbol:string; exchange:string; tf:string; mode?:'paper'|'live' }) {
    return { ok: true, spec }
  },
  async stop(spec: { symbol:string; exchange:string }) {
    return { ok: true, spec }
  }
} 