/**
 * Home Page - Ultra-light Launchpad / Operasyon Kokpiti Lite
 *
 * Kural: "Ana Sayfa asla çökmez, asla route'u kilitlemez."
 * - Sadece 4 kutu: Sistem Durumu, Son Sinyal/Özet, Hızlı Eylemler, Son Olaylar
 * - Ağır grafik, tape, chart YOK
 * - Link ile Dashboard/Market/Portfolio'ya net CTA
 */

import Link from "next/link";
import { Suspense } from "react";
import SystemHealth from "@/components/dashboard/SystemHealth";
import HomeClientBanner from "@/components/dashboard/HomeClientBanner";

export const dynamic = "force-dynamic";

async function getSystemStatus() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:4000";
    const res = await fetch(`${baseUrl}/api/dashboard/summary`, {
      cache: "no-store",
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.system || null;
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const systemStatus = await getSystemStatus();

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen bg-neutral-950">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-100">Spark Trading</h1>
          <p className="text-sm text-neutral-400 mt-1">Operasyon Kokpiti</p>
        </div>
        <div className="text-xs text-neutral-500">Launchpad / Lite</div>
      </header>

      {/* Global System Banner (Client component - executor status için) */}
      <Suspense fallback={<div className="text-xs text-neutral-500">Yükleniyor…</div>}>
        <HomeClientBanner />
      </Suspense>

      {/* Sistem Durumu */}
      <div className="rounded-2xl border border-white/10 bg-neutral-900/70 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
        <div className="text-sm font-semibold text-neutral-100 mb-3">Sistem Durumu</div>
        <SystemHealth
          api={systemStatus?.api || { ok: true }}
          feed={systemStatus?.feed || { ok: true }}
          executor={systemStatus?.executor || { ok: false }}
        />
      </div>

      {/* Bugün Özeti (KPI Grid - Minimal) */}
      <div className="rounded-2xl border border-white/10 bg-neutral-900/70 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
        <div className="text-sm font-semibold text-neutral-100 mb-3">Bugün Özeti</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-neutral-950/40 border border-white/5">
            <div className="text-xs text-neutral-400 mb-1">Günlük PnL</div>
            <div className="text-lg font-semibold text-neutral-100">—</div>
          </div>
          <div className="p-3 rounded-lg bg-neutral-950/40 border border-white/5">
            <div className="text-xs text-neutral-400 mb-1">Açık Pozisyon</div>
            <div className="text-lg font-semibold text-neutral-100">—</div>
          </div>
          <div className="p-3 rounded-lg bg-neutral-950/40 border border-white/5">
            <div className="text-xs text-neutral-400 mb-1">Net Exposure</div>
            <div className="text-lg font-semibold text-neutral-100">—</div>
          </div>
          <div className="p-3 rounded-lg bg-neutral-950/40 border border-white/5">
            <div className="text-xs text-neutral-400 mb-1">Uyarılar</div>
            <div className="text-lg font-semibold text-neutral-100">—</div>
          </div>
        </div>
      </div>

      {/* Hızlı Eylemler */}
      <div className="rounded-2xl border border-white/10 bg-neutral-900/70 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
        <div className="text-sm font-semibold text-neutral-100 mb-3">Hızlı Eylemler</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link
            href="/dashboard"
            className="p-4 rounded-lg bg-neutral-950/40 border border-white/5 hover:bg-neutral-950/60 transition-colors text-center"
          >
            <div className="text-sm font-medium text-neutral-100">Dashboard</div>
            <div className="text-xs text-neutral-400 mt-1">Ağır operasyon ekranı</div>
          </Link>
          <Link
            href="/market-data"
            className="p-4 rounded-lg bg-neutral-950/40 border border-white/5 hover:bg-neutral-950/60 transition-colors text-center"
          >
            <div className="text-sm font-medium text-neutral-100">Piyasa Verileri</div>
            <div className="text-xs text-neutral-400 mt-1">Chart + Orderbook</div>
          </Link>
          <Link
            href="/portfolio"
            className="p-4 rounded-lg bg-neutral-950/40 border border-white/5 hover:bg-neutral-950/60 transition-colors text-center"
          >
            <div className="text-sm font-medium text-neutral-100">Portföy</div>
            <div className="text-xs text-neutral-400 mt-1">Pozisyonlar + PnL</div>
          </Link>
          <Link
            href="/running"
            className="p-4 rounded-lg bg-neutral-950/40 border border-white/5 hover:bg-neutral-950/60 transition-colors text-center"
          >
            <div className="text-sm font-medium text-neutral-100">Çalışan Stratejiler</div>
            <div className="text-xs text-neutral-400 mt-1">Aktif stratejiler</div>
          </Link>
        </div>
      </div>

      {/* Son Olaylar (Placeholder) */}
      <div className="rounded-2xl border border-white/10 bg-neutral-900/70 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
        <div className="text-sm font-semibold text-neutral-100 mb-3">Son Olaylar</div>
        <div className="text-xs text-neutral-400 text-center py-4">
          Olay günlüğü yakında eklenecek
        </div>
      </div>
    </div>
  );
}
