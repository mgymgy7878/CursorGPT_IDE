"use client";
export const dynamic = "force-dynamic";

import PageHeader from "@/components/layout/PageHeader";
import StatusPills from "@/components/layout/StatusPills";
import Metric from "@/components/ui/Metric";
import LiveMarketCard from "@/components/marketdata/LiveMarketCard";
import ErrorBudgetBadge from "@/components/ops/ErrorBudgetBadge";
import EmptyState from "@/components/ui/EmptyState";
import { formatDuration } from "@/lib/format";
import { t } from "@/lib/i18n";
import { useMarketStore } from "@/stores/marketStore";
import React from "react";

export default function DashboardPage() {
  // Get WS status from market store
  const wsStatus = useMarketStore((s) => s.status);

  const env = "Mock";
  const feed =
    wsStatus === "healthy"
      ? "Healthy"
      : wsStatus === "degraded"
        ? "Degraded"
        : "Down";
  const broker = "Offline";

  const p95Ms = 58;
  const stalenessMs = 0;

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
        chips={[
          { label: `${t("dashboard.target")}: 1200 ms`, tone: "muted" },
          { label: `${t("dashboard.threshold")}: 30 sn`, tone: "muted" },
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

      <div className="mb-4">
        <StatusPills env={env} feed={feed} broker={broker} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
        {/* Left column - Main content */}
        <div className="grid gap-4">
          {/* Metrics row */}
          <div className="grid md:grid-cols-2 gap-4">
            <Metric
              label={t("dashboard.p95")}
              value={formatDuration(p95Ms)}
              hint={`${t("dashboard.target")}: 1200 ms`}
              className="num-tight"
            />
            <Metric
              label={t("dashboard.staleness")}
              value={formatDuration(stalenessMs)}
              hint={`${t("dashboard.threshold")}: 30 sn`}
              className="num-tight"
            />
          </div>

          {/* Cards row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Alarm Drafts Card */}
            <div className="rounded-2xl bg-card/60 p-4 min-h-[200px]">
              <div className="text-sm font-medium mb-2">
                {t("dashboard.alarmDrafts")}
              </div>
              <EmptyState
                icon="📋"
                title={t("noData")}
                description={t("noAlarmDrafts")}
                action={{
                  label: t("createAlert"),
                  onClick: handleCreateAlert,
                }}
              />
            </div>

            {/* Canary Tests Card */}
            <div className="rounded-2xl bg-card/60 p-4 min-h-[200px]">
              <div className="text-sm font-medium mb-2">
                {t("dashboard.canaryTests")}
              </div>
              <EmptyState
                icon="🧪"
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
          {/* Last Alarm Status */}
          <div className="rounded-2xl bg-card/60 p-4">
            <div className="text-sm font-medium mb-2">
              {t("dashboard.lastAlarm")}
            </div>
            <EmptyState
              icon="🔔"
              title={t("noData")}
              description={t("noRecentAlarms")}
            />
          </div>

          {/* Last Canary Test */}
          <div className="rounded-2xl bg-card/60 p-4">
            <div className="text-sm font-medium mb-2">
              {t("dashboard.lastCanary")}
            </div>
            <EmptyState
              icon="🧪"
              title={t("noData")}
              description={t("noRecentCanary")}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
