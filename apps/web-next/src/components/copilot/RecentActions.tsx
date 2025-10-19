"use client";
import { useEffect, useMemo, useState } from "react";
import { getRecent } from "@/lib/audit";
import { mergeJSON } from "@/lib/storage";
import { nowFileStamp } from "@/lib/time";

export default function RecentActions(){
  const [rows,setRows]=useState<any[]>([]);
  const [q,setQ]=useState("");
  const [sortKey,setSortKey]=useState<"ts"|"type"|"user">("ts");
  const [sortDir,setSortDir]=useState<"asc"|"desc">("desc");

  function load(){ try{ setRows(getRecent()); }catch{} }
  useEffect(()=>{ load(); const t=setInterval(load, 5000); return ()=>clearInterval(t); },[]);

  const filtered = useMemo(()=>{
    const needle = q.trim().toLowerCase();
    const arr = rows.filter(r=>{
      if(!needle) return true;
      const hay = `${String(r.type||"")} ${String(r.note||"")}`.toLowerCase();
      return hay.includes(needle);
    });
    const cmp = (a:any,b:any)=>{
      const av = a?.[sortKey];
      const bv = b?.[sortKey];
      if(av===bv) return 0;
      return (av>bv?1:-1) * (sortDir==='asc'? 1 : -1);
    };
    return arr.slice().sort((a,b)=>{
      const res = cmp(a,b);
      if(res!==0) return res;
      // stable-ish: ts ikincil anahtar (desc)
      return (b.ts - a.ts);
    });
  },[rows,q,sortKey,sortDir]);

  function downloadJSON(list:any[]){
    try{
      const name = `recent_actions_${nowFileStamp()}_${sortKey}.json`;
      const blob = new Blob([JSON.stringify(list,null,2)], { type: "application/json;charset=utf-8" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; a.click(); URL.revokeObjectURL(a.href);
    }catch{}
  }
  function downloadCSV(list:any[]){
    try{
      const cols = ["ts","type","auditId","id","requestId","user","note"];
      const esc = (v:any)=>`"${String(v??"").replace(/"/g,'""')}"`;
      const csv = [cols.join(","), ...list.map((r:any)=> cols.map(c=>esc(r[c])).join(","))].join("\n");
      const name = `recent_actions_${nowFileStamp()}_${sortKey}.csv`;
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; a.click(); URL.revokeObjectURL(a.href);
    }catch{}
  }

  function clearAll(){
    try{
      if(!rows?.length) return;
      if(!confirm("Geçmiş temizlensin mi?")) return;
      localStorage.setItem("recent_actions_v1","[]");
      load();
    }catch{}
  }

  return (
    <div className="card-sub p-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Son Eylemler</div>
        <div className="flex items-center gap-2">
          <label className="btn" aria-label="İçe aktar">
            İçe Aktar
            <input type="file" accept="application/json" style={{ display: 'none' }} onChange={async (e)=>{
              try{
                const f = e.target.files?.[0]; if(!f) return;
                const txt = await f.text();
                let data: any = JSON.parse(txt);
                if(data && typeof data === 'object' && Array.isArray(data.data) && data._schema === 1){
                  const merged = mergeJSON<any>("recent_actions_v1", data.data, (x:any)=>`${x.id||''}:${x.ts||''}`);
                  setRows(merged);
                }else if(Array.isArray(data)){
                  const merged = mergeJSON<any>("recent_actions_v1", data, (x:any)=>`${x.id||''}:${x.ts||''}`);
                  setRows(merged);
                }else{
                  alert("Geçersiz JSON: schema_v1 bekleniyor veya dizi.");
                }
                e.currentTarget.value = "";
              }catch{ alert("İçe aktarma başarısız oldu."); }
            }} />
          </label>
          <input className="inp" placeholder="Ara" aria-label="Eylem ara" value={q} onChange={e=>setQ(e.target.value)} />
          <label className="muted text-xs">Sırala</label>
          <select className="inp" value={sortKey} onChange={e=>setSortKey(e.target.value as any)} aria-label="Sıralama alanı">
            <option value="ts">zaman</option>
            <option value="type">eylem</option>
            <option value="user">kullanıcı</option>
          </select>
          <select className="inp" value={sortDir} onChange={e=>setSortDir(e.target.value as any)} aria-label="Artan azalan">
            <option value="asc">Artan</option>
            <option value="desc">Azalan</option>
          </select>
          <button className="btn" onClick={load} aria-label="Yenile">Yenile</button>
          <button className="btn" disabled={!filtered?.length} onClick={()=>downloadJSON(filtered)} aria-label="JSON indir">İndir JSON</button>
          <button className="btn" disabled={!filtered?.length} onClick={()=>downloadCSV(filtered)} aria-label="CSV indir">İndir CSV</button>
          <button className="btn-danger" disabled={!rows?.length} onClick={clearAll} aria-label="Temizle">Temizle</button>
        </div>
      </div>
      <ul className="mt-2 space-y-1">
        {filtered?.length? filtered.map((r,i)=>(
          <li key={i} className="text-xs">
            <span className="font-medium">{r.type}</span>
            {r.id? <> — <span className="mono">{r.id}</span></> : null}
            <span className="muted"> — {new Date(r.ts).toLocaleTimeString()}</span>
          </li>
        )): <li className="muted text-xs">Kayıt yok.</li>}
      </ul>
    </div>
  );
}


