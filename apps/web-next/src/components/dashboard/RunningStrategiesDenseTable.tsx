/**
 * RunningStrategiesDenseTable - Dense table formatında çalışan stratejiler
 * Bloomberg/Finviz tarzı kompakt tablo görünümü
 * UI/UX Talimatları: §3.1 Dashboard P0 - Dense data mode
 */

"use client";

import React from "react";
import Link from "next/link";
import { cn, toDomId } from "@/lib/ui";
import useSWR from "swr";
import { t } from "@/lib/i18n";
import {
  normalizePercent,
  formatBacktestPercent,
  formatBacktestNumber,
} from "@/lib/backtest/formatBacktestMetric";
import { formatNumber } from "@/lib/format";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface StrategyRow {
  id: string;
  name: string;
  status: "running" | "inactive" | "paused" | "active";
  pnl_1d: number;
  sharpe_30d?: number | null;
  winrate_30d?: number | null;
  open_positions?: number;
  last_run_ms?: number;
  latency_ms?: number;
  sparkline_30d?: number[];
}

interface StrategyTableRowProps {
  strategy: StrategyRow;
}

function StrategyTableRow({ strategy }: StrategyTableRowProps) {
  const isRunning = strategy.status === "running";
  const isPositive = strategy.pnl_1d >= 0;
  const fmtUSD = new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });

  // Risk seviyesi hesaplama
  // undefined/null kontrolü: helper zaten "—" döndürür, ama risk hesaplaması için sayısal değer gerekli
  const sharpeValue = strategy.sharpe_30d ?? 0;
  const riskLevel =
    sharpeValue >= 1.5 ? "Low" : sharpeValue >= 1.0 ? "Medium" : "High";
  const riskColor =
    riskLevel === "Low"
      ? "bg-[var(--ok)]/20 text-[var(--ok)]"
      : riskLevel === "Medium"
        ? "bg-[var(--warn)]/20 text-[var(--warn)]"
        : "bg-[var(--err)]/20 text-[var(--err)]";

  const riskLabel =
    riskLevel === "Low"
      ? t("risk.low")
      : riskLevel === "Medium"
        ? t("risk.medium")
        : t("risk.high");

  // İşlem yaptığı semboller
  const symbols = strategy.name
    .split(" ")
    .filter((word: string) => /[A-Z]{2,}/.test(word))
    .slice(0, 3);

  // Pozisyon yönü ve büyüklüğü
  const positionDirection = isPositive ? "Long" : "Short";
  const positionSize =
    symbols.length > 0
      ? `0.${Math.floor(Math.random() * 5) + 1} ${symbols[0]?.replace("USDT", "") || ""}`
      : "-";
  const entryPrice = 63500;
  const currentPrice = 65000;
  const pnlPercent = (((currentPrice - entryPrice) / entryPrice) * 100).toFixed(
    2
  );

  // Tooltip ID'leri sanitize et
  const safeId = toDomId(strategy.id);
  const winTtId = `tt-winrate-30d-${safeId}`;
  const sharpeTtId = `tt-sharpe-30d-${safeId}`;

  return (
    <div
      className={cn(
        // Responsive grid: lg'de Win Rate, xl'de Sharpe görünür
        "grid gap-2 items-center",
        "py-1 px-2 border-b border-border-strong",
        "hover:bg-[var(--card)] transition-colors",
        "text-xs leading-tight",
        "min-h-[32px]",
        // Base: status + name + direction + entry + daily_pnl + total_pnl + risk
        "grid-cols-[12px_minmax(120px,1fr)_minmax(80px,0.8fr)_minmax(100px,1fr)_minmax(80px,0.8fr)_minmax(100px,1fr)_auto]",
        // lg: Win Rate eklenir
        "lg:grid-cols-[12px_minmax(120px,1fr)_minmax(80px,0.8fr)_minmax(100px,1fr)_minmax(80px,0.8fr)_minmax(100px,1fr)_minmax(70px,0.7fr)_auto]",
        // xl: Sharpe de eklenir
        "xl:grid-cols-[12px_minmax(120px,1fr)_minmax(80px,0.8fr)_minmax(100px,1fr)_minmax(80px,0.8fr)_minmax(100px,1fr)_minmax(70px,0.7fr)_minmax(70px,0.7fr)_auto]"
      )}
      role="row"
      aria-label={`${strategy.name}: ${isRunning ? t("status.active") : t("status.inactive")}`}
    >
      {/* Status dot */}
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full shrink-0 self-center",
          isRunning ? "bg-[var(--ok)]" : "bg-[var(--fg-muted)]"
        )}
        aria-label={isRunning ? t("status.active") : t("status.inactive")}
      />

      {/* Strateji Adı + Sembol */}
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="font-semibold text-white truncate">
          {strategy.name}
        </span>
        {symbols.length > 0 && (
          <span className="text-[10px] px-1 py-0.5 rounded bg-[var(--bg-2)] text-[var(--fg-muted)] shrink-0">
            {symbols[0]}
          </span>
        )}
      </div>

      {/* Yön/Size */}
      <div className="text-[var(--fg-muted)] truncate">
        <span
          className={cn(
            "font-medium",
            positionDirection === "Long"
              ? "text-[var(--ok)]"
              : "text-[var(--err)]"
          )}
        >
          {positionDirection}
        </span>{" "}
        <span className="tabular-nums">{positionSize}</span>
      </div>

      {/* Entry → Fiyat */}
      <div className="text-[var(--fg-muted)] tabular-nums text-[11px]">
        <span className="text-[10px]">{t("table.entry")}</span>{" "}
        {formatNumber(entryPrice)} →{" "}
        <span className="text-white">
          {formatNumber(currentPrice)}
        </span>
      </div>

      {/* Günlük P&L + % */}
      <div className="flex items-center gap-1">
        <span
          className={cn(
            "font-semibold tabular-nums",
            isPositive ? "text-[var(--ok)]" : "text-[var(--err)]"
          )}
        >
          {isPositive ? "+" : ""}
          {fmtUSD.format(strategy.pnl_1d)}
        </span>
        <span
          className={cn(
            "text-[10px] tabular-nums",
            isPositive ? "text-[var(--ok)]" : "text-[var(--err)]"
          )}
        >
          ({isPositive ? "+" : ""}
          {pnlPercent}%)
        </span>
      </div>

      {/* Toplam P&L */}
      <div
        className={cn(
          "text-xs tabular-nums",
          isPositive ? "text-[var(--ok)]" : "text-[var(--err)]"
        )}
      >
        {isPositive ? "+" : ""}
        {fmtUSD.format(strategy.pnl_1d * 1.2)}
      </div>

      {/* Win Rate 30d */}
      <div className="text-[var(--fg-muted)] tabular-nums text-[11px] text-right hidden lg:block relative">
        <span
          title="Son 30 günlük kazanma oranı"
          aria-describedby={winTtId}
          className="cursor-help focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--warn)] focus-visible:outline-offset-1 rounded"
          tabIndex={0}
        >
          {formatBacktestPercent(normalizePercent(strategy.winrate_30d))}
        </span>
        <span id={winTtId} role="tooltip" className="sr-only">
          Win Rate 30d: Son 30 günlük kazanma oranı
        </span>
      </div>

      {/* Sharpe 30d */}
      <div className="text-[var(--fg-muted)] tabular-nums text-[11px] text-right hidden xl:block relative">
        <span
          title="Son 30 günlük Sharpe oranı"
          aria-describedby={sharpeTtId}
          className="cursor-help focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--warn)] focus-visible:outline-offset-1 rounded"
          tabIndex={0}
        >
          {formatBacktestNumber(strategy.sharpe_30d)}
        </span>
        <span id={sharpeTtId} role="tooltip" className="sr-only">
          Sharpe 30d: Son 30 günlük Sharpe oranı
        </span>
      </div>

      {/* Risk */}
      <div className="flex items-center justify-end">
        <span
          className={cn(
            "text-[10px] px-1.5 py-0.5 rounded font-medium",
            riskColor
          )}
        >
          {riskLabel}
        </span>
      </div>
    </div>
  );
}

