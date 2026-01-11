"use client";
import { useEffect, useState } from "react";
import { scrapeVal } from "@/lib/prom";
import { TARGETS, BANDS } from "@/lib/config";
import { fetchOptional } from "@/lib/net/fetchOptional";
import { isExecutorOnline } from "@/lib/runtime/executor";
import { formatDate } from "@/lib/format";

export default function SmokeCard(){
  const [vals,setVals] = useState<{p95:number|null; st:number|null; code:number|null; ts:number|null}>({ p95:null, st:null, code:null, ts:null });
  const [last,setLast] = useState<string|undefined>();

  useEffect(()=>{
    (async()=>{
      // Check executor status first
      const online = await isExecutorOnline();
      if (!online) {
        setVals({ p95:null, st:null, code:null, ts:null });
        return;
      }

      // Fetch metrics with graceful degradation
      const metricsRes = await fetchOptional('/api/public/metrics');
      if (metricsRes.ok && metricsRes.data) {
        const txt = typeof metricsRes.data === 'string'
          ? metricsRes.data
          : JSON.stringify(metricsRes.data);

        setVals({
          p95: scrapeVal(txt, 'spark_smoke_p95_latency_ms'),
          st:  scrapeVal(txt, 'spark_smoke_staleness_seconds'),
          code:scrapeVal(txt, 'spark_smoke_exit_code'),
          ts:  scrapeVal(txt, 'spark_smoke_last_success_timestamp')
        });
      } else {
        setVals({ p95:null, st:null, code:null, ts:null });
      }

      // Fetch last smoke test
      const smokeRes = await fetchOptional('/api/public/smoke-last');
      if (smokeRes.ok && smokeRes.data?.path) {
        setLast(String(smokeRes.data.path));
      }
    })();
  },[]);
  const tsFmt = (vals.ts!=null) ? formatDate(new Date(Number(vals.ts)*1000)) : '—';
  const p95 = Number(vals.p95 ?? NaN);
  const st = Number(vals.st ?? NaN);
  const code = Number(vals.code ?? 0);
  const p95Severity = Number.isFinite(p95)? (p95 > TARGETS.P95_MS*BANDS.alert? 'ALERT' : p95 > TARGETS.P95_MS*BANDS.warn ? 'WARN' : 'OK') : 'N/A';
  const stWarn = Number.isFinite(st) && st > TARGETS.STALENESS_S;
  const codeAlert = Number.isFinite(code) && code !== 0;
  return (
    <div className="p-4 rounded-xl border border-neutral-800 bg-black/30">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm opacity-70">Son Canary Testi</div>
        <div className="flex items-center gap-2 text-xs">
          <Badge label={`P95: ${Number.isFinite(p95)? p95+'ms':'—'}`} variant={p95Severity==='ALERT'? 'alert' : p95Severity==='WARN'? 'warn':'ok'} />
          <Badge label={`St: ${Number.isFinite(st)? st+'s':'—'}`} variant={stWarn? 'warn':'ok'} />
          <Badge label={`Exit: ${Number.isFinite(code)? code: '—'}`} variant={codeAlert? 'alert':'ok'} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>P95 hedef</div><div className="font-mono">{TARGETS.P95_MS} ms (warn×{BANDS.warn}, alert×{BANDS.alert})</div>
        <div>Staleness eşiği</div><div className="font-mono">{TARGETS.STALENESS_S} s</div>
        <div>Zaman</div><div className="font-mono">{tsFmt}</div>
      </div>
      <div className="mt-2 text-sm">
        {last ? <a className="underline" href={`/${last}`} target="_blank" rel="noreferrer">Kanıtı Aç</a> : <span className="opacity-60">Kanıt bulunamadı</span>}
        <button className="btn btn-xs ml-3" onClick={()=>createAlertDraft({ p95, st, code, last })}>Uyarı Taslağı Oluştur</button>
      </div>
    </div>
  );
}

function Badge({ label, variant }:{ label:string; variant:'ok'|'warn'|'alert' }){
  const cls = variant==='alert'? 'text-red-400' : variant==='warn'? 'text-amber-400' : 'text-green-400';
  return <span className={`font-mono ${cls}`}>{label}</span>;
}

function createAlertDraft({ p95, st, code, last }:{ p95:number; st:number; code:number; last?:string }){
  const sev = (code!==0) ? 'alert' : (Number.isFinite(p95) && p95 > TARGETS.P95_MS*BANDS.alert? 'alert' : (Number.isFinite(p95) && p95 > TARGETS.P95_MS*BANDS.warn? 'warn':'ok'));
  const draft = {
    action: "/alerts/create",
    params: {
      metric: 'smoke',
      p95Ms: Number.isFinite(p95)? p95 : null,
      stalenessS: Number.isFinite(st)? st : null,
      exitCode: Number.isFinite(code)? code : null,
      target: { p95Ms: TARGETS.P95_MS, stalenessS: TARGETS.STALENESS_S },
      severity: sev,
      evidenceDir: last || null
    },
    dryRun: true,
    confirm_required: false,
    reason: 'smoke alert draft'
  };
  try{
    const blob = new Blob([JSON.stringify(draft,null,2)], { type: 'application/json;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `alert_draft_smoke_${Date.now()}.json`; a.click(); URL.revokeObjectURL(a.href);
  }catch{}
}


