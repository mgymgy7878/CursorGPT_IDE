"use client";
import { useState } from "react";

export default function OrderTicket() {
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [side, setSide] = useState<"BUY"|"SELL">("BUY");
  const [type, setType] = useState<"MARKET"|"LIMIT">("MARKET");
  const [qty, setQty] = useState("0.0005");
  const [price, setPrice] = useState("");
  const [icebergQty, setIcebergQty] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      const body: any = { symbol, side, type, quantity: qty };
      if (type === "LIMIT" || (type as any) === "LIMIT_MAKER") { 
        body.price = price; 
        body.timeInForce = "GTC"; 
      }
      if (icebergQty) body.icebergQty = icebergQty;
      
      // Add idempotency key
      const headers: any = { "Content-Type": "application/json" };
      headers["X-Idempotency-Key"] = `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const r = await fetch("/api/private/order", { 
        method: "POST", 
        headers, 
        body: JSON.stringify(body) 
      });
      const j = await r.json();
      if (!r.ok) {
        alert(`Hata: ${j.error || j.msg || r.status}`);
      } else {
        alert(`OK: ${JSON.stringify(j)}`);
      }
    } catch (e) {
      alert(`Hata: ${e}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-3 rounded-xl border bg-yellow-50 border-yellow-200">
      <div className="font-semibold mb-2 text-yellow-800">Order Ticket (TESTNET)</div>
      <div className="grid grid-cols-2 gap-2">
        <input 
          className="border p-2 rounded border-yellow-300" 
          value={symbol} 
          onChange={e => setSymbol(e.target.value)} 
        />
        <select 
          className="border p-2 rounded border-yellow-300" 
          value={side} 
          onChange={e => setSide(e.target.value as any)}
        >
          <option>BUY</option>
          <option>SELL</option>
        </select>
        <select 
          className="border p-2 rounded border-yellow-300" 
          value={type} 
          onChange={e => setType(e.target.value as any)}
        >
          <option>MARKET</option>
          <option>LIMIT</option>
          <option>LIMIT_MAKER</option>
        </select>
        <input 
          className="border p-2 rounded border-yellow-300" 
          value={qty} 
          onChange={e => setQty(e.target.value)} 
          placeholder="Qty" 
        />
        {type === "LIMIT" && (
          <input 
            className="border p-2 rounded col-span-2 border-yellow-300" 
            value={price} 
            onChange={e => setPrice(e.target.value)} 
            placeholder="Limit Price" 
          />
        )}
        <input 
          className="border p-2 rounded border-yellow-300" 
          value={icebergQty} 
          onChange={e => setIcebergQty(e.target.value)} 
          placeholder="Iceberg Qty (optional)" 
        />
      </div>
      <button 
        className={`mt-3 px-4 py-2 rounded-xl border shadow ${
          loading 
            ? 'bg-gray-300 cursor-not-allowed' 
            : 'bg-yellow-600 text-white hover:bg-yellow-700'
        }`} 
        onClick={submit}
        disabled={loading}
      >
        {loading ? 'Sending...' : 'Send'}
      </button>
    </div>
  );
} 