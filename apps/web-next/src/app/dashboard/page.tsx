"use client";
export const dynamic = "force-dynamic";

import PageHeader from "@/components/layout/PageHeader";
import SummaryStrip from "@/components/dashboard/SummaryStrip";
import KpiCard from "@/components/ui/KpiCard";
import LiveMarketCard from "@/components/marketdata/LiveMarketCard";
import ErrorBudgetBadge from "@/components/ops/ErrorBudgetBadge";
import EmptyState from "@/components/ui/EmptyState";
import { thresholdStatus } from "@/lib/format";
import { useUnifiedStatus } from "@/hooks/useUnifiedStatus";
import { useHeartbeat } from "@/hooks/useHeartbeat";
import { t } from "@/lib/i18n";
import React from "react";

export default function DashboardPage() {
  // PR-8: Unified status for summary strip
  const { api, ws, executor } = useUnifiedStatus();
  const { data: heartbeatData } = useHeartbeat();
  const errorBudget = heartbeatData?.errorBudget ?? 0;

  // P0.2 Fix: Standardize units - latency in ms, staleness in seconds
  const p95Ms = 58;
  const p95TargetMs = 1200;
  const stalenessSeconds = 0;
  const stalenessThresholdSeconds = 30;

  // Calculate status based on thresholds
  const p95Status = thresholdStatus(p95Ms, p95TargetMs, true);
  const stalenessStatus = thresholdStatus(stalenessSeconds, stalenessThresholdSeconds, true);

  const handleCreateStrategy = () => {
    window.location.href = "/strategy-lab";
  };

  const handleCreateAlert = () => {
    // TODO: Open alert creation modal
    console.log("Create alert");
  };

  return (
    <div className="px-6 py-4 min-h-screen bg-neutral-950">
      <PageHeader
        title={
          <div className="flex items-center gap-2">
            Spark Trading
            <ErrorBudgetBadge />
          </div>
        }
        subtitle="Dashboard"
        sticky
        chips={[
          { label: `Hedef: ${p95TargetMs} ms`, tone: "muted" },
          { label: `Eşik: ${stalenessThresholdSeconds} sn`, tone: "muted" },
        ]}
        actions={[
          { label: t("actions.createStrategy"), onClick: handleCreateStrategy },
          {
            label: t("actions.createAlert"),
            variant: "ghost",
            onClick: handleCreateAlert,
          },
        ]}
      />

      {/* PR-8: At-a-glance summary strip */}
      <SummaryStrip
        data={{
          errorBudget: errorBudget * 100,
          api,
          ws,
          executor,
          balance: 12847.50, // Mock
          pnl24h: 1247.50, // Mock
          runningStrategies: 0, // Mock
          activeAlerts: 0, // Mock
        }}
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
        {/* Left column - Main content */}
        <div className="grid gap-4">
          {/* Metrics row - P0.2 Fix: Standardized units (ms for latency, s for staleness) */}
          <div className="grid md:grid-cols-2 gap-4">
            <KpiCard
              label="P95 Gecikme"
              value={`${p95Ms} ms`}
              hint={`Hedef: ${p95TargetMs} ms`}
              status={p95Status}
              className="tabular"
            />
            <KpiCard
              label="Güncellik Gecikmesi"
              value={`${stalenessSeconds} sn`}
              hint={`Eşik: ${stalenessThresholdSeconds} sn`}
              status={stalenessStatus}
              className="tabular"
            />
          </div>

          {/* Cards row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Alarm Drafts Card - P0.3 Fix: Consistent EmptyState */}
            <div className="rounded-2xl bg-card/60 p-4 min-h-[200px]">
              <div className="text-sm font-medium mb-2">
                {t("dashboard.alarmDrafts")}
              </div>
              <EmptyState
                icon="Clipboard"
                title={t("noData")}
                description={t("noAlarmDrafts")}
                action={{
                  label: t("createAlert"),
                  onClick: handleCreateAlert,
                }}
              />
            </div>

            {/* Canary Tests Card - P0.3 Fix: Consistent EmptyState */}
            <div className="rounded-2xl bg-card/60 p-4 min-h-[200px]">
              <div className="text-sm font-medium mb-2">
                {t("dashboard.canaryTests")}
              </div>
              <EmptyState
                icon="TestTube"
                title={t("noData")}
                description={t("noCanaryTests")}
              />
            </div>
          </div>

          {/* Live Market Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LiveMarketCard symbol="BTCUSDT" />
            <LiveMarketCard symbol="ETHUSDT" />
          </div>
        </div>

        {/* Right column - Sticky sidebar */}
        <aside className="w-full lg:w-[360px] shrink-0 sticky top-24 self-start pb-40 md:pb-44 pr-2 grid gap-4 [scroll-padding-bottom:120px]">
          {/* Last Alarm Status - P0.3 Fix: Consistent EmptyState */}
          <div className="rounded-2xl bg-card/60 p-4">
            <div className="text-sm font-medium mb-2">
              {t("dashboard.lastAlarm")}
            </div>
            <EmptyState
              icon="Bell"
              title={t("noData")}
              description={t("noRecentAlarms")}
            />
          </div>

          {/* Last Canary Test - P0.3 Fix: Consistent EmptyState */}
          <div className="rounded-2xl bg-card/60 p-4">
            <div className="text-sm font-medium mb-2">
              {t("dashboard.lastCanary")}
            </div>
            <EmptyState
              icon="TestTube"
              title={t("noData")}
              description={t("noRecentCanary")}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
