"use client";
import { useState } from "react";

async function sha256Hex(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buf);
  const bytes = Array.from(new Uint8Array(hash));
  return bytes.map(b => b.toString(16).padStart(2, "0")).join("");
}

export default function VerifyPage(){
  const [pdf,setPdf]=useState<File|null>(null);
  const [manifest,setManifest]=useState<string>("");
  const [jobId,setJobId]=useState<string>("");
  const [hash,setHash]=useState<string>("");
  const [status,setStatus]=useState<"idle"|"calc"|"ok"|"mismatch"|"err">("idle");
  const [msg,setMsg]=useState<string>("");

  async function verify(){
    try{
      setStatus("calc"); setMsg(""); setHash("");
      if(!pdf) throw new Error("PDF seçilmedi");
      const h = await sha256Hex(pdf);
      setHash(h);
      let target = "";
      if(manifest.trim()){
        try{ const j = JSON.parse(manifest); target = j.sha256 || j.hash || ""; }
        catch{ throw new Error("Manifest JSON parse edilemedi"); }
      }
      if(target){
        if(target.toLowerCase()===h.toLowerCase()){ setStatus("ok"); setMsg("Manifest ile eşleşti ✔"); }
        else { setStatus("mismatch"); setMsg("Manifest hash ile eşleşmedi ❌"); }
      }else{
        setStatus("ok"); setMsg("Hash hesaplandı (manifest yok).");
      }
    }catch(e:any){
      setStatus("err"); setMsg(e?.message ?? "Doğrulama hatası");
    }
  }

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-3xl font-semibold">Rapor Doğrulama</h1>
      <div className="card p-4 space-y-3">
        <div className="grid md:grid-cols-2 gap-3">
          <div className="card-sub p-3">
            <div className="muted text-xs mb-1">PDF dosyası</div>
            <input className="inp" type="file" accept="application/pdf" onChange={e=>setPdf(e.target.files?.[0]??null)} />
          </div>
          <div className="card-sub p-3">
            <div className="muted text-xs mb-1">Manifest (JSON, opsiyonel)</div>
            <textarea className="inp" rows={6} placeholder='{"sha256":"..."}' value={manifest} onChange={e=>setManifest(e.target.value)} />
            <div className="flex items-center gap-2 mt-2">
              <input className="inp w-40" placeholder="jobId" value={jobId} onChange={e=>setJobId(e.target.value)} />
              <button className="btn" onClick={async ()=>{
                try{
                  const p={ action:"reports.manifest", params:{ jobId }, dryRun:true, confirm_required:false, reason:"verify manifest" } as any;
                  const r=await fetch("/api/reports/manifest",{ method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify(p) });
                  if(!r.ok) throw new Error(`HTTP ${r.status}`);
                  const j=await r.json(); setManifest(JSON.stringify(j,null,2));
                }catch(e:any){ alert(e?.message ?? "Manifest alınamadı"); }
              }}>Manifesti getir</button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn" onClick={verify}>Doğrula</button>
          {status!=="idle" && <span className="muted text-xs">{status==="calc" ? "Hesaplanıyor…" : msg}</span>}
        </div>
        {hash && (
          <div className="card-sub p-3">
            <div className="muted text-xs mb-1">SHA-256</div>
            <pre className="pre break-all">{hash}</pre>
          </div>
        )}
      </div>
      <div className="muted text-sm">İpucu: İmzalı PDF indirirken eşlik eden manifest JSON’u executor’dan alıp buraya yapıştırabilirsiniz.</div>
    </main>
  );
}


