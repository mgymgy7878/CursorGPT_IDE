/**
 * Dashboard Page - Server Component
 * Client-side interactive parts DashboardClient.tsx'te
 * Dynamic import with catch fallback to prevent "stuck loading" screen
 */

import { Suspense } from "react";
import dynamicImport from "next/dynamic";
import DashboardLoading from "./loading";

export const dynamic = "force-dynamic";

// MODULAR_COCKPIT_V2: Server-side initial data fetch kaldırıldı
// DashboardV2 kendi hook'ları ile client-side fetch yapıyor

// Chunk load timeout (ms) - takılı kalan import siyah ekranı önler
const CHUNK_TIMEOUT_MS = 12000;

// Dynamic import with timeout + catch fallback - prevents "stuck loading" / black screen
// MODULAR_COCKPIT_V2: Yeni modüler kokpit DashboardV2 kullanılıyor
const DashboardV2 = dynamicImport(
  () => {
    const load = import("@/components/dashboard/DashboardV2");
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("CHUNK_TIMEOUT: Dashboard 12s içinde yüklenemedi")), CHUNK_TIMEOUT_MS)
    );
    return Promise.race([load, timeout]).catch((err) => {
      console.error("[dashboard] DashboardV2 import failed:", err);
      return {
        default: function DashboardChunkFailed() {
          return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 p-6">
              <div className="max-w-2xl w-full rounded-2xl border border-red-500/30 bg-neutral-900 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                    <span className="text-red-400 text-2xl">⚠</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-red-400">Dashboard Yüklenemedi</h2>
                    <p className="text-sm text-neutral-400 mt-1">
                      Chunk yükleme hatası, zaman aşımı veya modül başlatma hatası.
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
                      window.location.href = "/";
                    }}
                    className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium transition-colors"
                  >
                    Ana Sayfa
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
    loading: () => <DashboardLoading />,
  }
);

export default async function DashboardPage() {
  // MODULAR_COCKPIT_V2: DashboardV2 artık initialData'ya ihtiyaç duymuyor (kendi hook'ları var)
  // Server-side initial data fetch kaldırıldı (DashboardV2 client-side fetch kullanıyor)

  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardV2 />
    </Suspense>
  );
}
