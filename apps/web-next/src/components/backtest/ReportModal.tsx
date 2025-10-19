"use client";
import { useEffect, useState } from "react";

export default function ReportModal({ jobId, open, onClose }:{ jobId:string; open:boolean; onClose:()=>void }){
  const [url,setUrl] = useState<string>("");
  const [err,setErr] = useState<string|undefined>();

  useEffect(()=>{ (async ()=>{
    if(!open) return;
    setErr(undefined); setUrl("");
    try{
      const r = await fetch("/api/backtest/jobs/report",{ method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify({ action:"backtest.report", params:{ jobId, kind:"pdf" }}) });
      if(!r.ok) throw new Error(`HTTP ${r.status}`);
      const blob = await r.blob();
      const obj = URL.createObjectURL(blob);
      setUrl(obj);
    }catch(e:any){ setErr(e?.message ?? "Rapor alınamadı"); }
  })(); return ()=>{ if(url) URL.revokeObjectURL(url); }; },[open, jobId]);

  if(!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal card p-3" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Backtest Raporu — {jobId}</h3>
          <button className="btn" onClick={onClose}>Kapat</button>
        </div>
        <div className="flex gap-2 my-2">
          <button className="btn" onClick={async ()=>{
            try{
              const p={ action:"reports.sign", params:{ jobId }, dryRun:false, confirm_required:false, reason:"signed pdf" };
              const r=await fetch("/api/reports/sign",{ method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify(p) });
              if(!r.ok) throw new Error(`HTTP ${r.status}`);
              const b=await r.blob(); const a=document.createElement("a");
              a.href=URL.createObjectURL(b); a.download=`backtest_${jobId}_signed.pdf`; a.click(); URL.revokeObjectURL(a.href);
            }catch(e:any){ alert(e?.message ?? "İmzalı PDF indirilemedi"); }
          }}>İmzalı PDF indir</button>
          <button className="btn" onClick={async ()=>{
            try{
              const p={ action:"backtest.report", params:{ jobId, kind:"csv" }, dryRun:false, confirm_required:false, reason:"csv" };
              const r=await fetch("/api/backtest/jobs/report",{ method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify(p) });
              if(!r.ok) throw new Error(`HTTP ${r.status}`);
              const b=await r.blob(); const a=document.createElement("a");
              a.href=URL.createObjectURL(b); a.download=`backtest_${jobId}.csv`; a.click(); URL.revokeObjectURL(a.href);
            }catch(e:any){ alert(e?.message ?? "CSV indirilemedi"); }
          }}>CSV indir</button>
        </div>
        {err && <div className="muted mb-2">Hata: {err}</div>}
        {url ? (
          <object data={url} type="application/pdf" width="100%" height="640px">PDF yüklenemedi.</object>
        ) : (
          <div className="muted mt-2">Yükleniyor…</div>
        )}
      </div>
    </div>
  );
}


