"use client";
import { useEffect, useMemo, useState } from "react";
import { StrategySchema } from "@/lib/strategySchema";
import dynamic from "next/dynamic";
const MiniPositions = dynamic(()=>import("@/components/strategy/MiniPositions"),{ssr:false});
const MiniFills = dynamic(()=>import("@/components/strategy/MiniFills"),{ssr:false});
const SSEQualityCard = dynamic(() => import('@/components/sse/SSEQualityCard'), { ssr: false });
type EquityPoint = [number, number];

const api = (p:string)=> p;

function useSSE(url?:string){
  const [events,setEvents]=useState<any[]>([]);
  useEffect(()=>{
    if(!url) return;
    const es = new EventSource(url + (url.includes("?")?"&":"?") + "_ts="+Date.now());
    es.onmessage = (e)=>{
      try { setEvents(prev=>[...prev, JSON.parse(e.data)]); }
      catch { /* ignore parse errors (hb/progress raw) */ }
    };
    es.onerror = ()=> es.close();
    return ()=> es.close();
  },[url]);
  return events;
}

function MiniEquity({ data }:{ data: EquityPoint[] }){
  if(!data?.length) return <div className="text-xs text-neutral-500">Grafik için veri bekleniyor…</div>;
  const W=380, H=120, pad=10;
  const xs = data.map(d=>d[0]), ys = data.map(d=>d[1]);
  const xmin = Math.min(...xs), xmax = Math.max(...xs), ymin = Math.min(...ys), ymax = Math.max(...ys);
  const nx = (t:number)=> pad + (W-2*pad) * (t - xmin) / Math.max(1, (xmax - xmin));
  const ny = (v:number)=> H - pad - (H-2*pad) * (v - ymin) / Math.max(1, (ymax - ymin));
  const d = data.map((p,i)=> (i? "L":"M") + nx(p[0])+","+ny(p[1])).join(" ");
  return (
    <svg width={W} height={H} aria-label="Equity">
      <rect x="0" y="0" width={W} height={H} fill="none" />
      <path d={d} fill="none" stroke="currentColor" />
    </svg>
  );
}

function MetricCard({label,value}:{label:string,value:unknown}){
  return (
    <div style={{border:"1px solid #e5e7eb", borderRadius:12, padding:12}}>
      <div style={{fontSize:12, color:"#6b7280"}}>{label}</div>
      <div style={{fontSize:18, fontWeight:600}}>{value as any}</div>
    </div>
  );
}

export default function StrategyLab(){
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [interval, setInterval_] = useState("1m");
  const [strategyJson, setStrategyJson] = useState<string>(
    '{"version":"v1","name":"draft","params":{"emaFast":9,"emaSlow":21},"risk":{"leverage":3,"notionalPct":0.2},"entries":[{"when":"emaFast>emaSlow"}],"exits":{"tpPct":0.02,"slPct":0.01}}'
  );

  const [btJob,setBtJob]=useState<string|undefined>();
  const [btURL,setBtURL]=useState<string|undefined>();
  const events = useSSE(btURL);

  const equity: EquityPoint[] = useMemo(()=>{
    return events.filter(e=>e?.event==="equityPoint").map((e:any)=>[e.t,e.v]);
  },[events]);

  const done = useMemo(()=> (events as any).findLast?.((e:any)=>e?.event==="done") ?? events.find((e:any)=>e?.event==="done"), [events]);
  const metrics = (done as any)?.result?.metrics;

  async function startBacktest(){
    let parsed: any;
    try { parsed = JSON.parse(strategyJson); }
    catch { alert("Geçersiz JSON. Lütfen formatı düzeltin."); return; }
    const valid = StrategySchema.safeParse(parsed);
    if (!valid.success) { alert("Strateji JSON doğrulaması başarısız. Alanları kontrol edin."); return; }
    const body = { strategy: valid.data, symbol, interval };
    const r = await fetch(api("/api/backtest/jobs"),{
      method:"POST", headers:{"content-type":"application/json"}, body: JSON.stringify(body)
    });
    const j = await r.json();
    setBtJob(j.jobId);
    setBtURL(api(`/api/backtest/stream/${j.jobId}`));
  }

  function fmtPct(x?:number){ return (x===undefined)?"—": (x*100).toFixed(2)+"%"; }

  const csvURL = btJob ? api(`/api/backtest/export/${btJob}?fmt=csv`) : undefined;
  const jsonURL = btJob ? api(`/api/backtest/export/${btJob}?fmt=json`) : undefined;

  return (
    <div style={{display:"grid", gridTemplateColumns:"320px 1fr 420px", gap:16, padding:16}}>
      <section>
        <h3>SSE Quality</h3>
        <SSEQualityCard />
      </section>
      
      <section>
        <h3>Sihirbaz</h3>
        <label>Sembol</label><input value={symbol} onChange={e=>setSymbol(e.target.value)} />
        <label>Interval</label><input value={interval} onChange={e=>setInterval_(e.target.value)} />
        <div style={{marginTop:8, display:"flex", gap:8}}>
          <button onClick={startBacktest}>Backtest (Job)</button>
          {csvURL && <a href={csvURL} target="_blank" rel="noreferrer"><button>Export CSV</button></a>}
          {jsonURL && <a href={jsonURL} target="_blank" rel="noreferrer"><button>Export JSON</button></a>}
        </div>
      </section>

      <section>
        <h3>Strateji JSON v1</h3>
        <textarea value={strategyJson} onChange={e=>setStrategyJson(e.target.value)} rows={22} style={{width:"100%",fontFamily:"monospace"}}/>
      </section>

      <section>
        <h3>Sonuçlar</h3>
        <MiniEquity data={equity}/>
        <div style={{display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8, marginTop:8}}>
          <MetricCard label="PnL" value={fmtPct(metrics?.pnlPct)} />
          <MetricCard label="MDD" value={fmtPct(metrics?.mddPct)} />
          <MetricCard label="Sharpe" value={metrics?.sharpe?.toFixed?.(2) ?? "—"} />
          <MetricCard label="WinRate" value={fmtPct(metrics?.winRate)} />
          <MetricCard label="Trades" value={metrics?.trades ?? "—"} />
          <MetricCard label="ProfitFactor" value={metrics?.profitFactor?.toFixed?.(2) ?? "—"} />
        </div>
        <div style={{marginTop:12, fontSize:12, color:"#6b7280"}}>
          Job: {btJob ?? "—"}
        </div>
        <pre style={{whiteSpace:"pre-wrap",maxHeight:240,overflow:"auto", marginTop:8}}>
          {events.map((e,i)=>JSON.stringify(e)).join("\n")}
        </pre>
      </section>
      
      <section>
        <h3>Mini Paneller</h3>
        <div className="space-y-3">
          <MiniPositions />
          <MiniFills />
        </div>
      </section>
    </div>
  );
}


