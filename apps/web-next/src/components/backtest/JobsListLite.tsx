"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
const ReportModal = dynamic(()=>import("./ReportModal"),{ ssr:false });

type JobRow = { id:string; name?:string; state?:string; progress?:number; symbol?:string; timeframe?:string; start?:string; end?:string; startedAt?:any; finishedAt?:any };

export default function JobsListLite(){
  const [rows,setRows]=useState<JobRow[]>([]);
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState<string|undefined>();
  const [pdfJobId,setPdfJobId]=useState<string|undefined>();
  const [showPdf,setShowPdf]=useState(false);

  async function refresh(){
    setLoading(true); setErr(undefined);
    try{
      const payload={ action:"backtest.status", params:{}, dryRun:false, confirm_required:false, reason:"engine lite" };
      const r=await fetch("/api/backtest/jobs/status",{ method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify(payload) });
      if(!r.ok) throw new Error(`HTTP ${r.status}`);
      const j=await r.json().catch(()=>null);
      const list = Array.isArray(j?.jobs)? j.jobs : (j?.data ?? []);
      setRows(list as JobRow[]);
    }catch(e:any){ setErr(e?.message ?? "Veri alınamadı"); }
    finally{ setLoading(false); }
  }
  async function download(kind:"csv"|"pdf", jobId:string){
    try{
      const r=await fetch("/api/backtest/jobs/report",{ method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify({ action:"backtest.report", params:{ jobId, kind } }) });
      if(!r.ok) throw new Error(`HTTP ${r.status}`);
      const b=await r.blob(); const a=document.createElement("a");
      a.href=URL.createObjectURL(b); a.download=`backtest_${jobId}.${kind}`; a.click(); URL.revokeObjectURL(a.href);
    }catch(e:any){ alert(e?.message ?? "İndirme hatası"); }
  }
  async function downloadSigned(jobId:string){
    try{
      const p={ action:"reports.sign", params:{ jobId }, dryRun:false, confirm_required:false, reason:"signed pdf" };
      const r=await fetch("/api/reports/sign",{ method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify(p) });
      if(!r.ok) throw new Error(`HTTP ${r.status}`);
      const b=await r.blob(); const a=document.createElement("a");
      a.href=URL.createObjectURL(b); a.download=`backtest_${jobId}_signed.pdf`; a.click(); URL.revokeObjectURL(a.href);
    }catch(e:any){ alert(e?.message ?? "İmzalı PDF indirilemedi"); }
  }
  useEffect(()=>{ refresh(); const t=setInterval(refresh,10000); return ()=>clearInterval(t); },[]);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Jobs (Lite)</h2>
        <div className="flex items-center gap-2">
          <button className="btn" onClick={refresh} disabled={loading}>{loading?"…":"Yenile"}</button>
          {err && <span className="muted text-xs">Hata: {err}</span>}
        </div>
      </div>
      <div className="overflow-x-auto mt-2">
        <table className="tbl">
          <thead><tr><th>ID</th><th>Ad</th><th>Durum</th><th>İlerleme</th><th>Sembol/TF</th><th>Aralık</th><th>Aksiyon</th></tr></thead>
          <tbody>
            {rows?.length ? rows.map((r,i)=>(
              <tr key={r.id ?? i}>
                <td>{r.id ?? "—"}</td>
                <td>{r.name ?? "—"}</td>
                <td>{r.state ?? "—"}</td>
                <td>{typeof r.progress==="number" ? `${Math.round(r.progress*100)}%` : "—"}</td>
                <td>{[r.symbol,r.timeframe].filter(Boolean).join(" / ") || "—"}</td>
                <td>{[r.start,r.end].filter(Boolean).join(" → ") || "—"}</td>
                <td>
                  <div className="flex flex-wrap gap-2">
                    <button className="btn" onClick={()=>download("csv", r.id)}>CSV</button>
                    <button className="btn" onClick={()=>{ setPdfJobId(r.id); setShowPdf(true); }}>PDF</button>
                    <button className="btn" onClick={()=>downloadSigned(r.id)}>İmzalı PDF</button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={7} className="muted">Job yok veya veri alınamadı.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <ReportModal jobId={pdfJobId||""} open={showPdf && !!pdfJobId} onClose={()=>setShowPdf(false)} />
    </div>
  );
}


