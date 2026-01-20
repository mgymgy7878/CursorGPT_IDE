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
  lastCandleTs?: number;
  lastDecisionTs?: number;
  lastSignal?: { type: string; ts: number; price: number; reason: string };
  pnl?: number;
  position?: { side: string; qty: number; entryPrice: number };
  equity?: number;
  loopIntervalMs?: number;
  lastError?: string;
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
  const [params, setParams] = useState<Record<string, any>>({ rsiEntry: 70, rsiExit: 75 });
  const [runId, setRunId] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [uiError, setUiError] = useState<string | null>(null);
  const [lastStartInfo, setLastStartInfo] = useState<{ status?: number; time?: string } | null>(null);
  const eventsEndRef = useRef<HTMLDivElement>(null);
  const esRef = useRef<EventSource | null>(null);

  // Apply default risk preset on mount
  useEffect(() => {
    const presets = {
      low: { qty: "0.0005", rsiEntry: 65, rsiExit: 75 },
      med: { qty: "0.001", rsiEntry: 70, rsiExit: 75 },
      high: { qty: "0.002", rsiEntry: 75, rsiExit: 80 },
    };
    const preset = presets[risk];
    setForm(prev => ({ ...prev, qty: preset.qty }));
    setParams({ rsiEntry: preset.rsiEntry, rsiExit: preset.rsiExit });
  }, []); // Only on mount

  // Fetch status helper
  const fetchStatus = async () => {
    try {
      const res = await fetch(`${EXECUTOR_URL}/api/exec/status`);
      const data = await res.json();
      setStatus(data);
      if (data.runId) setRunId(data.runId);
      return data;
    } catch (err) {
      console.error("Status poll error:", err);
      return null;
    }
  };

  // Hydration kanıtı
  useEffect(() => {
    console.info("[RunnerPanel] hydrated");
  }, []);

  // Poll status
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
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
    // Validation
    if (!form.symbol || !form.timeframe || !form.strategyId) {
      setUiError("Missing required fields: symbol, timeframe, or strategyId");
      return;
    }
    if (!form.qty || parseFloat(form.qty) <= 0) {
      setUiError("Invalid quantity: must be > 0");
      return;
    }

    setIsStarting(true);
    setUiError(null);
    setLastStartInfo(null);

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

      const status = res.status;
      const time = new Date().toLocaleTimeString();
      setLastStartInfo({ status, time });

      if (!res.ok) {
        let errorText = "";
        try {
          errorText = await res.text();
        } catch {
          errorText = `HTTP ${status}`;
        }
        throw new Error(`HTTP ${status}: ${errorText || "Unknown error"}`);
      }

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("Invalid JSON response");
      }

      if (data.ok) {
        setRunId(data.runId);
        // Immediately fetch status to get latest state
        await fetchStatus();
      } else {
        setUiError(data.error || "Failed to start");
      }
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      setUiError(errorMsg);
      console.error("Start error:", err);
    } finally {
      setIsStarting(false);
    }
  };

  const handleStop = async () => {
    if (!runId) {
      setUiError("No runId available");
      return;
    }

    setIsStopping(true);
    setUiError(null);

    try {
      const res = await fetch(`${EXECUTOR_URL}/api/exec/stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId }),
      });
      if (!res.ok) {
        let errorText = "";
        try {
          errorText = await res.text();
        } catch {
          errorText = `HTTP ${res.status}`;
        }
        throw new Error(`HTTP ${res.status}: ${errorText || "Unknown error"}`);
      }
      const data = await res.json();
      if (data.ok) {
        await fetchStatus();
      } else {
        setUiError(data.error || "Failed to stop");
      }
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      setUiError(errorMsg);
      console.error("Stop error:", err);
    } finally {
      setIsStopping(false);
    }
  };

  const filteredEvents = events.filter((e) => filter === "all" || e.type === filter);

  return (
    <div className="isolate relative z-0 rounded-2xl border border-white/10 bg-neutral-900/70 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] flex flex-col min-h-0 max-h-[calc(100vh-200px)]">
      {/* Header with sticky controls */}
      <div className="sticky top-0 z-[9999] pointer-events-auto bg-neutral-900/70 -m-4 p-4 pb-3 border-b border-white/5 mb-4">
        {/* Decorative backdrop overlay (pointer-events-none) */}
        <div className="absolute inset-0 backdrop-blur-sm pointer-events-none -z-10" />
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-sm font-semibold text-neutral-100">Strategy Runner</div>
            <div className="text-[11px] text-neutral-400 mt-0.5">Paper Trading</div>
          </div>
          <div className={`px-2 py-1 text-xs rounded ${status.running ? "bg-green-900 text-green-300" : "bg-neutral-800 text-neutral-400"}`}>
            {status.running ? "RUNNING" : "STOPPED"}
          </div>
        </div>

        {/* Debug info */}
        <div className="text-[9px] text-neutral-500 mb-2 space-y-0.5">
          <div>Executor: {EXECUTOR_URL}</div>
          {lastStartInfo && (
            <div>Last start: {lastStartInfo.status} @ {lastStartInfo.time}</div>
          )}
        </div>

        {/* Error Banner (sticky header içinde) */}
        {uiError && (
          <div className="mb-2 p-2 rounded bg-red-950/40 border border-red-800 text-[10px] text-red-400">
            <div className="flex items-center justify-between">
              <span>{uiError}</span>
              <button
                type="button"
                onClick={() => setUiError(null)}
                className="ml-2 text-red-300 hover:text-red-200 text-xs"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Controls moved to header */}
        <div className="relative z-[9999] pointer-events-auto flex gap-2">
          <button
            type="button"
            onPointerDownCapture={() => {
              console.info("[RunnerPanel] start pointerdown");
            }}
            onClick={(e) => {
              console.info("[RunnerPanel] start click", { status, isStarting, isStopping });
              e.preventDefault();
              e.stopPropagation();
              handleStart();
            }}
            disabled={status.running || isStarting || isStopping}
            className="flex-1 px-3 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded text-white relative z-[9999]"
          >
            {isStarting ? "Starting..." : "Start"}
          </button>
          <button
            type="button"
            onPointerDownCapture={() => {
              console.info("[RunnerPanel] stop pointerdown");
            }}
            onClick={(e) => {
              console.info("[RunnerPanel] stop click", { runId, status, isStopping });
              e.preventDefault();
              e.stopPropagation();
              handleStop();
            }}
            disabled={!status.running || !runId || isStarting || isStopping}
            className="flex-1 px-3 py-2 text-xs font-medium bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded text-white relative z-[9999]"
          >
            {isStopping ? "Stopping..." : "Stop"}
          </button>
          <button
            type="button"
            disabled
            title="Kill-switch + audit + keys vault olmadan açılmaz."
            className="px-3 py-2 text-xs font-medium bg-neutral-700 text-neutral-400 cursor-not-allowed rounded opacity-50"
          >
            LIVE (Disabled)
          </button>
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-3 -mx-4 px-4">
        {/* Risk Preset */}
        <div className="p-2 rounded bg-neutral-950/40 border border-white/5">
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
        <div className="grid grid-cols-2 gap-2">
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

        {/* Quick Health */}
        {status.running && (
          <div className="p-2 rounded bg-neutral-950/40 border border-white/5 text-[10px]">
          <div className="flex justify-between items-center mb-1">
            <span className="text-neutral-400">Health:</span>
            <div className="flex gap-3">
              <span className={status.lastCandleTs && Date.now() - status.lastCandleTs < 90000 ? "text-emerald-400" : "text-red-400"}>
                marketdata: {status.lastCandleTs && Date.now() - status.lastCandleTs < 90000 ? "OK" : "STALE"}
              </span>
              <span className={status.lastDecisionTs && Date.now() - status.lastDecisionTs < 30000 ? "text-emerald-400" : status.lastDecisionTs ? "text-yellow-400" : "text-neutral-500"}>
                executor: {status.lastDecisionTs && Date.now() - status.lastDecisionTs < 30000 ? "OK" : status.lastDecisionTs ? "STALE" : "WAIT"}
              </span>
            </div>
          </div>
          {status.lastError && (
            <div className="text-red-400 mt-1">Error: {status.lastError}</div>
          )}
        </div>
      )}


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
          {status.lastCandleTs && (
            <div className="flex justify-between">
              <span className="text-neutral-400">Last Candle:</span>
              <span className="text-neutral-100">
                {new Date(status.lastCandleTs).toLocaleTimeString()} ({Math.floor((Date.now() - status.lastCandleTs) / 1000)}s ago)
              </span>
            </div>
          )}
          {status.lastDecisionTs && (
            <div className="flex justify-between">
              <span className="text-neutral-400">Last Decision:</span>
              <span className="text-neutral-100">
                {new Date(status.lastDecisionTs).toLocaleTimeString()} ({Math.floor((Date.now() - status.lastDecisionTs) / 1000)}s ago)
              </span>
            </div>
          )}
          {status.loopIntervalMs && (
            <div className="flex justify-between">
              <span className="text-neutral-400">Loop Interval:</span>
              <span className="text-neutral-100">{status.loopIntervalMs}ms</span>
            </div>
          )}
          </div>
        )}

        {/* Event Filters */}
        <div className="flex gap-1">
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
        <div className="rounded bg-neutral-950/40 border border-white/5 p-2 max-h-[300px] overflow-y-auto">
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
    </div>
  );
}
