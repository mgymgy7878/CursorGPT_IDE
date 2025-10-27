"use client";
import { useEffect, useMemo, useState } from "react";
import { AutoRefresh } from "@/components/canary/AutoRefresh";

type CanaryResp = {
  nonce: string;
  status: string;
  step: number;
  observed_signals: number;
  decision: string;
  gates: Record<string, number | "unknown">;
  evidence: { root: string; plan: string; metrics: string; latency: string; audit: string };
  reason?: string;
};
type NonceItem = {
  nonce: string; ts: string; decision: string; status: string; hasLatency: boolean;
  paths: { plan: string; latency: string; confirm: string; live_plan: string };
};

export default function CanaryPage() {
  // ——— State
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<CanaryResp | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [indexCsv, setIndexCsv] = useState<string>("");
  const [token, setToken] = useState<string>(() => (typeof window !== "undefined" ? localStorage.getItem("confirm_token") || "" : ""));
  const [role, setRole] = useState<string>(() => (typeof window !== "undefined" ? localStorage.getItem("user_role") || "viewer" : "viewer"));
  const [qty, setQty] = useState<number>(0.00005);
  const [symbol, setSymbol] = useState<string>("BTCUSDT");
  const [side, setSide] = useState<"BUY"|"SELL">("BUY");
  const [busyConfirm, setBusyConfirm] = useState(false);
  const [ack, setAck] = useState(false);
  const [showApply, setShowApply] = useState(false);

  // NONCE & Evidence
  const [nonces, setNonces] = useState<NonceItem[]>([]);
  const [nonceSel, setNonceSel] = useState<string>("");
  const [evidence, setEvidence] = useState<{ nonce: string; plan?: any; latency?: any; confirm?: any; live_plan?: any; live_apply?: any } | null>(null);

  // Policy
  const [policy, setPolicy] = useState<{ killSwitch:boolean; minNotional:number; priceHint:number; symbolDefault:string; tinyQtyDefault:number; source?:string }|null>(null);
  async function loadPolicy() {
    const r = await fetch("/api/public/canary/policy", { cache: "no-store" });
    if (r.ok) setPolicy(await r.json());
  }
 
  // Metrics summary
  const [metrics, setMetrics] = useState<{ totals: { apply_total:number; idem_duplicate_total:number; circuit_tripped_total:number }, blocked: Record<string, number> } | null>(null);
  async function loadMetrics() {
    try {
      const r = await fetch("/api/public/canary/metrics/summary", { cache: "no-store" });
      if (r.ok) setMetrics(await r.json());
    } catch {}
  }

  // ——— Helpers
  async function runArm() {
    setLoading(true); setErr(null);
    try {
      const r = await fetch("/api/public/canary/run", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ dryRun: true }) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = (await r.json()) as CanaryResp;
      setResp(j);
    } catch (e: any) { setErr(String(e?.message || e)); }
    finally { setLoading(false); }
  }
  async function doConfirmShadow() {
    setBusyConfirm(true);
    try {
      const r = await fetch("/api/public/canary/confirm", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: "shadow", allowLive: false, dryRun: true })
      });
      alert(r.ok ? "Confirm (shadow) plan yazıldı." : "Confirm hata");
    } finally { setBusyConfirm(false); }
  }
  async function doConfirmLive() {
    setBusyConfirm(true);
    try {
      if (typeof window !== "undefined") localStorage.setItem("confirm_token", token || "");
      const r = await fetch("/api/public/canary/confirm", {
        method: "POST",
        headers: { "content-type": "application/json", "x-confirm-token": token || "" },
        body: JSON.stringify({ mode: "live", allowLive: true, dryRun: true }) // plan-only
      });
      const j = await r.json().catch(()=>null);
      alert(r.ok ? `Live (plan-only) confirm: ${j?.reason || "ok"}` : `Hata: ${j?.reason || r.status}`);
    } finally { setBusyConfirm(false); }
  }
  async function loadIndex() {
    const r = await fetch("/api/public/canary/index", { method: "GET", cache: "no-store" });
    setIndexCsv(await r.text());
  }
  async function loadNonces() {
    const r = await fetch("/api/public/canary/nonces", { cache: "no-store" });
    const j = await r.json();
    setNonces(j.nonces || []);
    if (!nonceSel && j.nonces?.length) setNonceSel(j.nonces[0].nonce);
  }
  async function loadEvidence(nonce: string) {
    const r = await fetch(`/api/public/canary/evidence?nonce=${encodeURIComponent(nonce)}`, { cache: "no-store" });
    const j = await r.json();
    setEvidence({
      nonce,
      plan: j.plan ? safeParse(j.plan) : undefined,
      latency: j.latency ? safeParse(j.latency) : undefined,
      confirm: j.confirm ? safeParse(j.confirm) : undefined,
      live_plan: j.live_plan ? safeParse(j.live_plan) : undefined,
      live_apply: j.live_apply ? safeParse(j.live_apply) : undefined,
    });
  }
  function safeParse(t: string) { try { return JSON.parse(t); } catch { return null; } }

  // CSV → rows (küçük parser; tek satırda virgül ve tırnak destekler)
  const indexRows = useMemo(() => parseCsv(indexCsv), [indexCsv]);

  useEffect(() => { loadNonces().then(()=>{}); }, []);
  useEffect(() => { if (nonceSel) loadEvidence(nonceSel); }, [nonceSel]);
  useEffect(() => { loadPolicy(); }, []);
  useEffect(() => { loadMetrics(); }, []);

  // Gate rozeti rengi
  function gateBadge(val: number | "unknown", thr: number, cmp: "lt"|"le"|"eq") {
    if (val === "unknown" || val === undefined || val === null) return <span className="px-2 py-0.5 rounded-xl text-xs bg-yellow-100 text-yellow-800">unknown</span>;
    const ok = cmp === "lt" ? val < thr : (cmp === "le" ? val <= thr : val === thr);
    return <span className={`px-2 py-0.5 rounded-xl text-xs ${ok ? "bg-green-100 text-green-800":"bg-red-100 text-red-800"}`}>{String(val)}</span>;
  }

  const thr = evidence?.plan?.thresholds ?? { ack_p95_ms:1000, event_to_db_p95_ms:300, ingest_lag_p95_s:2, seq_gap_total:0 };

  const DEFAULT_MS = Number(process.env.NEXT_PUBLIC_CANARY_AUTOREFRESH_MS ?? 30000);
  const [autoOn, setAutoOn] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
 
  // Apply modal — idempotency & trace
  const [applyIdem, setApplyIdem] = useState<string>("");
  const [applyTp, setApplyTp] = useState<string>("");
  async function tickRefresh() {
    await Promise.allSettled([loadNonces(), loadIndex(), loadPolicy(), loadMetrics()]);
    setLastRefreshed(new Date());
  }

  async function doApply() {
    try {
      if (!ack) { alert("Önce ONAY kutusunu işaretleyin."); return; }
      if (typeof window !== "undefined") { localStorage.setItem("confirm_token", token || ""); localStorage.setItem("user_role", role || "viewer"); }
      const r = await fetch("/api/public/canary/live-trade.apply", {
        method: "POST",
        headers: { "content-type":"application/json", "x-confirm-token": token || "", "x-user-role": role || "viewer", "traceparent": applyTp || "" },
        body: JSON.stringify({ allowLive: true, symbol, qty, side, idempotencyKey: applyIdem || `${symbol}:${qty}:${side}:${Date.now()}`, traceparent: applyTp || undefined })
      });
      const j = await r.json().catch(()=>null);
      alert(r.ok ? `Apply: ${j?.reason||"ok"} (${j?.accepted?"ACCEPTED":"BLOCKED"})` : `Hata: ${j?.reason||r.status}`);
      setShowApply(false);
    } catch(e) {
      alert(String((e as any)?.message||e));
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">S-18 — Canary Evidence & Ops UI</h1>
        <div className="flex items-center gap-2">
          <button onClick={runArm} disabled={loading} className="px-4 py-2 rounded-2xl shadow bg-black text-white disabled:opacity-50">
            {loading ? "Çalışıyor…" : "Canary ARM (dry-run)"}
          </button>
          <button onClick={doConfirmShadow} disabled={busyConfirm} className="px-4 py-2 rounded-2xl shadow bg-gray-800 text-white disabled:opacity-50">Confirm (shadow)</button>
          <div className="flex items-center gap-2">
            <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="x-confirm-token" className="px-3 py-2 rounded-xl border" />
            <button onClick={doConfirmLive} disabled={busyConfirm || !token} className="px-4 py-2 rounded-2xl shadow bg-indigo-600 text-white disabled:opacity-50" title={token ? "Live (plan-only) confirm" : "Token gereklidir"}>
              Live (token, plan-only)
            </button>
          </div>
          <button onClick={loadIndex} className="px-4 py-2 rounded-2xl shadow bg-gray-200">Index’i Yükle (CSV)</button>
          <AutoRefresh enabled={autoOn} setEnabled={setAutoOn} intervalMs={DEFAULT_MS} onTick={tickRefresh} lastRefreshed={lastRefreshed} />
        </div>
      </header>

      {/* NONCE seçimi ve özet */}
      <section className="rounded-2xl border p-4 shadow">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm">NONCE:</label>
          <select value={nonceSel} onChange={(e)=>setNonceSel(e.target.value)} className="px-3 py-2 rounded-xl border min-w-[280px]">
            {nonces.map(n => (
              <option key={n.nonce} value={n.nonce}>{n.nonce} — {n.decision} {n.ts ? `— ${n.ts}`: ""}</option>
            ))}
          </select>
          <button onClick={()=>loadNonces()} className="px-3 py-2 rounded-xl border bg-white">Yenile</button>
          {!!evidence?.nonce && <span className="px-2 py-1 rounded-xl text-xs bg-slate-100">Seçili: {evidence.nonce}</span>}
        </div>

        {evidence?.latency?.gates && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
            <div className="p-3 rounded-xl border bg-white">
              <div className="text-xs text-gray-500">ack_p95_ms &lt; {thr.ack_p95_ms}</div>
              {gateBadge(evidence.latency.gates.ack_p95_ms, thr.ack_p95_ms, "lt")}
            </div>
            <div className="p-3 rounded-xl border bg-white">
              <div className="text-xs text-gray-500">event_to_db_p95_ms &lt; {thr.event_to_db_p95_ms}</div>
              {gateBadge(evidence.latency.gates.event_to_db_p95_ms, thr.event_to_db_p95_ms, "lt")}
            </div>
            <div className="p-3 rounded-xl border bg-white">
              <div className="text-xs text-gray-500">ingest_lag_p95_s ≤ {thr.ingest_lag_p95_s}</div>
              {gateBadge(evidence.latency.gates.ingest_lag_p95_s, thr.ingest_lag_p95_s, "le")}
            </div>
            <div className="p-3 rounded-xl border bg-white">
              <div className="text-xs text-gray-500">seq_gap_total = {thr.seq_gap_total}</div>
              {gateBadge(evidence.latency.gates.seq_gap_total, thr.seq_gap_total, "eq")}
            </div>
          </div>
        )}

        {(evidence?.confirm || evidence?.live_plan || evidence?.live_apply) && (
          <div className="mt-4 grid md:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl border bg-white">
              <div className="font-semibold text-sm mb-1">confirm.json</div>
              <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-56">{JSON.stringify(evidence?.confirm ?? {}, null, 2)}</pre>
            </div>
            <div className="p-3 rounded-xl border bg-white">
              <div className="font-semibold text-sm mb-1">live_plan.json</div>
              <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-56">{JSON.stringify(evidence?.live_plan ?? {}, null, 2)}</pre>
            </div>
            <div className="p-3 rounded-xl border bg-white">
              <div className="font-semibold text-sm mb-1">live_apply.json</div>
              <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-56">{JSON.stringify(evidence?.live_apply ?? {}, null, 2)}</pre>
            </div>
          </div>
        )}
      </section>

      {/* ROLE + Tiny Live (plan-only) */}
      <section className="rounded-2xl border p-4 shadow">
        <div className="flex flex-wrap items-center gap-2">
          <select value={role} onChange={(e)=>{setRole(e.target.value); if (typeof window !== "undefined") localStorage.setItem("user_role", e.target.value);}} className="px-3 py-2 rounded-xl border">
            <option value="viewer">viewer</option>
            <option value="admin">admin</option>
          </select>
          <input value={symbol} onChange={e=>setSymbol(e.target.value.toUpperCase())} className="px-3 py-2 rounded-xl border w-32" />
          <input type="number" step="0.00001" value={qty} onChange={e=>setQty(Number(e.target.value))} className="px-3 py-2 rounded-xl border w-28" />
          <select value={side} onChange={e=>setSide(e.target.value as any)} className="px-3 py-2 rounded-xl border"><option>BUY</option><option>SELL</option></select>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={ack} onChange={e=>setAck(e.target.checked)} />
            ONAY: Kapılar OK + token + admin + kill-switch=off + minNotional
          </label>
          <button
            onClick={()=>{ const idem = `${symbol}:${qty}:${side}:${Date.now()}`; const tp = `00-${((crypto as any).randomUUID?.() || Math.random().toString(16).slice(2).padEnd(32,'0')).replace(/-/g,"")}0000000000000000-01`; setApplyIdem(idem); setApplyTp(tp); setShowApply(true); }}
            disabled={!token || role!=="admin"}
            className="px-4 py-2 rounded-2xl shadow bg-red-600 text-white disabled:opacity-50"
            title="ONAY gerektirir — testnet tiny-live, kill-switch=off ve minNotional şart"
          >
            Tiny Live (ONAY, apply)
          </button>
        </div>

        {showApply && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="w-full max-w-md bg-white rounded-2xl p-4 space-y-3 shadow-xl">
              <div className="text-lg font-semibold">Tiny Live (ONAY, apply)</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <label className="flex items-center gap-2 col-span-2"><span className="w-24">Token</span><input value={token} onChange={e=>setToken(e.target.value)} className="px-3 py-2 rounded-xl border w-full" /></label>
                <label className="flex items-center gap-2"><span className="w-24">Rol</span>
                  <select value={role} onChange={(e)=>{setRole(e.target.value); if (typeof window!=="undefined") localStorage.setItem("user_role", e.target.value);}} className="px-3 py-2 rounded-xl border w-full"><option value="viewer">viewer</option><option value="admin">admin</option></select>
                </label>
                <label className="flex items-center gap-2"><span className="w-24">Symbol</span><input value={symbol} onChange={e=>setSymbol(e.target.value.toUpperCase())} className="px-3 py-2 rounded-xl border w-full" /></label>
                <label className="flex items-center gap-2"><span className="w-24">Qty</span><input type="number" step="0.00001" value={qty} onChange={e=>setQty(Number(e.target.value))} className="px-3 py-2 rounded-xl border w-full" /></label>
                <label className="flex items-center gap-2"><span className="w-24">Side</span><select value={side} onChange={e=>setSide(e.target.value as any)} className="px-3 py-2 rounded-xl border w-full"><option>BUY</option><option>SELL</option></select></label>
                <label className="flex items-center gap-2 col-span-2 text-xs">
                  <input type="checkbox" checked={ack} onChange={e=>setAck(e.target.checked)} />
                  ONAY: Kapılar OK + token + admin + kill-switch=off + minNotional
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={()=>setShowApply(false)} className="px-4 py-2 rounded-xl border">İptal</button>
                <button onClick={doApply} disabled={!ack || !token || role!=="admin"} className="px-4 py-2 rounded-xl bg-red-600 text-white disabled:opacity-50">Uygula</button>
              </div>
              <p className="text-xs text-gray-500 mt-2 break-all">Idempotency: <code>{applyIdem||"(hazır)"}</code> 
                <span className="mx-1">•</span> Trace: <code>{applyTp||"(hazır)"}</code>
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Hazırlık Durumu (Apply Gate) */}
      <section className="rounded-2xl border p-4 shadow">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Hazırlık Durumu (Apply Gate)</h2>
          {(() => {
            const gatesOk = !!evidence?.latency?.gates && (() => {
              const g = evidence!.latency!.gates;
              const thr = evidence?.plan?.thresholds ?? { ack_p95_ms:1000, event_to_db_p95_ms:300, ingest_lag_p95_s:2, seq_gap_total:0 };
              const hasUnknown = [g.ack_p95_ms,g.event_to_db_p95_ms,g.ingest_lag_p95_s,g.seq_gap_total].some(v=>v===undefined||v===null||v==="unknown");
              return !hasUnknown && g.ack_p95_ms < thr.ack_p95_ms && g.event_to_db_p95_ms < thr.event_to_db_p95_ms && g.ingest_lag_p95_s <= thr.ingest_lag_p95_s && g.seq_gap_total === thr.seq_gap_total;
            })();
            const tokenPresent = !!token;
            const roleAdmin = (role||"").toLowerCase()==="admin";
            const killOff = policy ? !policy.killSwitch : false;
            const notionalOk = policy ? (Number(qty) * policy.priceHint) >= policy.minNotional : false;
            const ready = !!(gatesOk && tokenPresent && roleAdmin && killOff && notionalOk);
            return (
              <span className={`px-3 py-1 rounded-xl text-sm ${ready ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                {ready ? "READY" : "BLOCKED"}
              </span>
            );
          })()}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2 mt-3 text-sm">
          {(() => {
            const g = evidence?.latency?.gates; const thr = evidence?.plan?.thresholds ?? { ack_p95_ms:1000, event_to_db_p95_ms:300, ingest_lag_p95_s:2, seq_gap_total:0 };
            const gatesOk = !!g && ![g?.ack_p95_ms,g?.event_to_db_p95_ms,g?.ingest_lag_p95_s,g?.seq_gap_total].some(v=>v===undefined||v===null||v==="unknown")
              && g!.ack_p95_ms < thr.ack_p95_ms && g!.event_to_db_p95_ms < thr.event_to_db_p95_ms && g!.ingest_lag_p95_s <= thr.ingest_lag_p95_s && g!.seq_gap_total === thr.seq_gap_total;
            const tokenPresent = !!token;
            const roleAdmin = (role||"").toLowerCase()==="admin";
            const killText = policy ? (policy.killSwitch ? "ON (blocked)" : "OFF (ok)") : "…";
            const notionalText = policy ? `${(Number(qty)*(policy.priceHint||0)).toFixed(2)} / ${policy.minNotional}` : "…";
            const notionalOk = policy ? (Number(qty) * (policy.priceHint||0)) >= policy.minNotional : false;
            return (
              <>
                <div className="px-3 py-2 rounded-xl border bg-white">Gates OK: <b>{String(!!gatesOk)}</b></div>
                <div className="px-3 py-2 rounded-xl border bg-white">Token: <b>{tokenPresent ? "present" : "missing"}</b></div>
                <div className="px-3 py-2 rounded-xl border bg-white">RBAC: <b>{roleAdmin ? "admin" : role}</b></div>
                <div className="px-3 py-2 rounded-xl border bg-white">Kill-Switch: <b>{killText}</b></div>
                <div className="px-3 py-2 rounded-xl border bg-white">Notional≥min: <b>{notionalText}</b> → <b>{String(!!notionalOk)}</b></div>
                <div className="px-3 py-2 rounded-xl border bg-white">Symbol/Qty: <b>{symbol}</b> / <b>{qty}</b></div>
              </>
            );
          })()}
        </div>
        <div className="text-xs text-gray-500 mt-2">Not: Bu panel yalnız ön-kontrol amaçlıdır; nihai karar executor tarafından verilir.</div>
      </section>

      {/* Admin Panel — Kill-Switch Toggle (confirm) */}
      <section className="rounded-2xl border p-4 shadow">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Admin: Kill-Switch</h2>
          <span className="text-sm px-2 py-1 rounded-xl bg-slate-100">Kaynak: {policy?.source||"env"}</span>
        </div>
        <div className="flex items-center gap-2 mt-3 text-sm">
          <input value={token} onChange={(e)=>setToken(e.target.value)} placeholder="x-confirm-token" className="px-3 py-2 rounded-xl border" />
          <select value={role} onChange={(e)=>{ setRole(e.target.value); if (typeof window!=="undefined") localStorage.setItem("user_role", e.target.value); }} className="px-3 py-2 rounded-xl border">
            <option value="viewer">viewer</option>
            <option value="admin">admin</option>
          </select>
          <button
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white disabled:opacity-50"
            disabled={!token || role!=="admin"}
            onClick={async ()=>{
              const wantOff = true; // OFF
              const r = await fetch("/api/public/canary/policy/kill-switch.apply", {
                method: "POST",
                headers: { "content-type":"application/json", "x-confirm-token": token||"", "x-user-role": role||"viewer" },
                body: JSON.stringify({ killSwitch: !wantOff ? true : false })
              });
              const j = await r.json().catch(()=>null);
              alert(r.ok? `Kill-Switch: ${j?.effective?.killSwitch?"ON":"OFF"}` : `Hata: ${j?.reason||r.status}`);
              loadPolicy();
              loadMetrics();
            }}
            title="ONAY gerektirir — admin + token"
          >Kill-Switch: OFF (confirm)</button>
          <span className="px-2 py-1 rounded-xl bg-white border">Effective: <b>{policy?.killSwitch?"ON":"OFF"}</b></span>
        </div>
      </section>

      {/* Apply Metrics Snapshot */}
      <section className="rounded-2xl border p-4 shadow">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Apply Metrics Snapshot</h2>
          <span className="text-sm px-2 py-1 rounded-xl bg-slate-100">Toplam: {metrics?.totals?.apply_total??0}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 text-sm">
          <div className="px-3 py-2 rounded-xl border bg-white">Idempotent dup: <b>{metrics?.totals?.idem_duplicate_total??0}</b></div>
          <div className="px-3 py-2 rounded-xl border bg-white">Circuit trips: <b>{metrics?.totals?.circuit_tripped_total??0}</b></div>
        </div>
        <div className="mt-3">
          <div className="text-xs text-gray-500 mb-1">Blocked reasons:</div>
          <div className="flex items-end gap-2 h-24">
            {Object.entries(metrics?.blocked||{}).map(([k,v])=> (
              <div key={k} className="flex flex-col items-center">
                <div className="w-8 bg-rose-400" style={{ height: `${Math.min(100, 8 + (Number(v)||0)*12)}%` }} />
                <div className="text-[10px] mt-1 max-w-[56px] text-center break-words">{k}</div>
                <div className="text-[10px]">{v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INDEX.csv önizleme */}
      {!!indexCsv && (
        <section className="rounded-2xl border p-4 shadow">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold mb-2">INDEX.csv (ilk 50 satır)</h2>
            <a href="/api/public/canary/index" className="text-sm underline" target="_blank">CSV’yi indir</a>
          </div>
          <div className="overflow-auto border rounded-xl">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>{indexRows.header.map((h, i) => <th key={i} className="text-left px-3 py-2">{h}</th>)}</tr>
              </thead>
              <tbody>
                {indexRows.rows.slice(0,50).map((r, idx) => (
                  <tr key={idx} className="odd:bg-white even:bg-gray-50">
                    {r.map((c,i)=><td key={i} className="px-3 py-1 whitespace-nowrap">{c}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

// Basit CSV parser (tırnak/virgül destekli)
function parseCsv(input: string): { header: string[]; rows: string[][] } {
  if (!input) return { header: [], rows: [] };
  const rows: string[][] = [];
  let cur: string[] = [];
  let cell = "";
  let inQ = false;
  for (let i=0;i<input.length;i++){
    const ch = input[i];
    const next = input[i+1];
    if (inQ) {
      if (ch === '"' && next === '"') { cell += '"'; i++; }
      else if (ch === '"') { inQ = false; }
      else { cell += ch; }
    } else {
      if (ch === '"') { inQ = true; }
      else if (ch === ",") { cur.push(cell); cell = ""; }
      else if (ch === "\n" || ch === "\r") {
        if (cell.length>0 || cur.length>0) { cur.push(cell); rows.push(cur); cur=[]; cell=""; }
        if (ch === "\r" && next === "\n") i++; // CRLF
      } else { cell += ch; }
    }
  }
  if (cell.length>0 || cur.length>0) { cur.push(cell); rows.push(cur); }
  const header = rows.shift() || [];
  return { header, rows };
} 