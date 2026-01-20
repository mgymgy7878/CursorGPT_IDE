"use client";

import { useState, useEffect, useRef } from "react";

const EXECUTOR_URL = process.env.NEXT_PUBLIC_EXECUTOR_URL || "http://localhost:4001";

type Status = {
  running: boolean;
  runId?: string;
  strategyId?: string;
  symbol?: string;
  timeframe?: string;
  mode?: string;
  lastTickTs?: number;
  lastDecisionTs?: number;
  lastSignal?: { type: string; ts: number; price: number; reason: string };
  pnl?: number;
  position?: { side: string; qty: number; entryPrice: number };
  equity?: number;
};

type Event = {
  v: number;
  seq: number;
  ts: number;
  type: "log" | "signal" | "trade" | "status" | "error";
  data: any;
};

export default function RunnerPanel() {
  const [status, setStatus] = useState<Status>({ running: false });
  const [events, setEvents] = useState<Event[]>([]);
  const [filter, setFilter] = useState<"all" | "signal" | "trade" | "error" | "status">("all");
  const [form, setForm] = useState({ symbol: "BTCUSDT", timeframe: "1m", qty: "0.001", strategyId: "ema_rsi_v1" });
  const [risk, setRisk] = useState<"low" | "med" | "high">("med");
  const [params, setParams] = useState<Record<string, any>>({});
  const [runId, setRunId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const eventsEndRef = useRef<HTMLDivElement>(null);
  const esRef = useRef<EventSource | null>(null);

  // Poll status
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`${EXECUTOR_URL}/api/exec/status`);
        const data = await res.json();
        setStatus(data);
        if (data.runId) setRunId(data.runId);
      } catch (err) {
        console.error("Status poll error:", err);
      }
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, []);

  // SSE events
  useEffect(() => {
    const es = new EventSource(`${EXECUTOR_URL}/api/exec/events`);
    esRef.current = es;

    es.onmessage = (ev) => {
      try {
        const event = JSON.parse(ev.data) as Event;
        setEvents((prev) => {
          const next = [...prev, event];
          return next.slice(-200); // Keep last 200
        });
      } catch (err) {
        console.error("Event parse error:", err);
      }
    };

    es.onerror = () => {
      es.close();
    };

    return () => {
      es.close();
    };
  }, []);

  // Auto-scroll
  useEffect(() => {
    eventsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events]);

  // Apply risk preset
  const applyRiskPreset = () => {
    const presets = {
      low: { qty: "0.0005", rsiEntry: 65, rsiExit: 75 },
      med: { qty: "0.001", rsiEntry: 70, rsiExit: 75 },
      high: { qty: "0.002", rsiEntry: 75, rsiExit: 80 },
    };
    const preset = presets[risk];
    setForm({ ...form, qty: preset.qty });
    setParams({ rsiEntry: preset.rsiEntry, rsiExit: preset.rsiExit });
  };

  const handleStart = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${EXECUTOR_URL}/api/exec/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strategyId: form.strategyId,
          symbol: form.symbol,
          timeframe: form.timeframe,
          mode: "paper",
          params: { qty: parseFloat(form.qty) || 0.001, ...params },
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setRunId(data.runId);
        setStatus({ ...status, running: true, runId: data.runId });
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    if (!runId) return;
    setLoading(true);
    try {
      const res = await fetch(`${EXECUTOR_URL}/api/exec/stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatus({ ...status, running: false });
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter((e) => filter === "all" || e.type === filter);

  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900/70 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-semibold text-neutral-100">Strategy Runner</div>
          <div className="text-[11px] text-neutral-400 mt-0.5">Paper Trading</div>
        </div>
        <div className={`px-2 py-1 text-xs rounded ${status.running ? "bg-green-900 text-green-300" : "bg-neutral-800 text-neutral-400"}`}>
          {status.running ? "RUNNING" : "STOPPED"}
        </div>
      </div>

      {/* Risk Preset */}
      <div className="mb-3 p-2 rounded bg-neutral-950/40 border border-white/5">
        <div className="flex items-center gap-2 mb-2">
          <label className="text-[11px] text-neutral-400">Risk:</label>
          <select
            value={risk}
            onChange={(e) => setRisk(e.target.value as "low" | "med" | "high")}
            disabled={status.running}
            className="flex-1 px-2 py-1 text-xs bg-neutral-900 border border-white/10 rounded text-neutral-100 disabled:opacity-50"
          >
            <option value="low">Low (Conservative)</option>
            <option value="med">Med (Balanced)</option>
            <option value="high">High (Aggressive)</option>
          </select>
          <button
            onClick={applyRiskPreset}
            disabled={status.running}
            className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded text-white"
          >
            Apply
          </button>
        </div>
        <div className="text-[10px] text-neutral-500">
          {risk === "low" && "Qty: 0.0005, RSI Entry: <65, Exit: >75"}
          {risk === "med" && "Qty: 0.001, RSI Entry: <70, Exit: >75"}
          {risk === "high" && "Qty: 0.002, RSI Entry: <75, Exit: >80"}
        </div>
      </div>

      {/* Form */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div>
          <label className="text-[11px] text-neutral-400">Symbol</label>
          <input
            type="text"
            value={form.symbol}
            onChange={(e) => setForm({ ...form, symbol: e.target.value.toUpperCase() })}
            disabled={status.running}
            className="w-full mt-1 px-2 py-1.5 text-xs bg-neutral-950 border border-white/10 rounded text-neutral-100 disabled:opacity-50"
          />
        </div>
        <div>
          <label className="text-[11px] text-neutral-400">Timeframe</label>
          <select
            value={form.timeframe}
            onChange={(e) => setForm({ ...form, timeframe: e.target.value })}
            disabled={status.running}
            className="w-full mt-1 px-2 py-1.5 text-xs bg-neutral-950 border border-white/10 rounded text-neutral-100 disabled:opacity-50"
          >
            <option value="1m">1m</option>
            <option value="5m">5m</option>
            <option value="15m">15m</option>
            <option value="1h">1h</option>
          </select>
        </div>
        <div>
          <label className="text-[11px] text-neutral-400">Qty (BTC)</label>
          <input
            type="number"
            step="0.001"
            value={form.qty}
            onChange={(e) => setForm({ ...form, qty: e.target.value })}
            disabled={status.running}
            className="w-full mt-1 px-2 py-1.5 text-xs bg-neutral-950 border border-white/10 rounded text-neutral-100 disabled:opacity-50"
          />
        </div>
        <div>
          <label className="text-[11px] text-neutral-400">Strategy</label>
          <select
            value={form.strategyId}
            onChange={(e) => setForm({ ...form, strategyId: e.target.value })}
            disabled={status.running}
            className="w-full mt-1 px-2 py-1.5 text-xs bg-neutral-950 border border-white/10 rounded text-neutral-100 disabled:opacity-50"
          >
            <option value="ema_rsi_v1">EMA+RSI v1</option>
          </select>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={handleStart}
          disabled={status.running || loading}
          className="flex-1 px-3 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded text-white"
        >
          Start
        </button>
        <button
          onClick={handleStop}
          disabled={!status.running || !runId || loading}
          className="flex-1 px-3 py-2 text-xs font-medium bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded text-white"
        >
          Stop
        </button>
      </div>

      {/* Status */}
      {status.running && (
        <div className="mb-4 p-2 rounded bg-neutral-950/40 border border-white/5 text-[11px] space-y-1">
          <div className="flex justify-between">
            <span className="text-neutral-400">Symbol:</span>
            <span className="text-neutral-100">{status.symbol}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Timeframe:</span>
            <span className="text-neutral-100">{status.timeframe}</span>
          </div>
          {status.position && (
            <div className="flex justify-between">
              <span className="text-neutral-400">Position:</span>
              <span className="text-neutral-100">
                {status.position.side.toUpperCase()} {status.position.qty} @ {status.position.entryPrice.toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-neutral-400">PnL:</span>
            <span className={status.pnl && status.pnl >= 0 ? "text-emerald-400" : "text-red-400"}>
              {status.pnl ? (status.pnl >= 0 ? "+" : "") + status.pnl.toFixed(2) : "0.00"} USDT
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Equity:</span>
            <span className="text-neutral-100">{status.equity?.toFixed(2) || "10000.00"} USDT</span>
          </div>
          {status.lastTickTs && (
            <div className="flex justify-between">
              <span className="text-neutral-400">Last Candle:</span>
              <span className="text-neutral-100">{new Date(status.lastTickTs).toLocaleTimeString()}</span>
            </div>
          )}
          {status.lastSignal && (
            <div className="flex justify-between">
              <span className="text-neutral-400">Last Decision:</span>
              <span className="text-neutral-100">{new Date(status.lastSignal.ts).toLocaleTimeString()}</span>
            </div>
          )}
        </div>
      )}

      {/* Event Filters */}
      <div className="flex gap-1 mb-2">
        {(["all", "signal", "trade", "error", "status"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2 py-1 text-[10px] rounded ${
              filter === f ? "bg-emerald-600 text-white" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Events Log */}
      <div className="flex-1 min-h-0 overflow-auto rounded bg-neutral-950/40 border border-white/5 p-2">
        <div className="space-y-1">
          {filteredEvents.length === 0 ? (
            <div className="text-[11px] text-neutral-500 text-center py-4">No events</div>
          ) : (
            filteredEvents.map((event, idx) => (
              <div key={`${event.seq}-${idx}`} className="text-[10px] font-mono">
                <span className="text-neutral-500">[{new Date(event.ts).toLocaleTimeString()}]</span>
                <span className={`ml-2 ${
                  event.type === "signal" ? "text-emerald-400" :
                  event.type === "trade" ? "text-blue-400" :
                  event.type === "error" ? "text-red-400" :
                  event.type === "status" ? "text-yellow-400" :
                  "text-neutral-300"
                }`}>
                  [{event.type}]
                </span>
                <span className="ml-2 text-neutral-200">
                  {typeof event.data === "object" ? JSON.stringify(event.data, null, 0) : String(event.data)}
                </span>
              </div>
            ))
          )}
          <div ref={eventsEndRef} />
        </div>
      </div>
    </div>
  );
}
