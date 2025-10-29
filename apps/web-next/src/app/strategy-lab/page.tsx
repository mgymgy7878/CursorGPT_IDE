"use client";
export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useStrategyLabStore } from "@/stores/strategyLabStore";
import { useTranslation } from "@/i18n/useTranslation";
import GenerateTab from "./_tabs/GenerateTab";
import BacktestTab from "./_tabs/BacktestTab";
import OptimizeTab from "./_tabs/OptimizeTab";
import DeployTab from "./_tabs/DeployTab";

export default function StrategyLabPage() {
  const searchParams = useSearchParams();
  const { activeTab, setActiveTab } = useStrategyLabStore();
  const t = useTranslation("common");

  // Handle URL query param (?tab=backtest)
  useEffect(() => {
    const tabParam = searchParams?.get("tab");
    if (
      tabParam &&
      ["generate", "backtest", "optimize", "deploy"].includes(tabParam)
    ) {
      setActiveTab(tabParam as any);
    }
  }, [searchParams, setActiveTab]);

  const tabs = [
    { key: "generate", label: t("generate"), icon: "🤖" },
    { key: "backtest", label: t("backtest"), icon: "📊" },
    { key: "optimize", label: t("optimize"), icon: "⚡" },
    { key: "deploy", label: t("deploy"), icon: "🚀" },
  ] as const;

  return (
    <div className="px-6 py-4 min-h-screen bg-neutral-950">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">{t("strategyLab")}</h1>
        <p className="text-sm text-zinc-500">
          {t("generate")} → {t("backtest")} → {t("optimize")} → {t("deploy")}
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-800 mb-6">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "text-blue-500 border-b-2 border-blue-500"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
              aria-current={activeTab === tab.key ? "page" : undefined}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-4xl">
        {activeTab === "generate" && <GenerateTab />}
        {activeTab === "backtest" && <BacktestTab />}
        {activeTab === "optimize" && <OptimizeTab />}
        {activeTab === "deploy" && <DeployTab />}
      </div>
    </div>
  );
}
