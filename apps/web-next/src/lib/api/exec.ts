const base = String((process.env.NEXT_PUBLIC_EXECUTOR_BASE || process.env.EXECUTOR_BASE || "http://localhost:4001")).replace(/\/$/,"")

async function jsonFetch(path:string, body:any){
  try{
    const r = await fetch(`${base}${path}`, { method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify(body||{}) });
    if(!r.ok) throw new Error(`HTTP ${r.status}`)
    return await r.json()
  }catch(e){ return { error: (e as Error).message, metrics:{}, equity:[] } }
}

export const backtest = (p:{dryRun?:boolean}) => jsonFetch("/api/public/backtest", { ...p })
export const optimize = (p:{dryRun?:boolean}) => jsonFetch("/api/public/optimize", { ...p })


