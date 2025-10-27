"use client";
import { AssetRow } from "@/types/portfolio";

export default function PortfolioTable({ rows }: { rows: AssetRow[] }) {
  if (!rows?.length) {
    return (
      <div className="rounded-2xl border p-10 text-center">
        <h3 className="text-lg font-semibold">Varlık bulunamadı</h3>
        <p className="opacity-70">API anahtarlarınızı Ayarlar'dan ekleyin.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border bg-white">
      <table className="w-full min-w-[560px] text-sm">
        <thead className="bg-neutral-50 text-neutral-600">
          <tr>
            <th className="px-4 py-3 text-left">Varlık</th>
            <th className="px-4 py-3 text-right">Miktar</th>
            <th className="px-4 py-3 text-right">Fiyat (USD)</th>
            <th className="px-4 py-3 text-right">Değer (USD)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.asset} className="border-t">
              <td className="px-4 py-3 font-medium">{r.asset}</td>
              <td className="px-4 py-3 text-right font-mono">
                {formatNum(r.amount)}
              </td>
              <td className="px-4 py-3 text-right font-mono">
                {r.priceUsd != null ? formatNum(r.priceUsd) : "—"}
              </td>
              <td className="px-4 py-3 text-right font-mono">
                {r.valueUsd != null ? formatNum(r.valueUsd) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatNum(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
}
