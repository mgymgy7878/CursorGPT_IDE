"use client";
import { useState } from "react";
type Op = "enable"|"disable"|"snooze";
export default function AlertsControl({ id, onResult }:{ id:string; onResult?:(m:string)=>void }){
  const [busy,setBusy]=useState<Op|"" >(""); const [preview,setPreview]=useState<any|null>(null);
  const [show,setShow]=useState(false); const [err,setErr]=useState<string|undefined>();
  async function doPreview(op:Op){
    setBusy(op); setErr(undefined); setShow(true); setPreview(null);
    const payload={ action:"alerts.preview", params:{ id, op, durationMin: op==="snooze"?60:undefined }, dryRun:true, confirm_required:false, reason:"alerts preview" };
    try{
      const r=await fetch("/api/alerts/preview",{ method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify(payload) });
      const j=await r.json().catch(()=>({})); if(!r.ok) setErr(`HTTP ${r.status}`); setPreview(j);
    }catch(e:any){ setErr(e?.message??"preview hatası"); } finally{ setBusy(""); }
  }
  async function doControl(op:Op){
    setErr(undefined); setBusy(op);
    const payload={ action:"alerts.control", params:{ id, op }, dryRun:false, confirm_required:true, reason:"alerts control" };
    try{
      const r=await fetch("/api/alerts/control",{ method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify(payload) });
      const txt=await r.text(); let audit=""; try{ const j=JSON.parse(txt); const aid=j?.auditId||j?.id||j?.ticket||j?.requestId; if(aid) audit=` • auditId=${aid}`; }catch{}
      onResult?.(`Alerts control: ${r.status} ${r.statusText}${audit}`); setPreview({ ...(preview||{}), control: txt.slice(0,300) });
    }catch(e:any){ setErr(e?.message??"control hatası"); } finally{ setBusy(""); }
  }
  return (<div className="flex gap-2">
    <button className="btn" onClick={()=>doPreview("enable")} disabled={!!busy}>Enable</button>
    <button className="btn" onClick={()=>doPreview("disable")} disabled={!!busy}>Disable</button>
    <button className="btn" onClick={()=>doPreview("snooze")} disabled={!!busy}>Snooze</button>
    {show && (<div className="modal-backdrop" onClick={()=>setShow(false)}>
      <div className="modal card p-4" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between"><h3 className="text-lg font-semibold">Alert Önizleme • {id}</h3><button className="btn" onClick={()=>setShow(false)}>Kapat</button></div>
        {err && <div className="muted mt-2">Hata: {err}</div>}
        <div className="muted text-sm mt-2">Onay sonrası **confirm_required=true** ile uygulanır.</div>
        <pre className="pre mt-2">{JSON.stringify(preview??{},null,2)}</pre>
        <div className="flex gap-2 mt-3">
          <button className="btn" onClick={()=>doControl("enable")} disabled={!!busy}>Enable (Onayla)</button>
          <button className="btn-danger" onClick={()=>doControl("disable")} disabled={!!busy}>Disable (Onayla)</button>
          <button className="btn" onClick={()=>doControl("snooze")} disabled={!!busy}>Snooze (Onayla)</button>
        </div>
      </div></div>)}
  </div>);
}


