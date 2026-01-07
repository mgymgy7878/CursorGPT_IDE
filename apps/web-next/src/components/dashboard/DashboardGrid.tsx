/**
 * DashboardGrid - Figma Parity Dashboard Layout
 *
 * Grid structure matching Figma:
 * - Top Left: Portfolio Summary (inset mini panels)
 * - Top Right: Market Status (MiniList)
 * - Middle Left: Active Strategies (CompactTable)
 * - Middle Right: Risk Status (RiskBar)
 * - Bottom Left: Last AI Decisions (MiniList)
 * - Bottom Right: System Health (SystemHealthCard)
 */

"use client";

import { MiniList } from "@/components/ui/MiniList";
import { CompactTable } from "@/components/ui/CompactTable";
import { RiskBar } from "@/components/ui/RiskBar";
import { SystemHealthCard } from "@/components/ui/SystemHealthCard";
import { RuntimeHealthCard } from "@/components/dashboard/RuntimeHealthCard";
import { Surface } from "@/components/ui/Surface";
import { cardHeader, label, value, subtleText, miniStatCard, badgeVariant } from "@/styles/uiTokens";
import { cn } from "@/lib/utils";
import { uiCopy } from "@/lib/uiCopy";

export default function DashboardGrid() {
  // Mock data - executor kapalıyken bile aynı görünüm
  const portfolioData = {
    totalAssets: "$124,592.00",
    dailyPnL: {
      value: "+$1,240.50",
      isPositive: true,
    },
    dailyPnLLabel: "Last 24h",
    marginLevel: "1,240%",
    marginLevelLabel: "Healthy",
  };

  const marketData = [
    {
      label: "BTC/USDT",
      value: "42,150.00",
      delta: { value: "1.2%", isPositive: true }, // formatDelta helper will add sign and parentheses
    },
    {
      label: "ETH/USDT",
      value: "2,250.00",
      delta: { value: "0.5%", isPositive: false },
    },
    {
      label: "SOL/USDT",
      value: "98.50",
      delta: { value: "5.2%", isPositive: true },
    },
  ];

  const activeStrategies = [
    { name: "BTC Mean Rev", market: "Crypto", pnl: "+$450", pnlPositive: true },
    {
      name: "Gold Trend",
      market: "Commodities",
      pnl: "+$1,200",
      pnlPositive: true,
    },
    { name: "ETH Scalp", market: "Crypto", pnl: "-$120", pnlPositive: false },
  ];

  // PATCH W.5: AI karar mesajları uiCopy'den
  const aiDecisions = [
    {
      label: "BUY BTC/USDT",
      value: uiCopy.aiDecision.oversoldConditionMet,
      delta: { value: "98% Conf.", isPositive: true },
    },
    {
      label: "CLOSE ETH/USDT",
      value: uiCopy.aiDecision.takeProfitTargetHit,
      delta: { value: "100% Conf.", isPositive: true },
    },
  ];

  // Figma parity: grid gap-4/5, container padding yok (parent container'da)
  // Container-query ile top-row oranlı (Portfolio Summary daha geniş)
  return (
    <div className="dash-root min-w-0 w-full">
      {/* Top Row: Container-query ile oranlı 2 kolon (1.35fr 1fr) */}
      <div className="dash-top-row">
        {/* Top Left: Portfolio Summary - Figma parity: 3 mini panel yatay */}
        <Surface variant="card" className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className={cardHeader}>Portföy Özeti</div>
            <span className="text-neutral-500">•••</span>
          </div>
          {/* Figma parity: 3 mini panel yatay - flex ile responsive */}
          <div className="flex flex-col sm:flex-row gap-3" data-testid="portfolio-summary">
            {/* Mini Panel 1: Toplam Varlık */}
            <div className={cn(miniStatCard, "flex-1")}>
              <div className={label}>Toplam Varlık</div>
              <div className={cn(value, "mt-2 whitespace-nowrap")}>{portfolioData.totalAssets}</div>
              <div className="mt-1 space-y-0.5">
                <div className={cn("text-emerald-400", subtleText)}>+2.4%</div>
              </div>
            </div>

            {/* Mini Panel 2: Günlük PnL */}
            <div className={cn(miniStatCard, "flex-1")}>
              <div className={label}>Günlük PnL</div>
              <div className={cn(value, "mt-2 text-emerald-400 whitespace-nowrap")}>{portfolioData.dailyPnL.value}</div>
              <div className="mt-1">
                <div className={subtleText}>{portfolioData.dailyPnLLabel}</div>
              </div>
            </div>

            {/* Mini Panel 3: Margin Level */}
            <div className={cn(miniStatCard, "flex-1")}>
              <div className={label}>Margin Level</div>
              <div className={cn(value, "mt-2 text-emerald-400 whitespace-nowrap")}>{portfolioData.marginLevel}</div>
              <div className="mt-1">
                <div className={subtleText}>{portfolioData.marginLevelLabel}</div>
              </div>
            </div>
          </div>
        </Surface>

        {/* Top Right: Market Status */}
        <MiniList title="Piyasa Durumu" items={marketData} />
      </div>

      {/* PATCH R: Rest of the grid - section gap token */}
      <div
        className="grid grid-cols-1 lg:grid-cols-2 mt-5"
        style={{ gap: 'var(--section-gap, 12px)' }}
      >

        {/* Middle Left: Active Strategies */}
        <CompactTable
          title="Aktif Stratejiler"
          badge="12 Running"
          columns={[
            { header: "Strateji", accessor: "name" },
            { header: "Piyasa", accessor: "market" },
            {
              header: "PnL",
              accessor: "pnl",
              render: (value: string, row: any) => (
                <span
                  className={
                    row.pnlPositive ? "text-emerald-400" : "text-red-400"
                  }
                >
                  {value}
                </span>
              ),
            },
          ]}
          data={activeStrategies}
        />

        {/* Middle Right: Risk Status */}
        <Surface variant="card" className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className={cardHeader}>
              Risk Durumu
            </div>
            {/* Badge token kullanımı */}
            <span className={badgeVariant('warning')}>
              Moderate
            </span>
          </div>
          <div className="space-y-4">
            {/* Figma parity: Daily Drawdown ve Exposure progress bar'ları */}
            <RiskBar label="Daily Drawdown" value={1.2} variant="warning" />
            <RiskBar label="Exposure" value={65} variant="default" />
          </div>
        </Surface>

        {/* Bottom Left: Last AI Decisions */}
        <MiniList title="Son Yapay Zeka Kararları" items={aiDecisions} />

        {/* Bottom Right: Runtime Health */}
        <RuntimeHealthCard />
      </div>
    </div>
  );
}
