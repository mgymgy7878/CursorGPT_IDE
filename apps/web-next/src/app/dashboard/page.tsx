import React from "react";
import RunnerPanel from "@/components/dashboard/RunnerPanel";

export const dynamic = "force-dynamic";

const kpiCards = [
  { label: "Portfolio Value", value: "$12.84M", trend: "+1.8%" },
  { label: "24h Volume", value: "$3.21M", trend: "+4.2%" },
  { label: "Open Interest", value: "$812K", trend: "-0.9%" },
  { label: "Active Orders", value: "124", trend: "+6" },
];

const skeletonRows = Array.from({ length: 7 }).map((_, idx) => idx);

function SkeletonLine({ width = "w-full" }: { width?: string }) {
  return (
    <div className={`h-3 rounded bg-white/10 ${width}`} />
  );
}

function PanelShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900/70 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] flex flex-col min-h-0">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-neutral-100">{title}</div>
          {subtitle && (
            <div className="text-[11px] text-neutral-400 mt-0.5">
              {subtitle}
            </div>
          )}
        </div>
        <div className="text-[10px] text-neutral-400">Placeholder</div>
      </div>
      <div className="mt-3 min-h-0">{children}</div>
    </div>
  );
}

export default function DashboardPage({
  searchParams,
}: {
  searchParams?: { state?: string };
}) {
  const showWatermark =
    searchParams?.state === "loading" || searchParams?.state === "degraded";

  return (
    <div
      className="relative h-full min-h-0 overflow-hidden flex flex-col gap-4"
      data-testid="dashboard-north-star"
    >
      {showWatermark && (
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.012]">
          <div className="absolute right-8 top-6 text-[180px] font-bold text-white/20">
            SPARK
          </div>
        </div>
      )}

      <header className="flex items-center justify-between gap-4">
        <div>
          <div className="text-lg font-semibold text-neutral-100">
            Komuta Paneli
          </div>
          <div className="text-[12px] text-neutral-400">
            Market Overview
          </div>
        </div>
        <div className="text-[11px] text-neutral-500">
          Dashboard / North-Star
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-white/10 bg-neutral-900/70 px-4 py-3"
          >
            <div className="text-[11px] text-neutral-400">{card.label}</div>
            <div className="mt-1 flex items-baseline justify-between gap-2">
              <div className="text-base font-semibold text-neutral-100">
                {card.value}
              </div>
              <div className="text-[11px] text-emerald-300/80">
                {card.trend}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-3">
        <div className="flex flex-col min-h-0 gap-3">
          <PanelShell title="Portfolio Performance" subtitle="12 saatlik özet">
            <div className="flex-1 min-h-[220px] rounded-xl border border-white/5 bg-neutral-950/40 flex items-center justify-center text-xs text-neutral-500">
              Chart placeholder
            </div>
            <div className="mt-3 text-[11px] text-neutral-400">
              Performans metriği ve risk dağılımı burada görünecek.
            </div>
          </PanelShell>

          <PanelShell title="Working Set" subtitle="Açık pozisyonlar">
            <div className="flex-1 min-h-0 overflow-auto">
              <div className="grid gap-2">
                {skeletonRows.map((row) => (
                  <div
                    key={row}
                    className="flex items-center justify-between rounded-lg border border-white/5 bg-neutral-950/40 px-3 py-2 text-[12px]"
                  >
                    <div className="text-neutral-200">BTCUSDT</div>
                    <div className="text-emerald-300/80">+1.24%</div>
                  </div>
                ))}
              </div>
            </div>
          </PanelShell>

          <PanelShell title="News / AI" subtitle="Haber · AI · Alarmlar · Sistem">
            <div className="flex items-center gap-2 text-[11px] text-neutral-400">
              {["Haber", "AI", "Alarmlar", "Sistem"].map((tab) => (
                <div
                  key={tab}
                  className="rounded-full border border-white/10 px-2 py-1 bg-white/5"
                >
                  {tab}
                </div>
              ))}
            </div>
            <div className="mt-3 flex-1 min-h-0 overflow-auto">
              <div className="grid gap-2">
                {skeletonRows.map((row) => (
                  <div key={row} className="rounded-lg border border-white/5 bg-neutral-950/40 px-3 py-2">
                    <div className="text-[12px] text-neutral-200">
                      {row + 1}. Placeholder başlık
                    </div>
                    <div className="text-[11px] text-neutral-500 mt-1">
                      Kısa açıklama alanı.
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </PanelShell>
        </div>

        <aside className="flex flex-col min-h-0 gap-3">
          <RunnerPanel />
          <PanelShell title="Top Gainers" subtitle="Top-N">
            <div className="flex-1 min-h-0 overflow-auto">
              <div className="grid gap-2">
                {skeletonRows.map((row) => (
                  <div
                    key={row}
                    className="flex items-center justify-between rounded-lg border border-white/5 bg-neutral-950/40 px-3 py-2 text-[12px]"
                  >
                    <div className="text-neutral-200">SOLUSDT</div>
                    <div className="text-emerald-300/80">+{row + 2.4}%</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3 text-[11px] text-neutral-400">
              Liste gerçek veri geldiğinde otomatik güncellenecek.
            </div>
          </PanelShell>
        </aside>
      </div>
    </div>
  );
}

