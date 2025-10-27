import React from "react";
import dynamic from "next/dynamic";
import RunningStrategies from "./_parts/RunningStrategies";
import PortfolioSummary from "./_parts/PortfolioSummary";

const MarketStrip = dynamic(()=>import("./components/MarketStrip"), { ssr:false });
const NewsFeed    = dynamic(()=>import("./components/NewsFeed"), { ssr:false });

export default function Home(){
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Ana Sayfa</h1>
      
      {/* Market Strip */}
      <div className="overflow-x-auto rounded-2xl border border-neutral-800 bg-neutral-900/40 p-3 whitespace-nowrap">
        <MarketStrip />
      </div>

      {/* Kartlar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
          <h2 className="text-lg font-semibold mb-3">Çalışan Stratejiler</h2>
          <RunningStrategies />
        </section>
        
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
          <h2 className="text-lg font-semibold mb-3">Portföy Yönetimi</h2>
          <PortfolioSummary />
        </section>
      </div>

      {/* Haber Akışı */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
        <div className="max-h-96 overflow-auto">
          <NewsFeed />
        </div>
      </div>
    </div>
  );
}