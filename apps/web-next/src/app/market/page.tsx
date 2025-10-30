"use client";
export const dynamic = "force-dynamic";

import { useTranslation } from "@/i18n/useTranslation";
import MarketGrid from "@/components/market/MarketGrid";

export default function MarketPage() {
  const t = useTranslation("common");

  return (
    <div className="px-6 py-4 min-h-screen bg-neutral-950 safe-bottom">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">{t("market")}</h1>
        <p className="text-sm text-neutral-400">
          Canlı piyasa verileri, fiyatlar ve teknik analiz
        </p>
      </div>

      <MarketGrid />
    </div>
  );
}

