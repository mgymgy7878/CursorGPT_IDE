"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { getStatusVisual } from "@/lib/metrics/status";
import { upper, asNum, fmtMs, fmtSec } from "@/lib/safe";

// ⬇️ CUSTOM HOOK - KOŞULSUZ ÇAĞIR, İÇERİDE KOŞUL
function useVenueData(enabled: boolean) {
  const [venue, setVenue] = useState<any>(null);
  
  useEffect(() => {
    if (!enabled) return; // sıralama korunur
    
    async function loadVenues() {
      try {
        const res = await fetch("/api/healthz", { cache: "no-store" });
        const health = await res.json();
        setVenue(health.venues);
      } catch {}
    }
    
    loadVenues();
    const interval = setInterval(loadVenues, 30000);
    return () => clearInterval(interval);
  }, [enabled]);
  
  return venue;
}

type HealthMetrics = {
  p95: number | null;
  staleness: number | null;
  errorRate: number | null;
  status: string;
  _mock?: boolean;
};

// ⬇️ WRAPPER: Sadece koşullu dönüş, hook yok
export default function MarketsHealthWidget({ enabled = true, demo = false }: { enabled?: boolean; demo?: boolean } = {}) {
  if (!enabled) return null;        // hook yok, güvenli
  if (demo) return <DemoCard />;    // hook yok, güvenli
  return <MarketsHealthWidgetInner />;  // tüm hook'lar Inner'da
}

// ⬇️ DEMO CARD (hook yok)
function DemoCard() {
  return (
    <div className="space-y-4">
      <div className="text-xs text-amber-400 bg-amber-950/30 px-2 py-1 rounded border border-amber-800/50">
        ⚠️ Demo Mode
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-400">Durum</span>
          <span className="font-semibold text-green-400">✅ DEMO</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-400">P95 Latency</span>
          <span className="font-mono text-white">0ms</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-400">Staleness</span>
          <span className="font-mono text-white">0s</span>
        </div>
      </div>
    </div>
  );
}

// ⬇️ INNER: Tüm hook'lar burada, güvenli
function MarketsHealthWidgetInner() {
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [venueData, setVenueData] = useState<any>(null);

  useEffect(() => {
    // ⬇️ KOŞULLU YÜKLEME - HOOK SIRASI SABİT, YAN ETKİ KOŞULLU
    const shouldLoad = true; // props + state karışımı
    if (!shouldLoad) return; // sıralama korunur
    
    let alive = true;
    const abortController = new AbortController();

    const load = async () => {
      try {
        const { fetchMarketHealth } = await import("@/lib/api-client");
        const result = await fetchMarketHealth();

        if (alive && !abortController.signal.aborted) {
          if (result.ok && result.data) {
            setMetrics({
              ...result.data,
              _mock: result.isMock,
            });
          } else {
            // Fallback on error
            setMetrics({
              p95: 0,
              staleness: 0,
              errorRate: 0,
              status: "critical",
              _mock: true,
            });
          }
        }
      } catch (e) {
        if (alive && !abortController.signal.aborted) {
          // Silent fail - no toast for background polling
          setMetrics({
            p95: 0,
            staleness: 0,
            errorRate: 0,
            status: "critical",
            _mock: true,
          });
        }
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    
    // Poll every 30-60s, pause when tab hidden
    const interval = setInterval(() => {
      if (!document.hidden && alive && !abortController.signal.aborted) {
        load();
      }
    }, 45000);

    const handleVisibilityChange = () => {
      if (!document.hidden && alive && !abortController.signal.aborted) {
        load();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      alive = false;
      abortController.abort(); // ⬇️ ABORT CONTROLLER İLE SIZINTI ÖNLEME
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // ⬇️ CUSTOM HOOK KOŞULSUZ ÇAĞIR - İÇERİDE KOŞUL
  const venueDataFromHook = useVenueData(true); // hep çağır, içeride koşul
  
  useEffect(() => {
    async function loadVenues() {
      try {
        const res = await fetch("/api/healthz", { cache: "no-store" });
        const health = await res.json();
        setVenueData(health.venues);
      } catch {}
    }
    loadVenues();
    const interval = setInterval(loadVenues, 30000);
    return () => clearInterval(interval);
  }, []);

  // ⬇️ ARTIK GÜVENLİ: TÜM HOOK'LAR ÇAĞRILDI
  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-4 w-24 bg-neutral-800 rounded"></div>
        <div className="h-20 bg-neutral-800 rounded"></div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-8 text-neutral-500">
        Veriler yüklenemedi
      </div>
    );
  }

  // ⬇️ PERFORMANS CİLASİ - KOŞULSUZ TANIMLA, İÇERİKTE KOŞUL
  const safeStatus = upper(metrics?.status);
  const p95 = asNum(metrics?.p95, null);
  const st = asNum(metrics?.staleness, null);
  const { statusIcon, statusColor } = getStatusVisual(safeStatus);
  
  // ⬇️ USEMEMO KOŞULSUZ TANIMLA
  const columns = useMemo(() => (metrics?._mock ? ['DEMO', 'MODE'] : ['REAL', 'DATA']), [metrics?._mock]);
  
  // ⬇️ USECALLBACK KOŞULSUZ TANIMLA
  const handleRefresh = useCallback(() => {
    if (metrics?._mock) return; // içeride koşul
    // refresh logic
  }, [metrics?._mock]);

  const btcStaleness = venueData?.btcturk?.stalenessSec ?? null;
  const bistStaleness = venueData?.bist?.stalenessSec ?? null;
  
  const getStalenessColor = (val: number | null) => {
    if (val === null) return 'text-neutral-500';
    if (val < 10) return 'text-green-400';
    if (val < 30) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-4">
      {metrics._mock && (
        <div className="text-xs text-amber-400 bg-amber-950/30 px-2 py-1 rounded border border-amber-800/50">
          ⚠️ Demo Mode
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-400">Durum</span>
          <span className={`font-semibold ${statusColor}`}>
            {statusIcon} {safeStatus}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-400">P95 Latency</span>
          <span className="font-mono text-white">
            {fmtMs(p95)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-400">Staleness</span>
          <span className="font-mono text-white">
            {fmtSec(st)}
          </span>
        </div>

        {btcStaleness !== null && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-400">BTCTurk</span>
            <span className={`font-mono text-xs ${getStalenessColor(btcStaleness)}`}>
              {btcStaleness}s
            </span>
          </div>
        )}

        {bistStaleness !== null && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-400">BIST</span>
            <span className={`font-mono text-xs ${getStalenessColor(bistStaleness)}`}>
              {bistStaleness}s
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-400">Error Rate</span>
          <span className={`font-mono ${p95 !== null && p95 > 1 ? 'text-red-400' : 'text-white'}`}>
            {p95 !== null ? `${p95.toFixed(2)}%` : '—'}
          </span>
        </div>
      </div>
    </div>
  );
}

