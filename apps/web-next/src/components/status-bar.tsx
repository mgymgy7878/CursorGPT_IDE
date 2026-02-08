/**
 * TopStatusBar - Figma Parity v1
 *
 * 3-section layout (left/center/right) with overflow protection
 * Figma design: dark, thin, pill-based status indicators
 */

"use client";

import { StatusDot } from "./status-dot";
import { HealthPill } from "./status-pill";
import { SparkMark } from "./spark-mark";
import { useHeartbeat } from "@/hooks/useHeartbeat";
import { useWsHeartbeat } from "@/hooks/useWsHeartbeat";
import { useEngineHealth } from "@/hooks/useEngineHealth";
import { useWebNextHealth } from "@/hooks/useWebNextHealth";
import { useExecutorHealth } from "@/hooks/useExecutorHealth";
import {
  useMarketDataHealth,
  getFeedStatusLabel,
  getFeedStatusTone,
  getWsState,
} from "@/hooks/useMarketDataHealth";
import { useCheckpointStatus } from "@/hooks/useCheckpointStatus";
import { getSparkMode } from "@/lib/spark/config";
import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { startTransition } from "react";
import useSWR from "swr";
import { uiCopy } from "@/lib/uiCopy";
import { useCommandPalette } from "@/hooks/useCommandPalette";
import { OpsDrawer } from "./layout/OpsDrawer";
import { t } from "@/lib/i18n";
import { useLiveStatus } from "@/lib/live/useLiveStatus";
import { SystemHealthPopover } from "./system/SystemHealthPopover";
import { isMockMode } from "@/lib/marketClient";

// Live status endpoint'inden gerçek metrikler al
function useHealthzMetrics() {
  const { status } = useLiveStatus();

  // Fallback: Eski /api/healthz endpoint'i (geriye dönük uyumluluk)
  const { data: healthzData } = useSWR(
    "/api/healthz",
    async (url) => {
      const res = await fetch(url, { cache: "no-store" });
      return res.json();
    },
    { refreshInterval: 5000 }
  );

  // Live status varsa onu kullan, yoksa healthz fallback
  const liveMetrics = status?.metrics;
  const healthzSlo = healthzData?.slo;

  return {
    p95: liveMetrics?.p95Ms ?? healthzSlo?.latencyP95 ?? null,
    rtDelay:
      liveMetrics?.rtDelayMs ??
      (healthzSlo?.stalenessSec ? healthzSlo.stalenessSec * 1000 : null),
    orderBus: status?.executor?.ok ? "Sağlıklı" : "Degraded",
    transactions: liveMetrics?.tradeCount ?? 42,
    volume: liveMetrics?.volumeUsd ?? "1.2M$",
    alerts: liveMetrics?.alerts
      ? `${liveMetrics.alerts.active}/${liveMetrics.alerts.total}`
      : "1/3",
    // Service status
    apiOk: status?.api?.ok ?? true,
    feedOk: status?.feed?.ok ?? false,
    executorOk: status?.executor?.ok ?? false,
  };
}

// Breadcrumb mapping for pathnames
function getBreadcrumb(pathname: string | null): string | null {
  if (!pathname) return null;

  const routes: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/strategies": "Stratejiler",
    "/running": "Çalışan Stratejiler",
    "/market-data": "Piyasa Verileri",
    "/control": "Operasyon Merkezi",
    "/settings": "Ayarlar",
  };

  // Check exact match first
  if (routes[pathname]) return routes[pathname];

  // Check prefix matches (e.g., /control with tabs)
  if (pathname.startsWith("/control")) return "Operasyon Merkezi";
  if (pathname.startsWith("/strategies")) return "Stratejiler";
  if (pathname.startsWith("/market-data")) return "Piyasa Verileri";

  return null;
}

