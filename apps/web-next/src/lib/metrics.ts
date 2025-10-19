export async function fetchMetrics(url="/api/public/metrics"){
  async function once(){
    const ctrl = new AbortController(); const t = setTimeout(()=>ctrl.abort(), 3000)
    try{ const txt = await fetch(url, { signal: ctrl.signal }).then(r=>r.text()); return txt } finally{ clearTimeout(t) }
  }
  try{ return await once() } catch { try{ return await once() } catch { return "# NA" } }
}

export function parseSummary(txt:string){
  const get = (re:RegExp)=>{ const m = txt.match(re); return m? Number(m[1]) : NaN }
  return {
    p95: get(/p95[^\n]*\n([0-9\.]+)/),
    error_rate: get(/error_rate[^\n]*\n([0-9\.]+)/),
    ws_reconnect_total: get(/ws_reconnect_total[^\n]*\n([0-9\.]+)/),
    cache_hit_rate: get(/cache_hit_rate[^\n]*\n([0-9\.]+)/),
  }
}


