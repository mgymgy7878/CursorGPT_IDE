"use client";

import { useEffect } from "react";
import { useTerminalState } from "@/lib/terminal/useTerminalState";

const orderBookRows = Array.from({ length: 10 }).map((_, idx) => idx);
const positionRows = Array.from({ length: 8 }).map((_, idx) => idx);

export default function TerminalPage() {
  const { setSelectedSymbol } = useTerminalState();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const symbol = new URLSearchParams(window.location.search).get("symbol");
    if (symbol) {
      setSelectedSymbol(symbol.toUpperCase());
    }
  }, [setSelectedSymbol]);

  return (
    <div
      className="h-full min-h-0 overflow-hidden flex flex-col gap-3"
      data-testid="terminal-north-star"
    >
      <header className="flex items-center justify-between gap-4">
        <div>
          <div className="text-lg font-semibold text-neutral-100">Terminal</div>
          <div className="text-[12px] text-neutral-400">North-Star Workspace</div>
        </div>
        <div className="text-[11px] text-neutral-500">Chart / Order Book</div>
      </header>

      <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_280px] gap-3">
        <div className="flex flex-col min-h-0 gap-3">
          <div className="rounded-2xl border border-white/10 bg-neutral-900/70 p-4 flex flex-col min-h-[260px]">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-neutral-100">
                Chart
              </div>
              <div className="text-[10px] text-neutral-400">BTCUSDT · 1H</div>
            </div>
            <div className="mt-3 flex-1 rounded-xl border border-white/5 bg-neutral-950/40 flex items-center justify-center text-xs text-neutral-500">
              TradingView placeholder
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-neutral-900/70 p-4 flex flex-col min-h-0">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-neutral-100">
                Positions
              </div>
              <div className="flex items-center gap-2 text-[10px] text-neutral-400">
                <span className="rounded-full bg-white/5 px-2 py-1 border border-white/10">Open Positions</span>
                <span className="rounded-full px-2 py-1 border border-white/10">Open Orders</span>
              </div>
            </div>
            <div className="mt-3 flex-1 min-h-0 overflow-auto">
              <div className="grid gap-2">
                {positionRows.map((row) => (
                  <div
                    key={row}
                    className="grid grid-cols-[1fr_auto_auto] items-center rounded-lg border border-white/5 bg-neutral-950/40 px-3 py-2 text-[12px]"
                  >
                    <div className="text-neutral-200">ETHUSDT</div>
                    <div className="text-neutral-400">LONG</div>
                    <div className="text-emerald-300/80">+{row + 0.4}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <aside className="flex flex-col min-h-0 gap-3">
          <div className="rounded-2xl border border-white/10 bg-neutral-900/70 p-4 flex flex-col min-h-[220px]">
            <div className="text-sm font-semibold text-neutral-100">Order Book</div>
            <div className="mt-3 flex-1 min-h-0 overflow-auto">
              <div className="grid gap-2">
                {orderBookRows.map((row) => (
                  <div
                    key={row}
                    className="flex items-center justify-between rounded-lg border border-white/5 bg-neutral-950/40 px-3 py-2 text-[12px]"
                  >
                    <div className="text-neutral-200">43,2{row}</div>
                    <div className="text-neutral-400">0.{row}8</div>
                    <div className="text-emerald-300/80">+{row + 1.2}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-neutral-900/70 p-4 flex flex-col min-h-0">
            <div className="text-sm font-semibold text-neutral-100">Buy / Sell</div>
            <div className="mt-3 grid gap-2 text-[12px] text-neutral-400">
              <div className="rounded-lg border border-white/5 bg-neutral-950/40 px-3 py-2">
                Price
              </div>
              <div className="rounded-lg border border-white/5 bg-neutral-950/40 px-3 py-2">
                Amount
              </div>
              <div className="grid grid-cols-4 gap-2">
                {["25%", "50%", "75%", "100%"].map((pct) => (
                  <div
                    key={pct}
                    className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-center text-[11px]"
                  >
                    {pct}
                  </div>
                ))}
              </div>
              <div className="rounded-lg bg-emerald-600/80 text-center text-white py-2">
                Buy (placeholder)
              </div>
              <div className="rounded-lg bg-red-600/80 text-center text-white py-2">
                Sell (placeholder)
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
