"use client";
import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine as ReferenceLineClass } from "recharts";
import { SLO_TARGETS } from "@/lib/constants/slo";

type TimeWindow = "7d" | "30d" | "90d";

type DataPoint = {
  timestamp: number;
  p95_ms: number;
  staleness_s: number;
  error_rate: number;
};

type Props = {
  metric?: "p95_ms" | "staleness_s" | "error_rate";
  window?: TimeWindow;
};

export default function SLOTimechart({ metric = "p95_ms", window = "7d" }: Props) {
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWindow, setSelectedWindow] = useState<TimeWindow>(window);

  useEffect(() => {
    loadTimeseries();
    const interval = setInterval(loadTimeseries, 60000); // 1m poll
    
    // Pause polling when tab is hidden (CPU optimization)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadTimeseries(); // Reload when tab becomes visible
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [selectedWindow]);

  async function loadTimeseries() {
    try {
      const res = await fetch(`/api/tools/metrics/timeseries?window=${selectedWindow}`, {
        cache: "no-store"
      });
      const json = await res.json();
      setData(json.data || []);
    } catch (e) {
      setData([]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-neutral-800 p-4 bg-neutral-900/50">
        <div className="animate-pulse">
          <div className="h-4 w-32 bg-neutral-800 rounded mb-3"></div>
          <div className="h-48 bg-neutral-800 rounded"></div>
        </div>
      </div>
    );
  }

  const metricConfig = {
    p95_ms: {
      label: "P95 Latency",
      unit: "ms",
      color: "#10b981",
      threshold: SLO_TARGETS.P95_MS,
      formatter: (v: number) => `${v.toFixed(0)}ms`
    },
    staleness_s: {
      label: "Staleness",
      unit: "s",
      color: "#f59e0b",
      threshold: SLO_TARGETS.STALENESS_S,
      formatter: (v: number) => `${v.toFixed(0)}s`
    },
    error_rate: {
      label: "Error Rate",
      unit: "%",
      color: "#ef4444",
      threshold: SLO_TARGETS.ERROR_RATE,
      formatter: (v: number) => `${(v * 100).toFixed(2)}%`
    }
  };

  const config = metricConfig[metric];

  return (
    <div className="rounded-xl border border-neutral-800 p-4 bg-neutral-900/50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">📈 {config.label}</h3>
        <div className="flex gap-2">
          {(["7d", "30d", "90d"] as TimeWindow[]).map((w) => (
            <button
              key={w}
              onClick={() => setSelectedWindow(w)}
              className={`text-xs px-2 py-1 rounded ${
                selectedWindow === w 
                  ? "bg-blue-500 text-white" 
                  : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
              }`}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-12 text-neutral-500 text-sm">
          Zaman serisi verisi yok
        </div>
      ) : (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(ts: number) => new Date(ts).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })}
                stroke="#737373"
                style={{ fontSize: '10px' }}
              />
              <YAxis 
                stroke="#737373"
                style={{ fontSize: '10px' }}
                tickFormatter={(v: number) => metric === "error_rate" ? `${(v * 100).toFixed(0)}%` : v.toFixed(0)}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "#171717",
                  border: "1px solid #404040",
                  borderRadius: "8px",
                  fontSize: "12px"
                }}
                labelFormatter={(ts: number) => new Date(ts).toLocaleString('tr-TR')}
                formatter={(value: number) => [config.formatter(value), config.label]}
              />
              {/* Use React.createElement to bypass JSX type issues with recharts v3 */}
              {React.createElement(ReferenceLineClass as any, {
                y: config.threshold,
                stroke: "#ef4444",
                strokeDasharray: "3 3",
                label: {
                  value: `Eşik: ${config.formatter(config.threshold)}`,
                  position: 'right',
                  fill: '#ef4444',
                  fontSize: 10
                }
              })}
              <Line 
                type="monotone" 
                dataKey={metric} 
                stroke={config.color} 
                strokeWidth={2}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  const value = payload[metric];
                  const isBreach = value > config.threshold;
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isBreach ? 4 : 2}
                      fill={isBreach ? "#ef4444" : config.color}
                      stroke={isBreach ? "#7f1d1d" : "none"}
                      strokeWidth={isBreach ? 2 : 0}
                    />
                  );
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-neutral-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.color }}></div>
            <span className="text-neutral-500">Gerçek</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-red-500"></div>
            <span className="text-neutral-500">Eşik</span>
          </div>
        </div>
        <div className="text-neutral-500">
          Son güncelleme: {data.length > 0 ? new Date(data[data.length - 1].timestamp).toLocaleTimeString('tr-TR') : '-'}
        </div>
      </div>
    </div>
  );
}

