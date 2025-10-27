"use client";
import { useState } from "react";

export default function TWAPTicket(){
  const [symbol,setSymbol]=useState("BTCUSDT");
  const [side,setSide]=useState<"BUY"|"SELL">("BUY");
  const [totalQty,setTotalQty]=useState("0.005");
  const [slices,setSlices]=useState("5");
  const [type,setType]=useState<"MARKET"|"LIMIT">("MARKET");
  const [price,setPrice]=useState("");

  async function start(){
    const body:any={ symbol, side, totalQty, slices, type };
    if (type==="LIMIT") body.limitPrice = price;
    const r=await fetch("/api/private/order/twap",{ method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(body) });
    const j=await r.json();
    alert(`TWAP ${j.status}: ${j.id||""}`);
  }
  return (
    <div className="p-3 rounded-xl border space-y-2">
      <div className="font-semibold">TWAP (TESTNET)</div>
      <div className="grid grid-cols-2 gap-2">
        <input className="border p-2 rounded" value={symbol} onChange={e=>setSymbol(e.target.value)} />
        <select className="border p-2 rounded" value={side} onChange={e=>setSide(e.target.value as any)}><option>BUY</option><option>SELL</option></select>
        <input className="border p-2 rounded" value={totalQty} onChange={e=>setTotalQty(e.target.value)} placeholder="Total Qty" />
        <input className="border p-2 rounded" value={slices} onChange={e=>setSlices(e.target.value)} placeholder="Slices" />
        <select className="border p-2 rounded" value={type} onChange={e=>setType(e.target.value as any)}><option>MARKET</option><option>LIMIT</option></select>
        {type==="LIMIT" && <input className="border p-2 rounded col-span-2" value={price} onChange={e=>setPrice(e.target.value)} placeholder="Limit Price" />}
      </div>
      <button className="mt-2 px-4 py-2 rounded-xl border shadow" onClick={start}>Start TWAP</button>
    </div>
  );
} 