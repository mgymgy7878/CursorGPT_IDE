'use client';
import React from "react";
import dynamic from "next/dynamic";
import SideChatPanel from "@/components/common/SideChatPanel";
const DashboardClient = dynamic(() => import('@/components/dashboard/MetricsDashboard').then(m=>m.default), { ssr:false });
const MiniHealth = dynamic(()=>import('@/components/kpi/MiniHealth'), { ssr:false });
const Heatmap = dynamic(()=>import('@/components/portfolio/Heatmap'), { ssr:false });
// const P95Card = dynamic(() => import('@/app/components/P95Card'), { ssr:false });
const StabilityBadge = dynamic(() => import('./StabilityBadge'), { ssr:false });

export default function DashboardClientDock() {
  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <div className="flex-1 overflow-auto">
        <div className="p-3 space-y-3">
          <section className="space-y-2">
            <h3 className="text-sm font-semibold">Mini Health</h3>
            <MiniHealth />
          </section>
          <DashboardClient />
          <div className="mt-4">
            <Heatmap />
          </div>
          <section className="space-y-2">
            <h3 className="text-sm font-semibold">System Stability</h3>
            <StabilityBadge />
          </section>
          <section className="space-y-2">
            <h3 className="text-sm font-semibold">P95 Latency</h3>
            {/* <P95Card /> */}
          </section>
        </div>
      </div>
      <SideChatPanel
        title="Genel AI Asistanı"
        storageKey="ai:thread"
        apiPath="/api/public/ai/chat"
        placeholder="Dashboard için bir şey sorun…"
        templates={[
          { label:'Piyasa özeti', prompt:'Son 24 saatte BTC/ETH ve majör altların hareketini özetle. Riskler ve fırsatları kısa maddelerle ver.' },
          { label:'Risk kontrolü', prompt:'Açık pozisyonlar ve olası riskler için kısa kontrol listesi hazırla.' },
          { label:'Görev: KPI al', prompt:'Prometheus metriklerinden kritik KPI’ları çek ve anomali var mı değerlendir.' },
        ]}
      />
    </div>
  );
} 