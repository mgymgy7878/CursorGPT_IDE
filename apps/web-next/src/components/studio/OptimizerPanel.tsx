"use client";
import { useMemo, useRef, useState } from "react";
import { saveBestParams } from "./StudioBus";
import ProgressBar from "@/components/optimizer/ProgressBar";
import { useOptimizerProgress } from "@/features/optimizer/useOptimizerProgress";

type RunBody = {
  symbol: string;
  timeframe: string;
  start: string;
  end: string;
  params?: { emaFast?: number; emaSlow?: number };
};

type ResultRow = {
  emaFast: number;
  emaSlow: number;
  score: number;
  raw: any;
};

export default function OptimizerPanel() {
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [timeframe, setTimeframe] = useState("1h");
  const [start, setStart] = useState("2024-01-01");
  const [end, setEnd] = useState("2024-03-01");

  const [fastFrom, setFastFrom] = useState(5);
  const [fastTo, setFastTo] = useState(25);
  const [fastStep, setFastStep] = useState(5);
  const [slowFrom, setSlowFrom] = useState(30);
  const [slowTo, setSlowTo] = useState(120);
  const [slowStep, setSlowStep] = useState(10);
  const [concurrency, setConcurrency] = useState(4);
  const [topK, setTopK] = useState(10);

  const [running, setRunning] = useState(false);
  const [useExecutor, setUseExecutor] = useState(true);
  const [progress, setProgress] = useState(0);
  const [rows, setRows] = useState<ResultRow[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const [method,setMethod] = useState<"grid"|"bayesian"|"genetic">("grid");
  const [budget,setBudget] = useState<number>(200);
  const [earlyStop,setEarlyStop] = useState<boolean>(true);
  const [evals,setEvals] = useState<number>(0);
  const [pct,setPct] = useState<number>(0);
  const estimTimerRef = useRef<any>(null);
  const { state, start: startProgress, stop: stopProgress } = useOptimizerProgress();

  function stopTimer(){ if(estimTimerRef.current){ clearInterval(estimTimerRef.current); estimTimerRef.current = null; } }
  function startEstimate(){
    stopTimer();
    // Tahmini ilerleme: 0→95 arası, yanıt gelince 100
    estimTimerRef.current = setInterval(()=> setPct(p => (p<95? p+1 : p)), 500);
  }
  async function poll(jobId: string){
    try{
      const p = { action:"optimizer.progress", params:{ jobId }, dryRun:true, confirm_required:false, reason:"studio progress" };
      const r = await fetch("/api/advisor/progress", { method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify(p) }).catch(()=>null);
      if(!r || !r.ok) return;
      const j = await r.json().catch(()=>null);
      if(typeof j?.evals === "number") setEvals(j.evals);
      if(typeof j?.budget === "number" && j.budget>0){ setPct(Math.min(100, Math.round((j.evals||0)*100/j.budget))); }
      if(typeof j?.progress === "number"){ setProgress(Math.round(j.progress*100)); }
    }catch{}
  }

  const grid = useMemo(() => {
    const out: { f: number; s: number }[] = [];
    for (let f = fastFrom; f <= fastTo; f += fastStep) {
      for (let s = Math.max(f + 1, slowFrom); s <= slowTo; s += slowStep) {
        out.push({ f, s });
      }
    }
    return out;
  }, [fastFrom, fastTo, fastStep, slowFrom, slowTo, slowStep]);

  function scoreFrom(resp: any): number {
    const m = resp?.metrics ?? resp?.result ?? resp;
    const candidates = [m?.sharpe, m?.Sharpe, m?.pnl, m?.PNL, m?.netProfit, m?.score].filter((x: any) => typeof x === "number");
    if (candidates.length > 0) return candidates[0] as number;
    return 0;
  }

  async function runOne(f: number, s: number, signal: AbortSignal) {
    const body: RunBody = { symbol, timeframe, start, end, params: { emaFast: f, emaSlow: s } };
    const r = await fetch("/api/backtest/run", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal });
    const j = await r.json().catch(() => ({}));
    return { emaFast: f, emaSlow: s, score: scoreFrom(j), raw: j } as ResultRow;
  }

  async function runPool() {
    if (running) return;
    setRunning(true);
    setRows([]);
    setProgress(0);
    // Executor optimizer varsa tek çağrıda dene
    if (useExecutor) {
      try {
        const payload = {
          action: method === "grid" ? "optimizer.grid" : "optimizer.search",
          params: {
            symbol, timeframe, start, end,
            emaFast: { from: fastFrom, to: fastTo, step: fastStep },
            emaSlow: { from: slowFrom, to: slowTo, step: slowStep },
            topK,
            method,
            budget,
            earlyStop
          },
          dryRun: true,
          confirm_required: false,
          reason: "StrategyStudio Optimizer"
        };
        // Tahmini ilerlemeyi başlat
        setPct(0); setEvals(0); startEstimate();
        const r = await fetch("/api/advisor/suggest", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
        const j = await r.json().catch(()=> ({}));
        if(typeof (j as any)?.evals === "number") setEvals((j as any).evals);
        if(typeof (j as any)?.budget === "number" && (j as any).budget>0){
          const p = Math.min(100, Math.round(((j as any).evals||0)*100/(j as any).budget));
          setPct(p);
        }
        const arr = (j?.results ?? j?.top ?? j?.data ?? []) as any[];
        const mapped = arr.map((x:any, i:number)=>({
          emaFast: x.emaFast ?? x.fast ?? x.f ?? i,
          emaSlow: x.emaSlow ?? x.slow ?? x.s ?? i,
          score: Number(x.score ?? x.Sharpe ?? x.sharpe ?? x.pnl ?? x.netProfit ?? 0),
          raw: x
        }));
        setRows(mapped.slice(0, topK));
        // jobId geldiyse kısa süre poll (30s)
        if((j as any)?.jobId){ const id = String((j as any).jobId); const t = setInterval(()=>poll(id), 1500); setTimeout(()=>clearInterval(t), 30000); }
        // SSE/poll: jobId varsa anlık ilerlemeyi başlat
        if((j as any)?.jobId){ try{ startProgress(String((j as any).jobId)); }catch{} }
        setProgress(100); setPct(100); stopTimer();
      } catch {
        setUseExecutor(false);
      } finally {
        setRunning(false);
      }
      return;
    }
    const total = grid.length;
    const ac = new AbortController();
    abortRef.current = ac;
    let idx = 0;
    const bucket: ResultRow[] = [];

    async function worker() {
      while (true) {
        const my = idx++;
        if (my >= total) break;
        const g = grid[my];
        try {
          const res = await runOne(g.f, g.s, ac.signal);
          bucket.push(res);
        } catch {
          bucket.push({ emaFast: g.f, emaSlow: g.s, score: Number.NEGATIVE_INFINITY, raw: { error: true } });
        } finally {
          setProgress((p) => Math.min(100, Math.round(((my + 1) / total) * 100)));
        }
      }
    }

    const workers = Array.from({ length: Math.max(1, concurrency) }, () => worker());
    await Promise.all(workers);

    const best = bucket
      .filter((r) => Number.isFinite(r.score))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
    setRows(best);
    setRunning(false);
    abortRef.current = null;
  }

  function cancel() {
    abortRef.current?.abort();
    setRunning(false);
  }

  return (
    <div className="card p-4 space-y-4">
      <h2 className="text-xl font-semibold">Optimize</h2>
      <label className="muted flex items-center gap-2">
        <input type="checkbox" checked={useExecutor} onChange={e=>setUseExecutor(e.target.checked)} />
        Executor optimizer’ını kullan (hızlı tek çağrı). Hata olursa otomatik local fallback.
      </label>

      <div className="grid md:grid-cols-3 gap-2">
        <label className="flex items-center gap-2">Yöntem
          <select className="inp" value={method} onChange={e=>setMethod(e.target.value as any)}>
            <option value="grid">Grid</option>
            <option value="bayesian">Bayesian</option>
            <option value="genetic">Genetic</option>
          </select>
        </label>
        <label className="flex items-center gap-2">Budget
          <input className="inp w-24" type="number" value={budget} onChange={e=>setBudget(Number(e.target.value))} />
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={earlyStop} onChange={e=>setEarlyStop(e.target.checked)} />Early-stop
        </label>
      </div>

      {/* İlerleme çubuğu (gerçek varsa ona göre, yoksa tahmini) */}
      {(progress>0 && progress<100) && (
        <ProgressBar
          pct={state?.pct ?? Math.max(pct, progress)}
          status={state?.status ?? 'running'}
          best={state?.best}
          etaSecs={state?.etaSecs}
          etaUncertain={state?.etaUncertain}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="card-sub p-3">
          <div className="form-row">
            <label>Symbol</label>
            <input className="inp" value={symbol} onChange={e=>setSymbol(e.target.value)} />
          </div>
          <div className="form-row">
            <label>Timeframe</label>
            <input className="inp" value={timeframe} onChange={e=>setTimeframe(e.target.value)} />
          </div>
          <div className="form-row">
            <label>Start</label>
            <input className="inp" value={start} onChange={e=>setStart(e.target.value)} />
          </div>
          <div className="form-row">
            <label>End</label>
            <input className="inp" value={end} onChange={e=>setEnd(e.target.value)} />
          </div>
        </div>
        <div className="card-sub p-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="form-row"><label>Fast from</label><input type="number" className="inp" value={fastFrom} onChange={e=>setFastFrom(+e.target.value)} /></div>
            <div className="form-row"><label>to</label><input type="number" className="inp" value={fastTo} onChange={e=>setFastTo(+e.target.value)} /></div>
            <div className="form-row"><label>step</label><input type="number" className="inp" value={fastStep} onChange={e=>setFastStep(+e.target.value)} /></div>
            <div className="form-row"><label>Slow from</label><input type="number" className="inp" value={slowFrom} onChange={e=>setSlowFrom(+e.target.value)} /></div>
            <div className="form-row"><label>to</label><input type="number" className="inp" value={slowTo} onChange={e=>setSlowTo(+e.target.value)} /></div>
            <div className="form-row"><label>step</label><input type="number" className="inp" value={slowStep} onChange={e=>setSlowStep(+e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="form-row"><label>Concurrency</label><input type="number" className="inp" value={concurrency} onChange={e=>setConcurrency(Math.max(1,+e.target.value))} /></div>
            <div className="form-row"><label>Top-K</label><input type="number" className="inp" value={topK} onChange={e=>setTopK(Math.max(1,+e.target.value))} /></div>
            <div className="form-row flex items-end">
              {!running ? (
                <button className="btn" onClick={runPool}>Optimize Et</button>
              ) : (
                <button className="btn-danger" onClick={cancel}>İptal</button>
              )}
            </div>
          </div>
        </div>
      </div>

      {!useExecutor && (
        <div>
          <div className="progress"><div className="progress-bar" style={{ width: `${progress}%` }} /></div>
          <div className="muted mt-1">{progress}% tamamlandı — {grid.length} deneme</div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="tbl">
          <thead><tr><th>#</th><th>EMA Fast</th><th>EMA Slow</th><th>Score</th></tr></thead>
          <tbody>
            {rows.map((r,i)=>(
              <tr key={`${r.emaFast}-${r.emaSlow}`}>
                <td>{i+1}</td><td>{r.emaFast}</td><td>{r.emaSlow}</td><td>{Number.isFinite(r.score)? r.score.toFixed(4): "—"}</td>
              </tr>
            ))}
            {rows.length===0 && <tr><td colSpan={4} className="muted">Henüz sonuç yok. Optimize Et ile başlayın.</td></tr>}
          </tbody>
        </table>
        {rows.length>0 && (
          <div className="mt-3 flex gap-2">
            <button className="btn" onClick={()=>{
              const best = rows[0];
              saveBestParams({ emaFast: best.emaFast, emaSlow: best.emaSlow, score: best.score, symbol, timeframe, start, end });
              alert(`Best param uygulandı: fast=${best.emaFast} slow=${best.emaSlow}`);
            }}>Best’i Uygula</button>
          </div>
        )}
      </div>
    </div>
  );
}


