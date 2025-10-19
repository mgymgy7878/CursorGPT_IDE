"use client";
import { useState } from "react";
import { pushAudit } from "@/lib/audit";
export default function SaveDeploy(){
  const [name,setName]=useState("ema_crossover_v1");
  const [code,setCode]=useState("// strategy code or JSON artifact");
  const [msg,setMsg]=useState<string|undefined>();

  function download() {
    const blob = new Blob([code], { type: "application/json;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${name}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function deploy() {
    setMsg("Gönderiliyor… (onay gerektirir)");
    const payload = {
      action: "model.promote",
      params: { name, source: "strategy-studio", artifact: code },
      dryRun: false,
      confirm_required: true,
      reason: "Studio → Deploy request"
    };
    const r = await fetch("/api/model/promote", {
      method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify(payload)
    }).catch(()=>null);
    if (!r) { setMsg("Hata: ağ/endpoint"); return; }
    const txt = await r.text().catch(()=> "");
    let audit = "";
    try {
      const j = JSON.parse(txt);
      const id = (j?.auditId ?? j?.id ?? j?.jobId ?? j?.ticket ?? j?.requestId);
      if (id) audit = ` • auditId=${id}`;
      if (id) { try{ pushAudit({ ts: Date.now(), type:"deploy", id: String(id), meta:{ source:"studio" } }); }catch{} }
    } catch {}
    setMsg(`Yanıt: ${r.status} ${r.statusText}${audit ? audit : ""} — ${txt.slice(0,200)}…`);
  }

  return (
    <div className="card p-4 space-y-3">
      <h2 className="text-xl font-semibold">Save & Deploy</h2>
      <div className="muted">Bu işlem canlı etkiler yaratabilir. “Deploy” isteği <b>onay kapısı</b> ile gider.</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="form-row md:col-span-1"><label>İsim</label><input className="inp" value={name} onChange={e=>setName(e.target.value)} /></div>
        <div className="form-row md:col-span-2"><label>Artefakt</label><textarea className="inp" rows={6} value={code} onChange={e=>setCode(e.target.value)} /></div>
      </div>
      <div className="flex gap-2">
        <button className="btn" onClick={download}>JSON Olarak Dışa Aktar</button>
        <button className="btn-danger" onClick={deploy}>Deploy (Onay İster)</button>
      </div>
      {msg && <div className="muted">{msg}</div>}
    </div>
  );
}


