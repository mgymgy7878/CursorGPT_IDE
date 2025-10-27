"use client";
import { useState } from "react";

export default function ActionBar({ getCode }: { getCode: ()=>string }) {
  const [busy, setBusy] = useState<string | null>(null);

  async function call(name:string, url:string){
    setBusy(name);
    try{
      await fetch(url, { method:"POST", headers:{"content-type":"application/json"},
                         body: JSON.stringify({ code: getCode() })});
    } finally { setBusy(null); }
  }

  return (
    <div className="pointer-events-auto sticky bottom-0 inset-x-0 p-3">
      <div className="mx-3 rounded-lg bg-black/50 backdrop-blur border border-neutral-800 px-3 py-2 flex flex-wrap gap-2">
        <button className="btn" onClick={()=>call("backtest","/api/strategy/backtest")} disabled={!!busy}>
          {busy==="backtest" ? "Backtest…" : "Backtest"}
        </button>
        <button className="btn" onClick={()=>call("opt","/api/strategy/optimize")} disabled={!!busy}>
          {busy==="opt" ? "Optimize…" : "Optimize Et"}
        </button>
        <button className="btn" onClick={()=>call("save","/api/strategy/save")} disabled={!!busy}>
          {busy==="save" ? "Kaydediliyor…" : "Kaydet"}
        </button>
        <span className="ml-auto text-xs opacity-70">TS/JS destekli</span>
      </div>
    </div>
  );
}
