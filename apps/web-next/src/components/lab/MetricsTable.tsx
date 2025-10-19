"use client";

type Metrics = {
  totalReturn?: number;
  winRate?: number;
  sharpeRatio?: number;
  maxDrawdown?: number;
  totalTrades?: number;
  avgWin?: number;
  avgLoss?: number;
  profitFactor?: number;
};

type Props = {
  metrics: Metrics;
  title?: string;
};

export default function MetricsTable({ metrics, title = "Backtest Metrikleri" }: Props) {
  const rows = [
    { 
      label: "Toplam Return", 
      value: metrics.totalReturn ?? 0, 
      format: (v: number) => `${v.toFixed(2)}%`,
      color: (v: number) => v >= 0 ? "text-green-400" : "text-red-400"
    },
    { 
      label: "Kazanma Oranı", 
      value: metrics.winRate ?? 0, 
      format: (v: number) => `${v.toFixed(2)}%`,
      color: () => "text-neutral-200"
    },
    { 
      label: "Sharpe Ratio", 
      value: metrics.sharpeRatio ?? 0, 
      format: (v: number) => v.toFixed(2),
      color: (v: number) => v >= 1 ? "text-green-400" : v >= 0.5 ? "text-yellow-400" : "text-red-400"
    },
    { 
      label: "Max Drawdown", 
      value: metrics.maxDrawdown ?? 0, 
      format: (v: number) => `${v.toFixed(2)}%`,
      color: () => "text-orange-400"
    },
    { 
      label: "Toplam İşlem", 
      value: metrics.totalTrades ?? 0, 
      format: (v: number) => String(Math.floor(v)),
      color: () => "text-neutral-200"
    },
    { 
      label: "Profit Factor", 
      value: metrics.profitFactor ?? 0, 
      format: (v: number) => v.toFixed(2),
      color: (v: number) => v >= 1.5 ? "text-green-400" : v >= 1 ? "text-yellow-400" : "text-red-400"
    },
  ];

  return (
    <div className="rounded-xl border border-neutral-800 p-4 bg-neutral-900/50">
      <h3 className="text-sm font-semibold mb-3">📊 {title}</h3>
      
      <div className="space-y-2">
        {rows.map((row, idx) => (
          <div key={idx} className="flex items-center justify-between text-xs">
            <span className="text-neutral-500">{row.label}</span>
            <span className={`font-mono font-semibold ${row.color(row.value)}`}>
              {row.format(row.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

