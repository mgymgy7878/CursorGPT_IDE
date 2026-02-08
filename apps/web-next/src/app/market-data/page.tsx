/**
 * Market Data Page - Server Component
 * Client-side interactive parts MarketDataClient.tsx'te
 * Dynamic import with catch fallback to prevent "stuck loading" screen
 * Chart library (lightweight-charts) DOM isteyen kütüphane olduğu için client-only yüklenmeli
 * 
 * CRITICAL: useSearchParams requires Suspense boundary in Next.js App Router
 */

import { Suspense } from "react";
import dynamicImport from "next/dynamic";
import MarketDataLoading from "./loading";

export const dynamic = "force-dynamic";

// Chunk load timeout (ms) - takılı kalan import siyah ekranı önler
const CHUNK_TIMEOUT_MS = 12000;

// Dynamic import with timeout + catch fallback - prevents "stuck loading" / black screen
// Chart library crash'lerini önlemek için ssr:false zorunlu
const MarketDataClient = dynamicImport(
  () => {
    const load = import("@/components/market/MarketDataClient");
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("CHUNK_TIMEOUT: Market Data 12s içinde yüklenemedi")), CHUNK_TIMEOUT_MS)
    );
    return Promise.race([load, timeout]).catch((err) => {
      console.error("[market-data] MarketDataClient import failed:", err);
      return {
        default: function MarketDataChunkFailed() {
          return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 p-6">
              <div className="max-w-2xl w-full rounded-2xl border border-red-500/30 bg-neutral-900 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                    <span className="text-red-400 text-2xl">⚠</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-red-400">Market Data Yüklenemedi</h2>
                    <p className="text-sm text-neutral-400 mt-1">
                      Chunk yükleme hatası, zaman aşımı veya chart library başlatma hatası.
                    </p>
                  </div>
                </div>
                <div className="bg-neutral-950 rounded-lg p-4 mb-4 border border-neutral-800">
                  <div className="text-xs text-neutral-300 font-mono break-all">
                    {err?.message || String(err) || "Bilinmeyen hata"}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                  >
                    Sayfayı Yenile
                  </button>
                  <button
                    onClick={() => {
                      window.location.href = "/dashboard";
                    }}
                    className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium transition-colors"
                  >
                    Dashboard
                  </button>
                </div>
              </div>
            </div>
          );
        },
      };
    });
  },
  {
    ssr: false,
    loading: () => <MarketDataLoading />,
  }
);

export default async function MarketDataPage() {
  // CRITICAL: useSearchParams is now isolated in MarketDataParams component with Suspense
  // Only need Suspense for dynamic import here
  return (
    <Suspense fallback={<MarketDataLoading />}>
      <MarketDataClient />
    </Suspense>
  );
}
