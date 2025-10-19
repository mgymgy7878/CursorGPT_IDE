"use client";

type Metrics = {
  totalTrades?: number;
  winRate?: number;
  avgWin?: number;
  avgLoss?: number;
  profitFactor?: number;
  sharpe?: number;
  expectancy?: number;
  maxDrawdown?: number;
};

type Props = {
  metrics: Metrics;
  title?: string;
};

export default function MetricsTable({ metrics, title = "Metrikler" }: Props) {
  const rows = [
    { label: "Toplam İşlem", value: metrics.totalTrades ?? "-", format: (v: any) => String(v) },
    { label: "Kazanma Oranı", value: metrics.winRate ?? "-", format: (v: any) => typeof v === "number" ? `${(v * 100).toFixed(2)}%` : String(v) },
    { label: "Ort. Kazanç", value: metrics.avgWin ?? "-", format: (v: any) => typeof v === "number" ? `$${v.toFixed(2)}` : String(v) },
    { label: "Ort. Kayıp", value: metrics.avgLoss ?? "-", format: (v: any) => typeof v === "number" ? `$${v.toFixed(2)}` : String(v) },
    { label: "Profit Factor", value: metrics.profitFactor ?? "-", format: (v: any) => typeof v === "number" ? v.toFixed(2) : String(v) },
    { label: "Sharpe Ratio", value: metrics.sharpe ?? "-", format: (v: any) => typeof v === "number" ? v.toFixed(2) : String(v) },
    { label: "Expectancy", value: metrics.expectancy ?? "-", format: (v: any) => typeof v === "number" ? `$${v.toFixed(2)}` : String(v) },
    { label: "Max Drawdown", value: metrics.maxDrawdown ?? "-", format: (v: any) => typeof v === "number" ? `${(v * 100).toFixed(2)}%` : String(v) },
  ];

  return (
    <div className="rounded-xl border border-neutral-800 p-4 bg-neutral-900/50">
      <h3 className="text-sm font-semibold mb-3">📊 {title}</h3>
      
      <div className="space-y-2">
        {rows.map((row, idx) => (
          <div key={idx} className="flex items-center justify-between text-xs">
            <span className="text-neutral-500">{row.label}</span>
            <span className="font-mono text-neutral-200">{row.format(row.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

