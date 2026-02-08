/**
 * Dashboard V2 - Modüler Kokpit Refactor
 *
 * 12 kolon grid, 2 satır, modüler kartlar
 * Anasayfa sadece overview (durum+risk+aksiyon), detaylar drill-down
 *
 * Layout:
 * Row 1: MarketSnapshot(8) + PortfolioSnapshot(4)
 * Row 2: RunningSummary(8) + RightStack(4): SystemHealth + MarketIntelSignalsTabbed + ActionCenter
 */

"use client";

import { useEffect, useState } from "react";
import InstrumentsTabbedCard from "./cards/InstrumentsTabbedCard";
import PortfolioSnapshotCard from "./cards/PortfolioSnapshotCard";
import RunningSummaryCard from "./cards/RunningSummaryCard";
import CockpitRightCard from "./cards/CockpitRightCard";
import NewsTickerBar, { type NewsSegment } from "./NewsTickerBar";

export default function DashboardV2() {
  const [activeSegment, setActiveSegment] = useState<NewsSegment>("crypto");
  useEffect(() => {
    const root = document.documentElement;
    const prevPadX = root.style.getPropertyValue("--page-px");
    const prevPadTop = root.style.getPropertyValue("--page-pt");
    const prevPadBottom = root.style.getPropertyValue("--page-pb");
    root.style.setProperty("--page-px", "2px");
    root.style.setProperty("--page-pt", "0px");
    root.style.setProperty("--page-pb", "0px");
    return () => {
      if (prevPadX) root.style.setProperty("--page-px", prevPadX);
      else root.style.removeProperty("--page-px");
      if (prevPadTop) root.style.setProperty("--page-pt", prevPadTop);
      else root.style.removeProperty("--page-pt");
      if (prevPadBottom) root.style.setProperty("--page-pb", prevPadBottom);
      else root.style.removeProperty("--page-pb");
    };
  }, []);

  return (
    <div
      className="relative h-full min-h-0 px-2 pt-1 pb-2 bg-neutral-950 overflow-hidden flex flex-col"
      data-page="dashboard-v2"
      data-testid="dashboard-v2-root"
    >
      <div className="sr-only">MODULAR_COCKPIT_V2</div>

      {/* Başlık - micro (fold-first: üst boşluk minimum) */}
      <div className="text-[11px] text-neutral-500 leading-tight mb-1 shrink-0">
        Anasayfa / Komuta Paneli
      </div>

      {/* Ticker - tek satır h-6, fold'da yer kaplamaz; kısa viewport'ta gizlenebilir */}
      <div className="shrink-0 h-6 [@media(max-height:780px)]:hidden">
        <NewsTickerBar segment={activeSegment} />
      </div>

      {/* Grid - no-scroll: tüm zincirde min-h-0; taşma sadece kart içinde overflow-auto */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <div className="grid grid-cols-12 gap-2 h-full min-h-0 grid-rows-[minmax(0,1fr)_minmax(0,1fr)]">
          {/* Satır 1 */}
          {/* Instruments Tabbed (Kripto | BIST | Vadeli | Döviz | Emtia) */}
          <div className="col-span-8 row-span-1 min-h-0">
            <InstrumentsTabbedCard
              activeSegment={activeSegment}
              onSegmentChange={setActiveSegment}
            />
          </div>

          {/* Portfolio Snapshot (4 kolon) */}
          <div className="col-span-4 row-span-1 min-h-0">
            <PortfolioSnapshotCard />
          </div>

          {/* Satır 2 */}
          {/* Running Summary (8 kolon) */}
          <div className="col-span-8 row-span-1 min-h-0">
            <RunningSummaryCard />
          </div>

          {/* Sağ Kokpit (4 kolon, tabbed) */}
          <div className="col-span-4 row-span-1 min-h-0">
            <CockpitRightCard />
          </div>
        </div>
      </div>
    </div>
  );
}
