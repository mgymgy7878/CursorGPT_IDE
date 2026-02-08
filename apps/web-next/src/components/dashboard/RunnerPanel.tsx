"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { uiCopy } from '@/lib/uiCopy';

type Status = {
  running: boolean;
  runId?: string;
  strategyId?: string;
  symbol?: string;
  timeframe?: string;
  mode?: string;
  lastTickTs?: number;
  lastCandleTs?: number;
  lastLoopTs?: number;
  lastDecisionTs?: number;
  lastSignal?: { type: string; ts: number; price: number; reason: string };
  pnl?: number;
  position?: { side: string; qty: number; entryPrice: number };
  equity?: number;
  loopIntervalMs?: number;
  lastError?: string;
  // Freshness metrics
  marketdataCandleTs?: number;
  marketdataAgeSec?: number;
  loopLagMs?: number;
  // Degraded state
  degraded?: boolean;
  degradedReason?: string;
};

type Event = {
  v: number;
  seq: number;
  ts: number;
  type: "log" | "signal" | "trade" | "status" | "error" | "decision" | "warning";
  data: any;
};

export default function RunnerPanel() {
  const [status, setStatus] = useState<Status>({ running: false });
  const [events, setEvents] = useState<Event[]>([]);
  const [filter, setFilter] = useState<"all" | "signal" | "trade" | "error" | "status" | "decision" | "warning">("all");
  const [sseState, setSseState] = useState<"connected" | "reconnecting" | "disconnected">("disconnected");
  const [form, setForm] = useState({ symbol: "BTCUSDT", timeframe: "1m", qty: "0.001", strategyId: "ema_rsi_v1" });
  const [risk, setRisk] = useState<"low" | "med" | "high">("med");
  const [params, setParams] = useState<Record<string, any>>({ rsiEntry: 70, rsiExit: 75 });
  const [runId, setRunId] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [uiError, setUiError] = useState<string | null>(null);
  const [lastStartInfo, setLastStartInfo] = useState<{ status?: number; time?: string } | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [lastClickTime, setLastClickTime] = useState<string | null>(null);
  const [executorReachable, setExecutorReachable] = useState<boolean>(true);
  const [lastExecError, setLastExecError] = useState<{ code: string; httpStatus?: number; detail?: string } | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const eventsEndRef = useRef<HTMLDivElement>(null);
  const esRef = useRef<EventSource | null>(null);
  const inFlightRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastErrRef = useRef<string | null>(null);

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

  // Normalize executor error
  const normalizeExecutorError = async (err: any, res?: Response): Promise<{ code: string; httpStatus?: number; detail?: string } | null> => {
    // HTTP 502
    if (res?.status === 502) {
      // Try to parse JSON body for detail
      try {
        const text = await res.clone().text();
        const json = JSON.parse(text);
        if (json.error === "executor_unreachable" || json.error?.includes("executor_unreachable")) {
          return { code: "EXECUTOR_UNREACHABLE", httpStatus: 502, detail: json.detail || json.error };
        }
      } catch {
        // Not JSON or parse failed
      }
      return { code: "EXECUTOR_UNREACHABLE", httpStatus: 502, detail: "fetch failed" };
    }
    // Network/fetch failed
    if (err?.message?.includes("fetch failed") || err?.name === "TypeError") {
      return { code: "EXECUTOR_UNREACHABLE", detail: err?.message || "Network error" };
    }
    // Try to parse JSON error response
    if (res) {
      try {
        const text = await res.clone().text();
        const json = JSON.parse(text);
        if (json.error === "executor_unreachable" || json.error?.includes("executor_unreachable")) {
          return { code: "EXECUTOR_UNREACHABLE", httpStatus: res.status, detail: json.detail || json.error };
        }
      } catch {
        // Not JSON
      }
    }
    return null;
  };

  // Fetch status helper - STABILIZED with useCallback + in-flight lock + abort
  const fetchStatus = useCallback(async () => {
    // In-flight guard: prevent overlapping fetches
    if (inFlightRef.current) {
      return null;
    }
    inFlightRef.current = true;

    // Create new AbortController for this fetch
    const ac = new AbortController();
    abortControllerRef.current = ac;

    try {
      const res = await fetch("/api/exec/status", {
        signal: ac.signal,
        cache: "no-store"
      });

      // Check for 502 or executor_unreachable
      if (res.status === 502) {
        const errorInfo = await normalizeExecutorError(null, res).catch(() => ({ code: "EXECUTOR_UNREACHABLE", httpStatus: 502 }));
        setExecutorReachable(false);
        setLastExecError(errorInfo);
        lastErrRef.current = "HTTP_502";
        return null;
      }

      if (!res.ok) {
        const text = await res.text();
        let json: any = {};
        try {
          json = JSON.parse(text);
        } catch {
          // Not JSON
        }
        if (json.error === "executor_unreachable" || json.error?.includes("executor_unreachable")) {
          const errorInfo = { code: "EXECUTOR_UNREACHABLE", httpStatus: res.status, detail: json.detail || json.error };
          setExecutorReachable(false);
          setLastExecError(errorInfo);
          lastErrRef.current = `HTTP_${res.status}`;
          return null;
        }
      }

      const data = await res.json();
      setStatus(data);
      if (data.runId) setRunId(data.runId);
      setExecutorReachable(true);
      setLastExecError(null);
      lastErrRef.current = null; // Clear error on success
      return data;
    } catch (err: any) {
      // Ignore aborted fetches
      if (err.name === "AbortError") {
        return null;
      }

      const errorInfo = await normalizeExecutorError(err).catch(() => null);
      if (errorInfo) {
        setExecutorReachable(false);
        setLastExecError(errorInfo);
        lastErrRef.current = err?.message || "FETCH_FAILED";
      }
      console.error("Status poll error:", err);
      return null;
    } finally {
      inFlightRef.current = false;
      abortControllerRef.current = null;
    }
  }, []); // Empty deps: setters are stable, normalizeExecutorError is declared above

  // Hydration kanıtı
  useEffect(() => {
    console.info("[RunnerPanel] hydrated");
    setIsHydrated(true);
  }, []);

  // Track previous degraded state to detect transitions + dedupe warnings
  const prevDegradedRef = useRef<{ degraded?: boolean; degradedReason?: string; lastWarningTs?: number }>({});
  const WARNING_DEDUPE_MS = 5 * 60 * 1000; // 5 minutes

  // Poll status with backoff: ONLINE -> 2-3s, OFFLINE/502 -> 10-15s
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let cancelled = false;

    const tick = async () => {
      const data = await fetchStatus();

      if (data) {
        // Detect degraded state transition (normal -> degraded) with dedupe
        if (data.degraded && data.degradedReason &&
            (!prevDegradedRef.current.degraded || prevDegradedRef.current.degradedReason !== data.degradedReason)) {
          const now = Date.now();
          const lastWarningTs = prevDegradedRef.current.lastWarningTs || 0;

          // Dedupe: Only emit if same reason wasn't warned in last 5 minutes
          if (now - lastWarningTs > WARNING_DEDUPE_MS || prevDegradedRef.current.degradedReason !== data.degradedReason) {
            // Emit warning event to Event Console with full context
            const warningEvent: Event = {
              v: 1,
              seq: Date.now(),
              ts: now,
              type: "warning",
              data: {
                message: `System degraded: ${data.degradedReason}`,
                reason: data.degradedReason,
                marketdataAgeSec: data.marketdataAgeSec,
                marketdataCandleTs: data.marketdataCandleTs,
                threshold: 125, // maxAgeSec for 1m timeframe
                source: "executor_guardrail",
              },
            };
            setEvents((prev) => {
              const next = [...prev, warningEvent];
              return next.slice(-200);
            });
            prevDegradedRef.current.lastWarningTs = now;
          }
        } else if (!data.degraded && prevDegradedRef.current.degraded) {
          // Cleared degraded state - reset lastWarningTs
          prevDegradedRef.current.lastWarningTs = undefined;
        }
        // Update previous state
        prevDegradedRef.current = {
          degraded: data.degraded,
          degradedReason: data.degradedReason,
        };
      }

      // Schedule next tick with backoff
      if (cancelled) return;

      // Backoff strategy: OFFLINE/error -> 10-15s, ONLINE -> 2-3s, max 60s
      const hasError = lastErrRef.current !== null;
      const baseInterval = hasError ? 12000 : 2500; // 12s offline, 2.5s online
      const jitter = Math.random() * 2000; // +0-2s jitter to prevent thundering herd
      const nextInterval = Math.min(baseInterval + jitter, 60000); // cap at 60s

      timeoutId = setTimeout(tick, nextInterval);
    };

    // Start first tick immediately
    tick();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      // Abort any in-flight fetch on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchStatus]);

  // SSE events (3-state: connected/reconnecting/disconnected)
  useEffect(() => {
    const es = new EventSource("/api/exec/events");
    esRef.current = es;
    setSseState("reconnecting");

    es.onopen = () => {
      setSseState("connected");
    };

    es.onmessage = (ev) => {
      // Ignore ping comments
      if (ev.data.trim() === "" || ev.data.startsWith(":")) {
        return;
      }

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
      // Only mark as disconnected if connection is fully closed
      if (es.readyState === EventSource.CLOSED) {
        setSseState("disconnected");
      } else {
        // CONNECTING or OPEN - treat as reconnecting
        setSseState("reconnecting");
      }
    };

    return () => {
      setSseState("disconnected");
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
    // Guard: Executor unreachable - NO optimistic state
    if (!executorReachable) {
      // Show inline feedback in health strip instead of changing button state
      setUiError(null);
      return;
    }

    // Guard: Already running
    if (status.running) {
      setUiError(null); // Clear any previous error
      // Show info message instead of error
      const infoMsg = status.runId
        ? `Runner already running (${status.strategyId || "ema_rsi_v1"} • ${status.symbol || "BTCUSDT"} • ${status.timeframe || "1m"} • runId: ${status.runId.substring(0, 12)}...). Use Stop to stop it first.`
        : "Runner already running. Use Stop to stop it first.";
      // Use info banner instead of error banner
      setUiError(infoMsg);
      return;
    }

    // Validation
    if (!form.symbol || !form.timeframe || !form.strategyId) {
      setUiError("Missing required fields: symbol, timeframe, or strategyId");
      return;
    }
    if (!form.qty || parseFloat(form.qty) <= 0) {
      setUiError("Invalid quantity: must be > 0");
      return;
    }

    // Quick reachability check before optimistic state
    if (!executorReachable) {
      // Don't enter optimistic state if unreachable
      return;
    }

    setIsStarting(true);
    setUiError(null);
    setLastStartInfo(null);

    try {
      const res = await fetch("/api/exec/start", {
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

      const statusCode = res.status;
      const time = new Date().toLocaleTimeString();
      setLastStartInfo({ status: statusCode, time });

      if (!res.ok) {
        let errorText = "";
        try {
          errorText = await res.text();
        } catch {
          errorText = `HTTP ${statusCode}`;
        }

        // Handle 400 "already running" as info, not error
        if (statusCode === 400 && errorText.includes("already running")) {
          const parsed = JSON.parse(errorText);
          const infoMsg = parsed.runId
            ? `Runner already running (runId: ${parsed.runId.substring(0, 12)}...). Use Stop to stop it first.`
            : "Runner already running. Use Stop to stop it first.";
          setUiError(infoMsg); // Info banner (will be styled differently)
          await fetchStatus(); // Refresh status
          return;
        }

        throw new Error(`HTTP ${statusCode}: ${errorText || "Unknown error"}`);
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
        // Success: clear any error
        setUiError(null);
      } else {
        setUiError(data.error || "Failed to start");
      }
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      // Only show as error if it's not "already running"
      if (!errorMsg.includes("already running")) {
        setUiError(errorMsg);
      } else {
        setUiError(`Runner already running. Use Stop to stop it first.`);
      }
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

    // Guard: Executor unreachable - NO optimistic state
    if (!executorReachable) {
      setUiError(null);
      return;
    }

    setIsStopping(true);
    setUiError(null);

    try {
      const res = await fetch("/api/exec/stop", {
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

        {/* Status Rozetleri (3 rozet: SSE, MD Freshness, Decision) */}
        {status.running && (
          <div className="flex items-center gap-2 mb-2 text-[10px]">
            {/* SSE Status (3-state) */}
            <div className={`px-2 py-0.5 rounded border ${
              sseState === "connected"
                ? "bg-emerald-500/15 text-emerald-300 border-emerald-400/30"
                : sseState === "reconnecting"
                ? "bg-amber-500/15 text-amber-300 border-amber-400/30"
                : "bg-red-500/15 text-red-300 border-red-400/30"
            }`}>
              SSE: {sseState === "connected" ? "Connected" : sseState === "reconnecting" ? "Reconnecting" : "Disconnected"}
            </div>

            {/* Marketdata Freshness */}
            {status.marketdataAgeSec !== undefined && (
              <div
                className={`px-2 py-0.5 rounded border cursor-help ${
                  status.degraded || (status.marketdataAgeSec > 125)
                    ? "bg-red-500/15 text-red-300 border-red-400/30"
                    : status.marketdataAgeSec > 90
                    ? "bg-amber-500/15 text-amber-300 border-amber-400/30"
                    : "bg-emerald-500/15 text-emerald-300 border-emerald-400/30"
                }`}
                title={
                  status.degraded && status.degradedReason
                    ? `Degraded: ${status.degradedReason}\nAge: ${status.marketdataAgeSec}s (max: 125s for 1m)\nSource: cache/binance_rest`
                    : `Age: ${status.marketdataAgeSec}s (max: 125s for 1m)\nSource: cache/binance_rest`
                }
              >
                MD: {status.marketdataAgeSec}s {status.degraded ? "(STALE)" : ""}
                {status.degraded && status.degradedReason && (
                  <span className="ml-1 text-[9px] opacity-70" title={`Reason: ${status.degradedReason}`}>
                    ⚠
                  </span>
                )}
              </div>
            )}

            {/* Decision Age */}
            {status.lastDecisionTs && (
              <div
                className={`px-2 py-0.5 rounded border cursor-help ${
                  status.degraded
                    ? "bg-amber-500/15 text-amber-300 border-amber-400/30"
                    : Date.now() - status.lastDecisionTs < 60000
                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-400/30"
                    : "bg-yellow-500/15 text-yellow-300 border-yellow-400/30"
                }`}
                title={
                  status.degraded && status.degradedReason
                    ? `Degraded: ${status.degradedReason}\nLast decision: ${new Date(status.lastDecisionTs).toLocaleTimeString()}\nAge: ${Math.floor((Date.now() - status.lastDecisionTs) / 1000)}s`
                    : `Last decision: ${new Date(status.lastDecisionTs).toLocaleTimeString()}\nAge: ${Math.floor((Date.now() - status.lastDecisionTs) / 1000)}s`
                }
              >
                Decision: {Math.floor((Date.now() - status.lastDecisionTs) / 1000)}s
                {status.degraded && status.degradedReason && (
                  <span className="ml-1 text-[9px] opacity-70" title={`Reason: ${status.degradedReason}`}>
                    ⚠
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Debug info */}
        <div className="text-[9px] text-neutral-500 mb-2 space-y-0.5">
          <div className="flex items-center gap-2">
            <span>Hydrated:</span>
            <span className={isHydrated ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold"}>
              {isHydrated ? "YES" : "NO"}
            </span>
          </div>
          {lastClickTime && (
            <div className="flex items-center gap-2">
              <span>Last Click:</span>
              <span className="text-yellow-400 font-semibold">{lastClickTime}</span>
            </div>
          )}
          <div>Proxy: /api/exec/* → {process.env.NEXT_PUBLIC_EXECUTOR_URL || "http://127.0.0.1:4001"}</div>
          {lastStartInfo && (
            <div>Last start: {lastStartInfo.status} @ {lastStartInfo.time}</div>
          )}
        </div>

        {/* Executor Health Strip (compact, shown when offline or degraded) */}
        {(!executorReachable || (status.degraded && status.degradedReason)) && (
          <div
            data-testid="runner-health-strip"
            role="status"
            aria-live="polite"
            className={`mb-2 h-8 flex items-center justify-between px-2 rounded border text-[10px] relative ${
              !executorReachable
                ? "bg-red-950/25 border-red-800/50"
                : "bg-amber-950/25 border-amber-800/50"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {!executorReachable ? (
                <>
                  <span className="text-red-400 font-semibold shrink-0">{uiCopy.systemHealth.executorOffline}</span>
                  {lastExecError?.httpStatus && (
                    <span className="text-red-300/70 shrink-0">({lastExecError.httpStatus})</span>
                  )}
                </>
              ) : (
                <>
                  <span className="text-amber-400 font-semibold shrink-0">
                    {status.degradedReason === 'MARKETDATA_STALE'
                      ? `${uiCopy.systemHealth.marketdataStale} (age: ${status.marketdataAgeSec}s)`
                      : status.degradedReason === 'MARKETDATA_UNAVAILABLE'
                      ? uiCopy.systemHealth.marketdataUnavailable
                      : `Degraded: ${status.degradedReason}`}
                  </span>
                </>
              )}
              {retrying && (
                <span className="text-amber-400 text-[9px] shrink-0">{uiCopy.systemHealth.retrying}</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                data-testid="health-retry"
                type="button"
                onClick={async () => {
                  setRetrying(true);
                  await fetchStatus();
                  setTimeout(() => setRetrying(false), 2000);
                }}
                disabled={retrying}
                className={`min-w-[60px] h-7 px-2 text-xs disabled:opacity-50 disabled:cursor-not-allowed border rounded transition-colors ${
                  !executorReachable
                    ? "bg-red-900/40 hover:bg-red-900/60 border-red-700/50 text-red-200"
                    : "bg-amber-900/40 hover:bg-amber-900/60 border-amber-700/50 text-amber-200"
                }`}
              >
                {uiCopy.systemHealth.retry}
              </button>
              {!executorReachable && (
                <>
                  <button
                    data-testid="health-copy-start"
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard.writeText("pnpm start:services");
                    }}
                    className="min-w-[60px] h-7 px-2 text-xs bg-red-900/40 hover:bg-red-900/60 border border-red-700/50 rounded text-red-200 transition-colors"
                  >
                    {uiCopy.systemHealth.copyStartCommand}
                  </button>
                  <button
                    data-testid="health-copy-diag"
                    type="button"
                    onClick={async () => {
                      const diagnostics = {
                        timestamp: new Date().toISOString(),
                        tsLocal: new Date().toLocaleString(),
                        tsUtc: new Date().toUTCString(),
                        route: window.location.pathname,
                        proxyTarget: "/api/exec/* → http://127.0.0.1:4001",
                        executor: {
                          reachable: false,
                          error: lastExecError,
                        },
                        appVersion: process.env.NEXT_PUBLIC_APP_VERSION || 'dev',
                        buildSha: process.env.NEXT_PUBLIC_BUILD_SHA || null,
                      };
                      await navigator.clipboard.writeText(JSON.stringify(diagnostics, null, 2));
                    }}
                    className="min-w-[60px] h-7 px-2 text-xs bg-red-900/40 hover:bg-red-900/60 border border-red-700/50 rounded text-red-200 transition-colors"
                  >
                    {uiCopy.systemHealth.copyDiagnostics}
                  </button>
                </>
              )}
              {lastExecError && (
                <button
                  type="button"
                  onClick={() => setShowDetails(!showDetails)}
                  className="min-w-[60px] h-7 px-2 text-xs bg-red-900/40 hover:bg-red-900/60 border border-red-700/50 rounded text-red-200 transition-colors"
                >
                  {showDetails ? '▾' : '▸'} {uiCopy.systemHealth.details}
                </button>
              )}
            </div>
            {showDetails && lastExecError && (
              <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-red-950/60 border border-red-800 rounded text-[9px] font-mono text-red-300/80 break-all z-50">
                {lastExecError.httpStatus && `HTTP ${lastExecError.httpStatus}`}
                {lastExecError.detail && ` • ${lastExecError.detail}`}
                {lastExecError.code && ` • Code: ${lastExecError.code}`}
                <div className="mt-1 text-[8px] text-red-300/60">
                  Proxy: /api/exec/* → http://127.0.0.1:4001
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error/Info Banner (sticky header içinde) - for other errors */}
        {uiError && executorReachable && (
          <div className={`mb-2 p-2 rounded border text-[10px] ${
            uiError.includes("already running") || uiError.includes("Runner already")
              ? "bg-blue-950/40 border-blue-800 text-blue-300"
              : "bg-red-950/40 border-red-800 text-red-400"
          }`}>
            <div className="flex items-center justify-between">
              <span>{uiError}</span>
              <button
                type="button"
                onClick={() => setUiError(null)}
                className={`ml-2 text-xs ${
                  uiError.includes("already running") || uiError.includes("Runner already")
                    ? "text-blue-200 hover:text-blue-100"
                    : "text-red-300 hover:text-red-200"
                }`}
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Running Info (when running) */}
        {status.running && status.runId && (
          <div className="mb-2 p-2 rounded bg-neutral-950/40 border border-white/5 text-[10px] text-neutral-300">
            <div className="flex items-center gap-2">
              <span className="text-neutral-400">Run:</span>
              <span className="text-emerald-300">{status.strategyId || "ema_rsi_v1"}</span>
              <span className="text-neutral-500">•</span>
              <span className="text-neutral-300">{status.symbol || "BTCUSDT"}</span>
              <span className="text-neutral-500">•</span>
              <span className="text-neutral-300">{status.timeframe || "1m"}</span>
              <span className="text-neutral-500">•</span>
              <span className="text-neutral-400">{status.mode || "paper"}</span>
              <span className="text-neutral-500">•</span>
              <span className="text-neutral-400 font-mono">runId: {status.runId.substring(0, 12)}...</span>
            </div>
          </div>
        )}

        {/* Controls moved to header */}
        <div className="relative z-[9999] pointer-events-auto flex gap-2">
          <button
            data-testid="runner-start"
            type="button"
            onPointerDownCapture={() => {
              console.info("[RunnerPanel] start pointerdown");
            }}
            onClick={(e) => {
              console.info("[RunnerPanel] start click", { status, isStarting, isStopping });
              setLastClickTime(new Date().toLocaleTimeString());
              e.preventDefault();
              e.stopPropagation();
              handleStart();
            }}
            disabled={!executorReachable || status.running || isStarting || isStopping}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded text-white relative z-[9999] ${
              !executorReachable
                ? "bg-emerald-600/30 hover:bg-emerald-600/40 disabled:opacity-60 disabled:cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            }`}
            title={
              !executorReachable
                ? "Executor Offline - service unreachable"
                : status.running
                ? `Runner already running (${status.runId ? status.runId.substring(0, 12) + "..." : "unknown"}). Use Stop first.`
                : undefined
            }
          >
            {isStarting ? uiCopy.runner.starting : status.running ? uiCopy.runner.running : !executorReachable ? uiCopy.systemHealth.startExecutorOffline : uiCopy.runner.start}
          </button>
          <button
            data-testid="runner-stop"
            type="button"
            onPointerDownCapture={() => {
              console.info("[RunnerPanel] stop pointerdown");
            }}
            onClick={(e) => {
              console.info("[RunnerPanel] stop click", { runId, status, isStopping });
              setLastClickTime(new Date().toLocaleTimeString());
              e.preventDefault();
              e.stopPropagation();
              handleStop();
            }}
            disabled={!executorReachable || !status.running || !runId || isStarting || isStopping}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded text-white relative z-[9999] ${
              !executorReachable
                ? "bg-red-600/30 hover:bg-red-600/40 disabled:opacity-60 disabled:cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            }`}
            title={
              !executorReachable
                ? "Executor Offline - cannot send stop command"
                : !status.running
                ? "Runner is not running"
                : undefined
            }
          >
            {isStopping ? uiCopy.runner.stopping : !status.running ? uiCopy.runner.alreadyStopped : !executorReachable ? uiCopy.systemHealth.stopExecutorOffline : uiCopy.runner.stop}
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
        <div className="flex gap-1 flex-wrap">
        {(["all", "status", "decision", "signal", "trade", "warning", "error"] as const).map((f) => (
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

        {/* Event Console (Mini) */}
        <div data-testid="event-console" className="rounded bg-neutral-950/40 border border-white/5 p-2 max-h-[300px] overflow-y-auto">
          <div className="text-[10px] text-neutral-400 mb-1 font-semibold">Event Console (last 50)</div>
          <div className="space-y-1">
            {filteredEvents.length === 0 ? (
              <div className="text-[11px] text-neutral-500 text-center py-4">No events</div>
            ) : (
              filteredEvents.slice(-50).map((event, idx) => {
                const summary = event.type === "decision"
                  ? `candleTs: ${event.data.candleTs || "N/A"}, reason: ${event.data.reason || "N/A"}`
                  : event.type === "warning"
                  ? event.data.message || JSON.stringify(event.data)
                  : event.type === "status"
                  ? `running: ${event.data.running}, ageSec: ${event.data.marketdataAgeSec || "N/A"}`
                  : typeof event.data === "object"
                  ? JSON.stringify(event.data).substring(0, 80) + (JSON.stringify(event.data).length > 80 ? "..." : "")
                  : String(event.data).substring(0, 80);

                const level = event.type === "error" ? "error" : event.type === "warning" ? "warning" : "info";
                const reason = event.data?.reason || null;
                const source = event.data?.source || null;

                return (
                  <div
                    key={`${event.seq}-${idx}`}
                    data-testid="event-item"
                    data-level={level}
                    data-reason={reason}
                    data-source={source}
                    className="text-[10px] font-mono border-l-2 pl-2 border-white/5"
                  >
                    <span className="text-neutral-500">{new Date(event.ts).toLocaleTimeString()}</span>
                    <span className="text-neutral-400 mx-1">•</span>
                    <span className={`${
                      event.type === "signal" ? "text-emerald-400" :
                      event.type === "trade" ? "text-blue-400" :
                      event.type === "error" ? "text-red-400" :
                      event.type === "warning" ? "text-amber-400" :
                      event.type === "decision" ? "text-cyan-400" :
                      event.type === "status" ? "text-yellow-400" :
                      "text-neutral-300"
                    }`}>
                      {event.type}
                    </span>
                    <span className="ml-2 text-neutral-200 text-[9px]">
                      {summary}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={eventsEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