export default function RunningStrategiesDenseTable({
  className,
}: {
  className?: string;
}) {
  const { data: strategies, isLoading } = useSWR<StrategyRow[]>(
    "/api/strategies/active?limit=5",
    fetcher,
    {
      fallbackData: [
        {
          id: "1",
          name: "Momentum BTC",
          status: "running",
          pnl_1d: 245.5,
          sharpe_30d: 1.85,
          winrate_30d: 0.68,
          open_positions: 2,
          last_run_ms: Date.now() - 30000,
          latency_ms: 45,
          sparkline_30d: [
            20, 25, 30, 28, 35, 40, 38, 42, 45, 50, 48, 52, 55, 58, 60,
          ],
        },
        {
          id: "2",
          name: "Mean Reversion ETH",
          status: "running",
          pnl_1d: -12.3,
          sharpe_30d: 0.92,
          winrate_30d: 0.55,
          open_positions: 1,
          last_run_ms: Date.now() - 45000,
          latency_ms: 38,
          sparkline_30d: [
            50, 48, 45, 42, 40, 38, 35, 32, 30, 28, 25, 22, 20, 18, 15,
          ],
        },
        {
          id: "3",
          name: "Arbitrage USDT",
          status: "running",
          pnl_1d: 0,
          sharpe_30d: 2.1,
          winrate_30d: 0.72,
          open_positions: 0,
          last_run_ms: Date.now() - 3600000,
          latency_ms: 0,
          sparkline_30d: [
            30, 32, 35, 38, 40, 42, 45, 48, 50, 52, 55, 58, 60, 62, 65,
          ],
        },
      ],
    }
  );

  // Summary hesaplamaları
  const totalStrategies = strategies?.length || 0;
  const totalDailyPnL = strategies?.reduce((sum, s) => sum + s.pnl_1d, 0) || 0;
  const maxRisk =
    strategies?.reduce(
      (max, s) => {
        // undefined/null kontrolü
        const sharpeVal = s.sharpe_30d ?? 0;
        const risk =
          sharpeVal >= 1.5 ? "Low" : sharpeVal >= 1.0 ? "Medium" : "High";
        const riskOrder = { Low: 1, Medium: 2, High: 3 };
        return riskOrder[risk as keyof typeof riskOrder] >
          riskOrder[max as keyof typeof riskOrder]
          ? risk
          : max;
      },
      "Low" as "Low" | "Medium" | "High"
    ) || "Low";

  const maxRiskLabel =
    maxRisk === "Low"
      ? t("risk.low")
      : maxRisk === "Medium"
        ? t("risk.medium")
        : t("risk.high");

  const mostProfitable =
    strategies?.reduce(
      (best, s) => (s.pnl_1d > best.pnl_1d ? s : best),
      strategies[0]
    )?.name || "-";

  const fmtUSD = new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });

  return (
    <div
      className={cn(
        "flex flex-col min-h-0 overflow-hidden bg-[var(--card)] border border-border-strong rounded-lg",
        className
      )}
    >
      {/* Header: Başlık + Summary (tek satır) */}
      <div className="flex-none py-1 px-3 border-b border-border-strong flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-white shrink-0">
            {t("running.title")}
          </h2>
          <div className="flex items-center gap-2 text-[10px] text-[var(--fg-muted)] shrink-0">
            <span>
              <span className="text-white font-semibold">
                {totalStrategies}
              </span>{" "}
              {t("table.strategy_count")}
            </span>
            <span>·</span>
            <span>
              {t("table.daily_pnl_label")}{" "}
              <span
                className={cn(
                  "font-semibold tabular-nums",
                  totalDailyPnL >= 0 ? "text-[var(--ok)]" : "text-[var(--err)]"
                )}
              >
                {totalDailyPnL >= 0 ? "+" : ""}
                {fmtUSD.format(totalDailyPnL)}
              </span>
            </span>
            <span>·</span>
            <span>
              {t("table.open_position")}{" "}
              <span className="text-white font-semibold">
                {strategies?.reduce(
                  (sum, s) => sum + (s.open_positions || 0),
                  0
                ) || 0}
              </span>
            </span>
            <span>·</span>
            <span>
              {t("table.used_risk")}{" "}
              <span className="text-white font-semibold">%78</span>
            </span>
            <span>·</span>
            <span>
              {t("table.max_risk")}{" "}
              <span className="text-white font-semibold">{maxRiskLabel}</span>
            </span>
            <span>·</span>
            <span className="truncate">
              {t("table.most_profitable")}{" "}
              <span className="text-white font-semibold">{mostProfitable}</span>
            </span>
          </div>
        </div>
        <Link
          href="/running"
          className="inline-flex items-center gap-1 text-[11px] text-[var(--fg-muted)] hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-[var(--warn)] focus-visible:outline-offset-2 rounded shrink-0"
          rel="next"
          aria-label={`${t("table.view_all")} — ${t("running.title")}`}
        >
          {t("table.view_all")}
          <span className="inline-block size-3" aria-hidden="true">→</span>
        </Link>
      </div>

      {/* Table header */}
      <div
        className={cn(
          "flex-none grid gap-2 items-center py-0.5 px-2 bg-background-elevated border-b border-border-strong caption text-text-muted font-medium",
          // Responsive grid: lg'de Win Rate, xl'de Sharpe görünür
          "grid-cols-[12px_minmax(120px,1fr)_minmax(80px,0.8fr)_minmax(100px,1fr)_minmax(80px,0.8fr)_minmax(100px,1fr)_auto]",
          "lg:grid-cols-[12px_minmax(120px,1fr)_minmax(80px,0.8fr)_minmax(100px,1fr)_minmax(80px,0.8fr)_minmax(100px,1fr)_minmax(70px,0.7fr)_auto]",
          "xl:grid-cols-[12px_minmax(120px,1fr)_minmax(80px,0.8fr)_minmax(100px,1fr)_minmax(80px,0.8fr)_minmax(100px,1fr)_minmax(70px,0.7fr)_minmax(70px,0.7fr)_auto]"
        )}
        role="rowheader"
      >
        <span></span>
        <span>{t("table.strategy")}</span>
        <span>{t("table.direction_size")}</span>
        <span>{t("table.entry_price")}</span>
        <span>{t("table.daily_pnl")}</span>
        <span>{t("table.total_pnl")}</span>
        <span className="text-right hidden lg:block relative">
          <span
            title="Son 30 günlük kazanma oranı"
            aria-describedby="tt-header-winrate-30d"
            className="cursor-help focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--warn)] focus-visible:outline-offset-1 rounded"
            tabIndex={0}
          >
            Win Rate 30d
          </span>
          <span id="tt-header-winrate-30d" role="tooltip" className="sr-only">
            Win Rate 30d: Son 30 günlük kazanma oranı
          </span>
        </span>
        <span className="text-right hidden xl:block relative">
          <span
            title="Son 30 günlük Sharpe oranı"
            aria-describedby="tt-header-sharpe-30d"
            className="cursor-help focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--warn)] focus-visible:outline-offset-1 rounded"
            tabIndex={0}
          >
            Sharpe 30d
          </span>
          <span id="tt-header-sharpe-30d" role="tooltip" className="sr-only">
            Sharpe 30d: Son 30 günlük Sharpe oranı
          </span>
        </span>
        <span className="text-right">{t("table.risk")}</span>
      </div>

      {/* Table body */}
      <div
        className="flex-1 min-h-0 overflow-y-auto"
        role="table"
        aria-label={t("running.title")}
      >
        {isLoading ? (
          <div className="text-xs text-[var(--fg-muted)] py-4 text-center">
            {t("table.loading")}
          </div>
        ) : strategies && strategies.length > 0 ? (
          <>
            {strategies.slice(0, 5).map((strategy) => (
              <StrategyTableRow key={strategy.id} strategy={strategy} />
            ))}
            {strategies.length > 5 && (
              <div className="py-1 px-2 text-center text-[10px] text-[var(--fg-muted)]">
                +{strategies.length - 5} {t("table.more")}
              </div>
            )}
          </>
        ) : (
          <div className="text-xs text-[var(--fg-muted)] py-4 text-center">
            {t("table.no_active_strategy")}
          </div>
        )}
      </div>
    </div>
  );
}