export default function StatusBar() {
  const pathname = usePathname();
  const router = useRouter();

  // Navigation optimization: startTransition for non-urgent navigations
  const navigateTo = (path: string) => {
    startTransition(() => {
      router.push(path);
    });
  };
  const { data, error, isLoading } = useHeartbeat();
  const wsOk = useWsHeartbeat();
  const { ok: engineOk } = useEngineHealth();
  const { ok: webNextOk } = useWebNextHealth();
  const { ok: executorOkOld, latencyMs: executorLatencyMs } =
    useExecutorHealth();
  const { health: marketDataHealth } = useMarketDataHealth();
  const { lastCheckpoint, isDirty, hasUiTouch } = useCheckpointStatus();
  const metrics = useHealthzMetrics();
  const breadcrumb = getBreadcrumb(pathname);

  // SSE state (simplified: use wsOk as proxy for SSE connection)
  const sseState = wsOk ? "connected" : "disconnected";

  // Live status'tan gelen service durumları (öncelikli)
  const apiOk = metrics.apiOk ?? (!error && !!data);
  const executorOk = metrics.executorOk ?? executorOkOld;
  const feedOk = metrics.feedOk ?? false;
  const barRef = useRef<HTMLDivElement>(null);
  const { open: openCommandPalette } = useCommandPalette();
  const [opsDrawerOpen, setOpsDrawerOpen] = useState(false);
  const [systemHealthOpen, setSystemHealthOpen] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const systemHealthRef = useRef<HTMLSpanElement>(null);

  // Mac/Windows mod tuşu belirleme
  const isMac =
    typeof window !== "undefined" &&
    /Mac|iPhone|iPad/.test(navigator.userAgent);
  const modKey = isMac ? "⌘" : "Ctrl";

  // PATCH I: Runtime topbar height measurement (SSR-safe)
  useLayoutEffect(() => {
    if (typeof window === "undefined" || !barRef.current) return;

    const updateHeight = () => {
      const height = barRef.current?.offsetHeight;
      if (height) {
        // Border/padding dahil gerçek yükseklik (Math.ceil ile yuvarla)
        document.documentElement.style.setProperty(
          "--app-topbar-h",
          `${Math.ceil(height)}px`
        );
      }
    };

    // İlk ölçüm
    updateHeight();

    // ResizeObserver ile dinamik güncelleme
    const observer = new ResizeObserver(updateHeight);
    if (barRef.current) {
      observer.observe(barRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // PATCH D: F1 hotkey handler for help
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F1") {
        e.preventDefault();
        navigateTo("/settings?tab=guide");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  // PATCH U: Dropdown menü click-outside handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const menu = document.getElementById("create-menu");
      const button = (e.target as HTMLElement)?.closest(
        'button[aria-label="Oluştur"]'
      );
      if (menu && !menu.contains(e.target as Node) && !button) {
        menu.classList.add("hidden");
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Dashboard'da TopStatusBar minimal olsun (Figma parity: terminal tarzı)
  const isDashboard = pathname === "/dashboard" || pathname === "/";

  // Track last successful ping times
  const [lastOkTimes, setLastOkTimes] = useState<Record<string, number>>({});

  useEffect(() => {
    const now = Date.now();
    if (webNextOk) setLastOkTimes((prev) => ({ ...prev, webnext: now }));
    if (executorOk) setLastOkTimes((prev) => ({ ...prev, executor: now }));
    if (sseState === "connected")
      setLastOkTimes((prev) => ({ ...prev, sse: now }));
  }, [webNextOk, executorOk, sseState]);

  const getLastOkText = (key: string) => {
    const lastOk = lastOkTimes[key];
    if (!lastOk) return "Never";
    const secondsAgo = Math.floor((Date.now() - lastOk) / 1000);
    if (secondsAgo < 60) return `${secondsAgo}s ago`;
    return `${Math.floor(secondsAgo / 60)}m ago`;
  };

  // DEV mode (her zaman true, local development için)
  const devOk = true;

  // Spark mode badge (TESTNET/PAPER - prod'da görünmez)
  const sparkMode = getSparkMode();
  const showModeBadge = sparkMode !== "prod";

  // System Mode: MOCK MODE veya Degraded durumu
  const isMock = isMockMode();
  const isDegraded =
    !executorOk ||
    !feedOk ||
    marketDataHealth.status === "stale" ||
    marketDataHealth.status === "disconnected";
  const systemMode = isMock ? "MOCK MODE" : isDegraded ? "Degraded" : null;

  // Dashboard için sadeleştirilmiş top bar (tek "Overall Health" + minimal metrikler)
  const isDashboardMinimal = isDashboard;

  return (
    <div
      ref={barRef}
      className="sticky top-0 z-50 border-b border-white/10 bg-[#0B0F14]/80 backdrop-blur"
    >
      <div className="mx-auto flex h-12 items-center gap-3 px-3">
        {/* LEFT: Brand + Canary + Mode Badge + Breadcrumb (shrink-0) */}
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-[3px] text-[13px] font-medium text-white/90 border border-white/10 leading-none">
            <SparkMark />
            <span>Spark Trading</span>
          </div>
          <div className="rounded-full bg-emerald-500/15 px-2 py-[3px] text-[13px] font-medium text-emerald-200 border border-emerald-400/30 leading-none">
            Canary
          </div>
          {/* TESTNET/PAPER rozeti (prod'da görünmez) */}
          {showModeBadge && (
            <div
              className={`rounded-full px-2 py-[3px] text-[13px] font-medium border leading-none ${
                sparkMode === "testnet"
                  ? "bg-amber-500/15 text-amber-200 border-amber-400/30"
                  : "bg-neutral-500/15 text-neutral-200 border-neutral-400/30"
              }`}
              title={`Spark Mode: ${sparkMode.toUpperCase()}`}
            >
              {sparkMode === "testnet" ? "TESTNET" : "PAPER"}
            </div>
          )}
          {/* System Mode: MOCK MODE / Degraded (global) */}
          {systemMode && (
            <div
              className={`rounded-full px-2 py-[3px] text-[13px] font-medium border leading-none ${
                systemMode === "MOCK MODE"
                  ? "bg-amber-500/15 text-amber-200 border-amber-400/30"
                  : "bg-orange-500/15 text-orange-200 border-orange-400/30"
              }`}
              title={
                systemMode === "MOCK MODE"
                  ? "Mock Mode: Simulated data"
                  : "Degraded: System operating in reduced capacity"
              }
            >
              {systemMode}
            </div>
          )}
          {/* UI-1: Breadcrumb (replaces page H1) - kontrast azaltıldı (secondary text) */}
          {breadcrumb && !isDashboard && (
            <>
              <span className="text-white/20 text-[10px]">/</span>
              <span className="text-[10px] text-white/50 font-normal">
                {breadcrumb}
              </span>
            </>
          )}
        </div>

        {/* MIDDLE: Health indicators + Metrics (flex-1, overflow-safe with edge fade) */}
        <div className="min-w-0 flex-1 relative overflow-hidden">
          {/* Edge fade mask (left) */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#0B0F14] to-transparent pointer-events-none z-10" />
          {/* Edge fade mask (right) */}
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0B0F14] to-transparent pointer-events-none z-10" />
          <div className="flex min-w-0 items-center gap-2 overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-2">
            {/* Dashboard Minimal Mode: Tek "Overall Health" pill */}
            {isDashboardMinimal ? (
              <HealthPill
                data-testid="overall-health-pill"
                ok={isDegraded ? "degraded" : true}
                label={isDegraded ? "DEGRADED" : "HEALTHY"}
                title={`Overall System Health: ${isDegraded ? "DEGRADED" : "HEALTHY"}\nAPI: ${apiOk ? "UP" : "DOWN"}\nFeed: ${feedOk ? "UP" : "DOWN"}\nExecutor: ${executorOk ? "UP" : "DOWN"}\nDetaylar için SystemHealthCard'a bakın`}
                onClick={() => setSystemHealthOpen(!systemHealthOpen)}
              />
            ) : (
              <>
                {/* Health Pills - Figma order: API | WS | Executor | DEV */}
                <HealthPill
                  data-testid="service-pill-api"
                  ok={apiOk}
                  label="API"
                  title={`API Status: ${apiOk ? "UP" : "DOWN"}`}
                />
                {/* P5.3: Feed dot renk eşlemesi - WS state'e göre */}
                {(() => {
                  // P7.1: WS state mapping'i tek helper'dan kullan (güvenli wrapper)
                  let wsStateInfo;
                  try {
                    wsStateInfo = getWsState(marketDataHealth);
                  } catch (e) {
                    console.error("[status-bar] getWsState error:", e);
                    // Fallback: basit mapping
                    wsStateInfo = {
                      state: marketDataHealth.wsConnected
                        ? "CONNECTED"
                        : ("DISCONNECTED" as const),
                      label: marketDataHealth.wsConnected
                        ? "CONNECTED"
                        : "DISCONNECTED",
                      color: marketDataHealth.wsConnected
                        ? "success"
                        : ("danger" as const),
                    };
                  }

                  const feedOkStatus =
                    wsStateInfo.color === "success"
                      ? true // Yeşil
                      : wsStateInfo.color === "warn"
                        ? "degraded" // Amber
                        : false; // Kırmızı

                  // P7.3: Kanal bazlı feed durumu tooltip (yaşlar ile)
                  const channelStatus = [
                    `WS: ${wsStateInfo.label} (age: ${Math.floor(marketDataHealth.ageMs / 1000)}s)`,
                    `Ticker: ${feedOk ? "OK (polling)" : "STALE"}`,
                    `Candles: ${marketDataHealth.status === "healthy" ? "OK" : marketDataHealth.status === "stale" ? "STALE" : "DEGRADED"}`,
                  ].join("\n");

                  return (
                    <HealthPill
                      data-testid="service-pill-md"
                      ok={feedOkStatus}
                      label="Feed"
                      title={`Market Data Feed: ${feedOk ? "UP" : "DOWN"}\n${channelStatus}\n${getFeedStatusLabel(marketDataHealth)}\nSource: ${marketDataHealth.source}\nAge: ${Math.floor(marketDataHealth.ageMs / 1000)}s`}
                    />
                  );
                })()}
                <HealthPill
                  data-testid="service-pill-ex"
                  ok={executorOk}
                  label="Executor"
                  latency={executorLatencyMs ?? null}
                  onClick={() => setSystemHealthOpen(!systemHealthOpen)}
                  title={`EX: ${executorOk ? "Açık" : "Kapalı (502)"}\n${!executorOk ? "HTTP 502: executor_unreachable\n" : ""}Latency: ${executorLatencyMs !== undefined ? `${executorLatencyMs}ms` : "N/A"}\nLast OK: ${getLastOkText("executor")}\nTıkla → Sistem Sağlığı`}
                />
                <HealthPill
                  ok={"degraded" as any} // DEV is always amber (mode indicator, not health)
                  label="DEV"
                  title="Development Mode"
                />
              </>
            )}

            {/* Divider (sadece non-dashboard'da göster) */}
            {!isDashboardMinimal && (
              <div className="w-px h-4 bg-white/10 shrink-0" />
            )}

            {/* Metrics - Dashboard'da minimal, diğer sayfalarda detaylı */}
            {!isDashboardMinimal && (
              <>
                <span className="text-[13px] text-white/60 tabular-nums whitespace-nowrap shrink-0 min-w-[52px] text-right font-medium">
                  P95: {metrics.p95 !== null ? `${metrics.p95}ms` : "—"}
                </span>
                <span className="text-white/35 shrink-0">·</span>
                <span className="text-[13px] text-white/60 tabular-nums whitespace-nowrap shrink-0 min-w-[52px] text-right font-medium">
                  <span className="hidden sm:inline">RT Delay: </span>
                  <span className="sm:hidden">RT: </span>
                  {metrics.rtDelay !== null ? `${metrics.rtDelay}ms` : "—"}
                </span>
                <span className="text-white/35 shrink-0">·</span>
              </>
            )}
            {/* Market Data Feed Health (real metrics) */}
            <span className="text-[13px] text-white/60 tabular-nums whitespace-nowrap shrink-0 min-w-[40px] text-right font-medium">
              <span className="hidden sm:inline">Feed: </span>
              <span
                className={
                  marketDataHealth.status === "healthy"
                    ? "text-emerald-300"
                    : marketDataHealth.status === "lagging"
                      ? "text-amber-400"
                      : "text-red-400"
                }
              >
                {marketDataHealth.status === "healthy"
                  ? "<3s"
                  : marketDataHealth.status === "lagging"
                    ? `${Math.floor(marketDataHealth.ageMs / 1000)}s`
                    : marketDataHealth.status === "stale"
                      ? `${Math.floor(marketDataHealth.ageMs / 1000)}s`
                      : "—"}
              </span>
            </span>
            <span className="text-white/35 shrink-0">·</span>
            <span className="text-[13px] whitespace-nowrap shrink-0 font-medium">
              <span className="hidden sm:inline text-white/60">OrderBus: </span>
              <span className="sm:hidden text-white/60">OB: </span>
              <span className="text-emerald-300">{metrics.orderBus}</span>
            </span>

            {/* System Status (SSE + MD + Executor) - Mini Cockpit (sadece non-dashboard'da) */}
            {!isDashboardMinimal && (
              <>
                <span className="text-white/35 shrink-0">·</span>
                <span className="relative shrink-0">
                  <span
                    ref={systemHealthRef}
                    data-testid="system-status"
                    className="text-[13px] whitespace-nowrap shrink-0 font-medium cursor-pointer hover:text-white/80 transition-colors"
                    title={`Click to open System Health popover\nSSE: ${sseState}\nMD: ${marketDataHealth.status} (${Math.floor(marketDataHealth.ageMs / 1000)}s)\nEX: ${executorOk ? "UP" : "OFFLINE"}${!executorOk ? " (502)" : ""}`}
                    onClick={() => setSystemHealthOpen(!systemHealthOpen)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      const diagnostics = {
                        timestamp: new Date().toISOString(),
                        tsLocal: new Date().toLocaleString(),
                        tsUtc: new Date().toUTCString(),
                        route: pathname,
                        proxyTarget: "/api/exec/* → http://127.0.0.1:4001",
                        sse: { state: sseState },
                        marketdata: {
                          status: marketDataHealth.status,
                          ageSec: Math.floor(marketDataHealth.ageMs / 1000),
                          source: marketDataHealth.source,
                          reconnects: marketDataHealth.reconnects,
                        },
                        executor: {
                          ok: executorOk,
                          latencyMs: executorLatencyMs,
                          error: !executorOk
                            ? { code: "EXECUTOR_UNREACHABLE", httpStatus: 502 }
                            : null,
                        },
                        appVersion:
                          process.env.NEXT_PUBLIC_APP_VERSION || "dev",
                        buildSha: process.env.NEXT_PUBLIC_BUILD_SHA || null,
                      };
                      navigator.clipboard.writeText(
                        JSON.stringify(diagnostics, null, 2)
                      );
                      // Visual feedback
                      const original = e.currentTarget.textContent;
                      e.currentTarget.setAttribute(
                        "data-testid",
                        "system-status-copied"
                      );
                      e.currentTarget.textContent = "Copied!";
                      setTimeout(() => {
                        if (e.currentTarget) {
                          e.currentTarget.textContent = original;
                          e.currentTarget.removeAttribute("data-testid");
                        }
                      }, 1000);
                    }}
                  >
                    <span className="hidden sm:inline text-white/60">
                      System:{" "}
                    </span>
                    <span
                      className={`${sseState === "connected" ? "text-emerald-300" : "text-red-400"}`}
                    >
                      SSE
                    </span>
                    <span className="text-white/35 mx-1">/</span>
                    <span
                      className={`${marketDataHealth.status === "healthy" ? "text-emerald-300" : marketDataHealth.status === "lagging" ? "text-amber-400" : "text-red-400"}`}
                    >
                      MD
                    </span>
                    <span className="text-white/35 mx-1">/</span>
                    <span
                      className={`${executorOk ? "text-emerald-300" : "text-red-400"}`}
                    >
                      EX
                    </span>
                  </span>
                  {systemHealthOpen && (
                    <SystemHealthPopover
                      sseState={sseState}
                      marketDataHealth={{
                        ...marketDataHealth,
                        status:
                          marketDataHealth.status === "disconnected"
                            ? "unavailable"
                            : marketDataHealth.status,
                      }}
                      executorOk={executorOk}
                      executorLatencyMs={executorLatencyMs}
                      lastOkTimes={lastOkTimes}
                      onClose={() => setSystemHealthOpen(false)}
                      onRetry={async () => {
                        setRetrying(true);
                        // Trigger status refresh
                        const res = await fetch("/api/exec/status", {
                          cache: "no-store",
                        });
                        if (res.ok) {
                          // Status will update via polling
                        }
                        setTimeout(() => setRetrying(false), 2000);
                      }}
                      retrying={retrying}
                    />
                  )}
                </span>
              </>
            )}

            {/* Checkpoint Status Badge (sadece non-dashboard'da) */}
            {!isDashboardMinimal && lastCheckpoint && (
              <>
                <span className="text-white/35 shrink-0">·</span>
                <span
                  className="text-[13px] whitespace-nowrap shrink-0 font-medium cursor-help"
                  title={`Last CP: ${lastCheckpoint}\nDirty: ${isDirty ? "yes" : "no"}\nUI-Touch: ${hasUiTouch ? "yes" : "no"}`}
                >
                  <span className="hidden sm:inline text-white/60">CP: </span>
                  <span
                    className={`${
                      isDirty
                        ? hasUiTouch
                          ? "text-amber-400"
                          : "text-yellow-400"
                        : "text-emerald-300"
                    }`}
                  >
                    {lastCheckpoint.replace("cp/", "").substring(0, 8)}
                  </span>
                  {isDirty && (
                    <span
                      className={`ml-1 ${hasUiTouch ? "text-amber-400" : "text-yellow-400"}`}
                    >
                      {hasUiTouch ? "⚠" : "•"}
                    </span>
                  )}
                </span>
              </>
            )}
          </div>
        </div>

        {/* RIGHT: Metrics + Actions + Ctrl+K Hint + Ops (shrink-0, whitespace-nowrap, min-width protection) */}
        <div className="flex shrink-0 items-center gap-2.5 whitespace-nowrap min-w-[fit-content]">
          {/* Dashboard'da sadece Alerts + Ops, diğer sayfalarda tüm metrikler */}
          {isDashboardMinimal ? (
            <>
              {/* Alerts sayacı */}
              {metrics.alerts && (
                <div className="flex items-center gap-1.5 text-[13px] text-white/70 font-medium shrink-0">
                  <span className="tabular-nums whitespace-nowrap">
                    Uyarılar: {metrics.alerts}
                  </span>
                </div>
              )}
            </>
          ) : (
            <>
              {/* İşlem · Hacim · Uyarılar (Figma separator style, consistent typography) */}
              <div className="flex items-center gap-1.5 text-[13px] text-white/70 font-medium shrink-0">
                <span className="tabular-nums whitespace-nowrap">
                  İşlem: {metrics.transactions}
                </span>
                <span className="text-white/35">·</span>
                <span className="tabular-nums whitespace-nowrap">
                  Hacim: {metrics.volume}
                </span>
                <span className="text-white/35">·</span>
                <span className="whitespace-nowrap">
                  Uyarılar: {metrics.alerts}
                </span>
              </div>
            </>
          )}

          {/* Action Buttons - Dashboard'da gizli (Figma parity: terminal tarzı minimal bar) */}
          {!isDashboard && (
            <>
              {/* Divider */}
              <div className="w-px h-4 bg-white/10 shrink-0" />

              {/* PATCH U: "+ Oluştur" dropdown (Strateji Oluştur + Uyarı Oluştur tek menüde) */}
              <div className="relative shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const menu = document.getElementById("create-menu");
                    if (menu) {
                      menu.classList.toggle("hidden");
                    }
                  }}
                  className="rounded-full bg-white/5 hover:bg-white/8 border border-white/10 px-3 py-[3px] text-[13px] font-medium text-white/90 transition-colors h-8 whitespace-nowrap leading-none flex items-center gap-1.5"
                  aria-label="Oluştur"
                >
                  <span>+</span>
                  <span>Oluştur</span>
                </button>
                <div
                  id="create-menu"
                  className="hidden absolute right-0 top-full mt-1 w-48 bg-neutral-900 border border-white/10 rounded-lg shadow-lg z-50 overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      startTransition(() => {
                        router.push("/strategy-lab");
                      });
                      document
                        .getElementById("create-menu")
                        ?.classList.add("hidden");
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-neutral-200 hover:bg-white/5 transition-colors"
                  >
                    {uiCopy.create.strategy}
                  </button>
                  <button
                    onClick={() => {
                      console.log("Create alert");
                      document
                        .getElementById("create-menu")
                        ?.classList.add("hidden");
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-neutral-200 hover:bg-white/5 transition-colors"
                  >
                    {uiCopy.create.alert}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Divider */}
          <div className="w-px h-4 bg-white/10 shrink-0" />

          {/* Ctrl+K Hint - WCAG 2.2 Target Size min 24x24 */}
          <button
            onClick={openCommandPalette}
            className="min-w-[24px] min-h-[24px] inline-flex items-center justify-center gap-1 px-1.5 py-[3px] rounded border border-white/10 bg-white/5 hover:bg-white/8 text-[11px] text-white/60 hover:text-white/80 transition-colors shrink-0 whitespace-nowrap"
            title={isMac ? t("common.cmdk_mac") : t("common.cmdk_win")}
            aria-label={isMac ? t("common.cmdk_mac") : t("common.cmdk_win")}
          >
            <kbd className="px-1 py-0.5 rounded text-[10px] font-mono border border-white/10 bg-white/5 shrink-0">
              {modKey}
            </kbd>
            <span className="text-white/30 shrink-0">+</span>
            <kbd className="px-1 py-0.5 rounded text-[10px] font-mono border border-white/10 bg-white/5 shrink-0">
              K
            </kbd>
            <span className="hidden md:inline ml-1 shrink-0">Komutlar</span>
          </button>

          {/* Ops Hızlı Yardım - WCAG 2.2 Target Size min 24x24 */}
          <button
            onClick={() => setOpsDrawerOpen(true)}
            className="min-w-[24px] min-h-[24px] inline-flex items-center justify-center px-1.5 py-[3px] rounded border border-sky-500/30 bg-sky-600/20 hover:bg-sky-600/30 text-[11px] font-medium text-sky-200 transition-colors shrink-0 whitespace-nowrap"
            title="Ops Hızlı Yardım"
            aria-label="Ops Hızlı Yardım"
          >
            <span className="hidden md:inline">Ops</span>
            <span className="md:hidden">🚑</span>
          </button>

          {/* Right Icons - WCAG 2.2 Target Size min 24x24 (w-6 h-6 = 24px) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigateTo("/settings?tab=guide")}
              className="min-w-[24px] min-h-[24px] w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Yardım (F1)"
              title="Yardım (F1)"
            >
              <span className="text-sm">❓</span>
            </button>
            <button
              className="min-w-[24px] min-h-[24px] w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Bildirimler"
            >
              <span className="text-sm">🔔</span>
            </button>
            <button
              className="min-w-[24px] min-h-[24px] w-6 h-6 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Kullanıcı menüsü"
            >
              <span className="text-xs">👤</span>
            </button>
          </div>

          {/* OpsDrawer */}
          <OpsDrawer
            open={opsDrawerOpen}
            onOpenChange={setOpsDrawerOpen}
            showButton={false}
          />
        </div>
      </div>
    </div>
  );
}
