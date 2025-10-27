"use client";

import { useMemo, useState } from "react";
import { API_BASE, API_TOKEN } from "@/lib/env";
import QuickFuturesCard from "@/components/ops/QuickFuturesCard";

type RunResult = { ok?: boolean; p95_ms?: number; success_rate?: number; evidence_dir?: string; [k:string]: any };
type ConfirmResult = { ok?: boolean; reason?: string; [k:string]: any };
type RiskParams = {
  maxNotionalPerTradeUSDT: number;
  maxLeverage: number;
  maxDailyDrawdownPct: number;
  requireStopLoss: boolean;
  killSwitch: boolean;
};
const defaultRisk: RiskParams = { maxNotionalPerTradeUSDT: 200, maxLeverage: 5, maxDailyDrawdownPct: 3, requireStopLoss: true, killSwitch: true };

async function postJSON(path: string, body: any) {
  const res = await fetch(`${API_BASE || ""}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": API_TOKEN ? `Bearer ${API_TOKEN}` : ""
    },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(()=> ({}));
  return { status: res.status, data };
}

export default function OpsConsole() {
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [samples, setSamples] = useState(20);
  const [risk, setRisk] = useState<RiskParams>(defaultRisk);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult|undefined>();
  const [confirming, setConfirming] = useState(false);
  const [confirmRes, setConfirmRes] = useState<ConfirmResult|undefined>();
  const [alertsBusy, setAlertsBusy] = useState(false);
  const [json, setJson] = useState("");
  const [bt, setBt] = useState<any>();
  const [grid, setGrid] = useState<any>();
  const [liveNotional, setLiveNotional] = useState(20);
  const [liveLev, setLiveLev] = useState(5);
  const [liveSl, setLiveSl] = useState(1.5);
  const [liveTp, setLiveTp] = useState(2.0);
  const [conn, setConn] = useState<any>(null);

  const canConfirm = useMemo(() => {
    if (!result?.p95_ms || !result?.success_rate) return false;
    return result.p95_ms < 1000 && result.success_rate >= 0.98;
  }, [result]);

  async function runCanary() {
    setRunning(true);
    setResult(undefined);
    const body = {
      action: "/canary/run",
      params: {
        scope: "binance:futures:testnet",
        symbols: [symbol],
        samples,
        checks: ["place_order","cancel_order","ack_latency","ws_stream"],
        strategy: { name:"ema_atr_v0", ema_fast:9, ema_slow:21, atr:14, tp_atr:2, sl_atr:1.5, risk_notional_pct:0.01 }
      },
      dryRun: true,
      confirm_required: false,
      reason: "Testnet dry-run: emir akışı + P95 ölçümü"
    };
    const { status, data } = await postJSON("/api/canary/run", body);
    setRunning(false);
    setResult({ ok: status===200, ...data });
  }
  async function testConnections(){
    const pub  = await postJSON("/api/binance/ping", {});
    const auth = await postJSON("/api/binance/account", {});
    setConn({ pub: pub?.data, auth: auth?.data });
  }

  async function confirmCanary() {
    setConfirming(true);
    const body = {
      action: "/canary/confirm",
      params: {
        scope: "binance:futures",
        targets: ["place_order","cancel_order","ack_latency"],
        criteria: { p95_ms_max: 1000, success_rate_min: 0.98, ts_errors_max: 15, auth: "token" }
      },
      dryRun: false,
      confirm_required: true,
      reason: "Runtime GREEN kanıtı; canlı emir akışı için onay"
    };
    const { status, data } = await postJSON("/api/canary/confirm", body);
    setConfirming(false);
    setConfirmRes({ ok: status===200, ...data });
  }

  async function applyRisk() {
    const body = {
      action: "/risk/threshold.set",
      params: { exchange:"binance:futures", ...risk },
      dryRun: false,
      confirm_required: true,
      reason: "İlk canlı devreye alım için muhafazakâr guardrails"
    };
    const { status } = await postJSON("/api/risk/threshold/set", body);
    alert(status===200 ? "Risk thresholds applied (pending approval)" : "Failed to apply risk thresholds");
  }

  async function createAlerts() {
    setAlertsBusy(true);
    const body = {
      action: "/alerts/create",
      params: [
        { kind:"price", symbol, op:"lt", value:58000, ttl:"1d" },
        { kind:"metric", name:"ack_p95_ms", op:"gt", value:800, ttl:"24h" }
      ],
      dryRun: false,
      confirm_required: false,
      reason: "Risk ve gecikme için erken uyarı"
    };
    const { status } = await postJSON("/api/alerts/create", body);
    setAlertsBusy(false);
    alert(status===200 ? "Alerts created" : "Alert creation failed");
  }

  async function backtestJson(){
    let strat; try { strat = JSON.parse(json) } catch { alert("JSON geçersiz"); return; }
    const { status, data } = await postJSON("/api/backtest/run", { symbol, interval:"1m", limit:1000, strategy: strat });
    if (status===200) setBt(data); else alert("Backtest başarısız");
  }
  async function gridOptimize(){
    const ranges = { fast:[7,9,12], slow:[21,26,30], sl_atr:[1.3,1.5,1.8], tp_atr:[1.8,2.0,2.5] };
    const { status, data } = await postJSON("/api/optimization/grid", { symbol, interval:"1m", ...ranges });
    if (status===200) { setGrid(data); if (data?.top5?.[0]?.strat) setJson(JSON.stringify({ name:"ema_atr_opt", ...data.top5[0].strat }, null, 2)); }
  }
  async function getAI(){
    const { data } = await postJSON("/api/advisor/suggest", {
      task:"generate_and_rank_strategies", universe:[`${symbol}-PERP`],
      templates:["ema_cross+atr_sl_tp"], constraints:{ max_leverage:5, notional_pct:0.01 },
      objective:"maximize_sharpe_subject_to_dd3pct_day", deliver:["strategy_json"]
    });
    if (data?.strategy_json) setJson(JSON.stringify(data.strategy_json, null, 2));
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">⚡ Ops Console</h1>

      {/* AI Quickstart Card */}
      {process.env.NEXT_PUBLIC_AI_QUICKSTART === 'true' && (
        <QuickFuturesCard />
      )}

      {/* Canary Run */}
      <section className="grid gap-4 rounded-2xl border p-4">
        <h2 className="text-xl font-medium">Canary · Dry-Run (Testnet)</h2>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2">Sembol
            <input className="input input-bordered px-3 py-2 rounded-md border" value={symbol} onChange={e=>setSymbol(e.target.value.toUpperCase())}/>
          </label>
          <label className="flex items-center gap-2">Örneklem
            <input type="number" min={5} max={200} className="input input-bordered px-3 py-2 rounded-md border w-24" value={samples} onChange={e=>setSamples(parseInt(e.target.value||"20"))}/>
          </label>
          <button onClick={runCanary} disabled={running} className="px-4 py-2 rounded-lg bg-black text-white disabled:opacity-50">
            {running ? "Çalışıyor…" : "Canary Başlat"}
          </button>
        </div>
        {result && (
          <div className="text-sm grid md:grid-cols-3 gap-2">
            <div className="rounded-lg bg-gray-50/5 border border-slate-800 p-3">p95: <b>{result.p95_ms ?? "—"}</b> ms</div>
            <div className="rounded-lg bg-gray-50/5 border border-slate-800 p-3">success: <b>{result.success_rate ? Math.round(result.success_rate*100) : 0}%</b></div>
            <div className="rounded-lg bg-gray-50/5 border border-slate-800 p-3 truncate">evidence: <b title={result.evidence_dir}>{result.evidence_dir || "—"}</b></div>
          </div>
        )}
      </section>

      {/* Canary Confirm */}
      <section className="grid gap-4 rounded-2xl border p-4">
        <h2 className="text-xl font-medium">Canary · Confirm (Live)</h2>
        <div className="flex items-center gap-3">
          <button onClick={confirmCanary} disabled={!canConfirm || confirming} className="px-4 py-2 rounded-lg bg-emerald-600 text-white disabled:opacity-50">
            {confirming ? "Onaylanıyor…" : canConfirm ? "Onayla ve Canlıya Geç" : "Kriter bekleniyor"}
          </button>
          <div className="text-xs text-slate-400">Kriter: p95&lt;1000ms · success≥98%</div>
        </div>
        {confirmRes && (
          <div className="text-sm rounded-lg bg-gray-50/5 border border-slate-800 p-3">confirm: <b>{confirmRes.ok ? "OK" : "FAILED"}</b> · {confirmRes.reason || ""}</div>
        )}
      </section>

      {/* Risk Guardrails */}
      <section className="grid gap-4 rounded-2xl border p-4">
        <h2 className="text-xl font-medium">Risk Guardrails</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          <label className="text-sm">Max Notional (USDT)
            <input type="number" className="w-full border rounded-md px-3 py-2 bg-transparent" value={risk.maxNotionalPerTradeUSDT} onChange={e=>setRisk(r=>({...r, maxNotionalPerTradeUSDT: Number(e.target.value)}))}/>
          </label>
          <label className="text-sm">Max Leverage
            <input type="number" className="w-full border rounded-md px-3 py-2 bg-transparent" value={risk.maxLeverage} onChange={e=>setRisk(r=>({...r, maxLeverage: Number(e.target.value)}))}/>
          </label>
          <label className="text-sm">Günlük Drawdown % (max)
            <input type="number" className="w-full border rounded-md px-3 py-2 bg-transparent" value={risk.maxDailyDrawdownPct} onChange={e=>setRisk(r=>({...r, maxDailyDrawdownPct: Number(e.target.value)}))}/>
          </label>
          <label className="text-sm flex items-center gap-2">
            <input type="checkbox" checked={risk.requireStopLoss} onChange={e=>setRisk(r=>({...r, requireStopLoss: e.target.checked}))}/>
            Zorunlu Stop Loss
          </label>
          <label className="text-sm flex items-center gap-2">
            <input type="checkbox" checked={risk.killSwitch} onChange={e=>setRisk(r=>({...r, killSwitch: e.target.checked}))}/>
            Kill Switch
          </label>
        </div>
        <button onClick={applyRisk} className="px-4 py-2 rounded-lg bg-indigo-600 text-white w-fit">Guardrails Uygula (onay gerekir)</button>
      </section>

      {/* Alerts */}
      <section className="grid gap-4 rounded-2xl border p-4">
        <h2 className="text-xl font-medium">Uyarılar</h2>
        <div className="flex items-center gap-3">
          <button onClick={createAlerts} disabled={alertsBusy} className="px-4 py-2 rounded-lg bg-amber-600 text-white disabled:opacity-50">
            {alertsBusy ? "Oluşturuluyor…" : "Fiyat & Latency Uyarıları Oluştur"}
          </button>
          <div className="text-xs text-slate-400">{symbol} &lt; 58k · ACK p95 &gt; 800ms</div>
        </div>
      </section>

      {/* Connection Panel */}
      <section className="grid gap-3 rounded-2xl border p-4">
        <h2 className="text-lg font-medium">Bağlantı Durumu</h2>
        <div className="flex gap-3">
          <button onClick={testConnections} className="px-4 py-2 rounded-lg bg-slate-700 text-white">Bağlantıları Test Et</button>
        </div>
        {conn && (
          <div className="grid md:grid-cols-2 gap-3 text-sm">
            <div className="rounded bg-gray-50 p-3">
              <div className="font-semibold">Public Ping</div>
              <div>Base: {conn.pub?.base}</div>
              <div>RTT: {conn.pub?.rtt_ms} ms</div>
              <div>OK: {String(conn.pub?.ok)}</div>
            </div>
            <div className="rounded bg-gray-50 p-3">
              <div className="font-semibold">Signed Account</div>
              <div>Base: {conn.auth?.base}</div>
              <div>OK: {String(conn.auth?.ok)}</div>
              <div className="text-xs">Assets: {JSON.stringify(conn.auth?.assets ?? []).slice(0,120)}{(conn.auth?.assets?.length>0)?" …":""}</div>
            </div>
          </div>
        )}
      </section>

      {/* Strategy Lab */}
      <section className="grid gap-4 rounded-2xl border p-4">
        <h2 className="text-xl font-medium">Strateji Lab (AI + Backtest + Optimize)</h2>
        <textarea className="w-full h-48 border rounded-md p-2 font-mono text-sm"
          placeholder='{"name":"ema_atr_v1","ema_fast":9,"ema_slow":21,"atr":14,"sl_atr":1.5,"tp_atr":2}'
          value={json} onChange={e=>setJson(e.target.value)} />
        <div className="flex flex-wrap gap-3">
          <button onClick={getAI} className="px-4 py-2 rounded-lg bg-slate-700 text-white">AI’den Öneri Al</button>
          <button onClick={backtestJson} className="px-4 py-2 rounded-lg bg-emerald-700 text-white">Backtest (Binance history)</button>
          <button onClick={gridOptimize} className="px-4 py-2 rounded-lg bg-indigo-700 text-white">Grid Optimize</button>
        </div>
        {bt?.metrics && (
          <div className="text-sm grid md:grid-cols-5 gap-2 mt-2">
            <div className="rounded bg-gray-50 p-2">Trades: <b>{bt.metrics.trades}</b></div>
            <div className="rounded bg-gray-50 p-2">Winrate: <b>{(bt.metrics.winrate*100).toFixed(1)}%</b></div>
            <div className="rounded bg-gray-50 p-2">PnL: <b>{bt.metrics.pnlPct.toFixed(2)}%</b></div>
            <div className="rounded bg-gray-50 p-2">MaxDD: <b>{(bt.metrics.mdd*100).toFixed(1)}%</b></div>
            <div className="rounded bg-gray-50 p-2">Sharpe*: <b>{bt.metrics.sharpe.toFixed(2)}</b></div>
          </div>
        )}
        {grid?.top5 && (
          <div className="mt-2">
            <div className="text-sm mb-1">Top-5 kombinasyon (Sharpe’a göre):</div>
            <ul className="text-xs list-disc pl-5">
              {grid.top5.map((r: any, i: number) => (
                <li key={i}>#{i+1} f{r.strat.ema_fast}/s{r.strat.ema_slow} · SLx{r.strat.sl_atr} · TPx{r.strat.tp_atr} · Sharpe {r.metrics.sharpe.toFixed(2)} · Win {(r.metrics.winrate*100).toFixed(1)}% · PnL {r.metrics.pnlPct.toFixed(2)}%</li>
              ))}
            </ul>
          </div>
        )}

        {/* Go Live (Bracket) */}
        <div className="mt-4 grid sm:grid-cols-2 md:grid-cols-4 gap-3">
          <label className="text-sm">Notional (USDT)
            <input type="number" className="w-full border rounded-md px-3 py-2 bg-transparent" value={liveNotional} onChange={e=>setLiveNotional(Number(e.target.value))}/>
          </label>
          <label className="text-sm">Leverage
            <input type="number" className="w-full border rounded-md px-3 py-2 bg-transparent" value={liveLev} onChange={e=>setLiveLev(Number(e.target.value))}/>
          </label>
          <label className="text-sm">SL × ATR
            <input type="number" step="0.1" className="w-full border rounded-md px-3 py-2 bg-transparent" value={liveSl} onChange={e=>setLiveSl(Number(e.target.value))}/>
          </label>
          <label className="text-sm">TP × ATR
            <input type="number" step="0.1" className="w-full border rounded-md px-3 py-2 bg-transparent" value={liveTp} onChange={e=>setLiveTp(Number(e.target.value))}/>
          </label>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={async ()=>{
              const body = {
                action: "/live/bracket",
                params: { symbol, side: "BUY", notionalUSDT: liveNotional, leverage: liveLev, interval: "1m", atr_period: 14, sl_atr: liveSl, tp_atr: liveTp, reduceOnly: false },
                dryRun: false,
                confirm_required: true,
                reason: "Mikro canlı bracket smoke: market giriş + closePosition SL/TP"
              };
              const { status, data } = await postJSON('/api/live/bracket', body);
              alert(status===200 ? 'Bracket order gönderildi (pending/exec)' : 'Bracket gönderilemedi');
            }}
            className="px-4 py-2 rounded-lg bg-rose-700 text-white"
          >Go Live (Bracket)</button>
          <div className="text-xs text-slate-400">Onaylı hat: kill-switch ve guardrails aktif</div>
        </div>
      </section>
    </div>
  );
}


