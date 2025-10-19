"use client";
import { useEffect, useState } from "react";
import { getJSON, setJSON } from "@/lib/storage";
import { getCandidateParams, getBaselineParams, setBaselineParams, diffParams } from "./StudioBus";
import { pushAudit } from "@/lib/audit";

export default function GuardrailsPanel(){
  const [baseline,setBaseline] = useState<any>(getBaselineParams());
  const [candidate,setCandidate] = useState<any>(getCandidateParams());
  const [risk,setRisk] = useState<any>(null);
  const [err,setErr] = useState<string|undefined>();
  const SCHEMA = 1;
  const KEY = `guardrails_v${SCHEMA}`;
  const defaults = { threshold: 0.6, weights: { ema: 0.5, rsi: 0.3 } };
  const [threshold, setThreshold] = useState<number>(defaults.threshold);
  const [weights, setWeights] = useState<{ ema:number; rsi:number }>(defaults.weights);

  useEffect(()=>{ (async()=>{
    if(!baseline){
      try{ const r = await fetch("/api/model/baseline"); if(r.ok){ const j = await r.json(); setBaseline(j); } }catch{}
    }
  })(); },[]);
  useEffect(()=>{ setCandidate(getCandidateParams()); },[]);

  // Persist policy (local) + schema guard
  useEffect(()=>{
    try{
      const cur = getJSON(KEY, defaults, SCHEMA);
      if(cur){
        if(typeof (cur as any).threshold === 'number') setThreshold((cur as any).threshold);
        const w = (cur as any).weights;
        if(typeof w?.ema === 'number' && typeof w?.rsi === 'number') setWeights({ ema: Number(w.ema), rsi: Number(w.rsi) });
      }else{
        // eski/uyumsuz şema — reset
        setThreshold(defaults.threshold);
        setWeights(defaults.weights);
        alert("Guardrails varsayılanlara sıfırlandı");
      }
    }catch{}
  },[]);
  useEffect(()=>{ try{ setJSON(KEY, { threshold, weights }, SCHEMA); }catch{} },[threshold, weights]);

  const { changes, diff } = diffParams(candidate, baseline);

  async function evaluate(){
    setErr(undefined); setRisk(null);
    try{
      const payload = { action:"guardrails.evaluate", params:{ baseline, candidate, diff }, dryRun:true, confirm_required:false, reason:"studio guardrails" };
      const r = await fetch("/api/guardrails/evaluate", { method:"POST", headers:{"content-type":"application/json"}, body: JSON.stringify(payload) });
      const j = await r.json().catch(()=>null); if(!r.ok) throw new Error(`HTTP ${r.status}`);
      setRisk(j);
    }catch(e:any){ setErr(e?.message ?? "evaluate hata"); }
  }

  async function deploy(){
    const score = Number(risk?.riskScore ?? 1);
    if(score > threshold){ alert(`Risk skoru ${score.toFixed(2)} > ${threshold}. Deploy engellendi.`); return; }
    const payload = { action:"model.promote", params:{ name:"strategy_candidate", source:"strategy-studio", artifact: JSON.stringify(candidate||{}), policy:{ threshold, weights } }, dryRun:false, confirm_required:true, reason:"studio guardrails deploy" };
    const r = await fetch("/api/model/promote", { method:"POST", headers:{"content-type":"application/json"}, body: JSON.stringify(payload) }).catch(()=>null);
    if(!r){ alert("Ağ hatası"); return; }
    try{ setBaselineParams(candidate); }catch{}
    const txt = await r.text();
    let audit = "";
    try{ const j = JSON.parse(txt); audit = j?.auditId || j?.id || j?.requestId || j?.jobId || ""; }catch{}
    if(audit){ try{ pushAudit({ ts: Date.now(), type:"deploy", id:audit, meta:{ source:"guardrails" } }); }catch{} }
    alert(`Deploy yanıtı: ${r.status} ${r.statusText}${audit? `\nAudit: ${audit}`:""}\n${txt.slice(0,300)}`);
  }

  async function approve(){
    // Guardrails approve & (opsiyonel) promote akışı — onay kapılı, audit-id beklenir
    const payload = { action:"guardrails.approve", params:{ baseline, candidate, diff, policy:{ threshold, weights } }, dryRun:false, confirm_required:true, reason:"guardrails approve & promote" };
    const r = await fetch("/api/guardrails/approve", { method:"POST", headers:{"content-type":"application/json"}, body: JSON.stringify(payload) }).catch(()=>null);
    if(!r){ alert("Ağ hatası"); return; }
    const txt = await r.text();
    let audit = "";
    try{ const j = JSON.parse(txt); const id = j?.auditId ?? j?.id ?? j?.ticket ?? j?.requestId; if(id) audit = ` • auditId=${id}`; }catch{}
    alert(`Approve yanıtı: ${r.status} ${r.statusText}${audit}\n${txt.slice(0,300)}`);
  }

  return (
    <div className="card p-4 space-y-3">
      <h2 className="text-xl font-semibold">Guardrails</h2>
      <div className="muted text-sm">Param-diff ile risk skoru. Eşik: {threshold}. Üzerinde ise deploy kilitlenir.</div>
      <div className="card-sub p-3">
        <div className="grid md:grid-cols-3 gap-3 items-center">
          <div>
            <div className="muted text-xs mb-1">Risk eşiği</div>
            <input className="w-full" type="range" min={0} max={1} step={0.01} value={threshold} onChange={e=>setThreshold(Number(e.target.value))} />
            <div className="muted text-xs">Değer: {(threshold*100).toFixed(0)}%</div>
          </div>
          <div>
            <div className="muted text-xs mb-1">EMA ağırlığı (0–1)</div>
            <input className="inp w-24" type="number" min={0} max={1} step={0.1} value={weights.ema} onChange={e=>setWeights(w=>({ ...w, ema: Math.max(0, Math.min(1, Number(e.target.value))) }))} />
          </div>
          <div>
            <div className="muted text-xs mb-1">RSI ağırlığı (0–1)</div>
            <input className="inp w-24" type="number" min={0} max={1} step={0.1} value={weights.rsi} onChange={e=>setWeights(w=>({ ...w, rsi: Math.max(0, Math.min(1, Number(e.target.value))) }))} />
          </div>
        </div>
        {(weights.ema + weights.rsi > 1) && (
          <div className="text-xs text-amber-400 mt-1">Uyarı: EMA+RSI ağırlıklarının toplamı 1’i aşmamalı.</div>
        )}
        <div className="mt-2">
          <button className="btn" onClick={()=>{
            try{
              const score = Math.min(1, Math.max(0, 0.5*weights.ema + 0.5*weights.rsi));
              setRisk({ ...(risk||{}), preview:true, riskScore: score });
            }catch{}
          }}>Preview score</button>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <div className="card-sub p-3"><div className="muted text-xs mb-1">Baseline</div><pre className="pre" style={{maxHeight:200,overflow:"auto"}}>{JSON.stringify(baseline??{},null,2)}</pre></div>
        <div className="card-sub p-3"><div className="muted text-xs mb-1">Candidate</div><pre className="pre" style={{maxHeight:200,overflow:"auto"}}>{JSON.stringify(candidate??{},null,2)}</pre></div>
      </div>
      <div className="card-sub p-3">
        <div className="muted text-xs mb-1">Diff (değişiklik: {changes})</div>
        <pre className="pre" style={{maxHeight:160,overflow:"auto"}}>{JSON.stringify(diff??{},null,2)}</pre>
      </div>
      <div className="flex gap-2 items-center">
        <button className="btn" onClick={evaluate}>Risk Hesapla</button>
        <button className="btn" onClick={approve}>Approve & Promote (Onay Kapısı)</button>
        <button className="btn-danger" onClick={deploy} disabled={Number(risk?.riskScore ?? 1) > threshold}>Deploy (Onay Kapısı)</button>
        <button className="btn" onClick={()=>{ setThreshold(defaults.threshold); setWeights(defaults.weights); }} aria-label="Guardrails reset">Sıfırla</button>
        {err && <span className="muted text-xs">Hata: {err}</span>}
      </div>
      {risk && <div className="card-sub p-3"><div className="muted text-xs">Risk</div><pre className="pre">{JSON.stringify(risk,null,2)}</pre></div>}
    </div>
  );
}


