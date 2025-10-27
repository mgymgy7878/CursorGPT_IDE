"use client";

import { useMemo, useState } from "react";
import OrderTicket from "@/components/OrderTicket";
import ConfirmGateModal from "@/components/trade/ConfirmGateModal";
import { useOrderConfirm } from "@/hooks/useOrderConfirm";

function TradeForm() {
  const { state, submit, close, dryRun, sendIntent } = useOrderConfirm();
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [type, setType] = useState("MARKET");
  const [qty, setQty] = useState("0.001");
  const [price, setPrice] = useState("");

  const body = useMemo(() => {
    const b: any = { symbol, side, type, quantity: qty };
    if (type === "LIMIT") {
      b.price = price;
      b.timeInForce = "GTC";
    }
    return b;
  }, [symbol, side, type, qty, price]);

  async function onSubmit() {
    await submit(body);
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <input className="border p-2 rounded" value={symbol} onChange={e=>setSymbol(e.target.value)} />
        <select className="border p-2 rounded" value={side} onChange={e=>setSide(e.target.value as any)}>
          <option value="BUY">BUY</option>
          <option value="SELL">SELL</option>
        </select>
        <select className="border p-2 rounded" value={type} onChange={e=>setType(e.target.value)}>
          <option value="MARKET">MARKET</option>
          <option value="LIMIT">LIMIT</option>
        </select>
        <input className="border p-2 rounded" value={qty} onChange={e=>setQty(e.target.value)} placeholder="Qty" />
        {type === "LIMIT" && (
          <input className="border p-2 rounded col-span-2" value={price} onChange={e=>setPrice(e.target.value)} placeholder="Limit Price" />
        )}
      </div>
      <div className="flex gap-2">
        <button className="px-3 py-2 rounded bg-emerald-600 text-white" onClick={onSubmit}>Gönder</button>
      </div>

      {state.open && state.request && (
        <ConfirmGateModal
          request={state.request}
          computedNotional={state.computedNotional}
          leverage={state.leverage}
          whitelistHit={state.whitelistHit}
          reason={state.reason}
          onDryRun={dryRun}
          onSendIntent={sendIntent}
          onClose={close}
        />
      )}
    </div>
  );
}

export default function TradePage() {
  const enabled = process.env.NEXT_PUBLIC_UI_FUTURES_V22 === "true";
  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-3">Trade</h1>
      {enabled ? (
        <TradeForm />
      ) : (
        <OrderTicket />
      )}
    </div>
  );
}


