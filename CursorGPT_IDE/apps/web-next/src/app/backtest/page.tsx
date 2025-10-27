"use client";
import React from "react";

export default function BacktestPage() {
  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Backtest</h1>

      <div className="rounded-xl border border-white/10 p-4">
        <p className="opacity-80">
          Backtest paneli hazır. Executor çalışıyorsa aşağıdaki hızlı test ile kuyruğa bir iş atabiliriz.
        </p>

        <div className="mt-4 flex gap-3">
          <button
            className="rounded-xl px-4 py-2 border border-white/10 hover:bg-white/5"
            onClick={async () => {
              const res = await fetch("http://127.0.0.1:4001/api/backtest/start", {
                method: "POST",
                headers: {
                  "content-type": "application/json",
                  "x-admin-token": "test-secret-123",
                },
                body: JSON.stringify({ pair: "ETHUSDT", timeframe: "4h", notes: "UI smoke" }),
              });
              const txt = await res.text();
              alert(`Executor response: ${res.status} ${txt.slice(0, 200)}`);
            }}
          >
            Hızlı Başlat (ETHUSDT 4h)
          </button>

          <button
            className="rounded-xl px-4 py-2 border border-white/10 hover:bg-white/5"
            onClick={async () => {
              const res = await fetch("http://127.0.0.1:4001/api/backtest/status");
              const txt = await res.text();
              alert(`Status: ${res.status}\n${txt.slice(0, 400)}`);
            }}
          >
            Durumu Al
          </button>
        </div>
      </div>
    </main>
  );
}
