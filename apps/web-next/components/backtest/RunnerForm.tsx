"use client";
import { useState } from "react";
export default function RunnerForm(){
  const [symbol,setSymbol]=useState("BTCUSDT");
  const [tf,setTf]=useState("1h");
  const [win,setWin]=useState("30d");
  function toSlash(){
    const cmd=`/backtest.run symbol=${symbol} tf=${tf} window=${win} --json`;
    window.dispatchEvent(new CustomEvent("spark.prefill",{detail:{cmd}}));
  }
  return (
    <div className="p-3 rounded-2xl border bg-white shadow-sm space-y-2">
      <div className="font-semibold">Backtest Runner</div>
      <div className="grid grid-cols-3 gap-2">
        <input className="border rounded px-2 py-1" value={symbol} onChange={e=>setSymbol(e.target.value)} placeholder="symbol"/>
        <input className="border rounded px-2 py-1" value={tf} onChange={e=>setTf(e.target.value)} placeholder="tf (1h/4h)"/>
        <input className="border rounded px-2 py-1" value={win} onChange={e=>setWin(e.target.value)} placeholder="window (30d)"/>
      </div>
      <button onClick={toSlash} className="text-sm px-3 py-1.5 border rounded hover:bg-neutral-50">Slash’a çevir</button>
      <div className="text-xs text-neutral-500">Çıktı: SSE progress (%), ardından event: json içinde equity+trades.</div>
    </div>
  );
} 