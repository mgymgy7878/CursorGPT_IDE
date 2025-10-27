"use client";
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Activity, Clock } from "lucide-react";

interface Metric {
  name: string;
  p50: number;
  p95: number;
  ts: string;
}

export default function MetricsPanel() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [maxDataPoints] = useState(30); // Show last 30 data points

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connectSSE = () => {
      try {
        eventSource = new EventSource("/api/public/events/metrics");
        
        eventSource.onopen = () => {
          setIsConnected(true);
          console.log("Metrics SSE connected");
        };

        eventSource.onmessage = (event) => {
          if (event.type === "metric") {
            try {
              const metric: Metric = JSON.parse(event.data);
              setMetrics(prev => {
                const newMetrics = [...prev, metric].slice(-maxDataPoints);
                return newMetrics;
              });
            } catch (error) {
              console.error("Failed to parse metric:", error);
            }
          }
        };

        eventSource.onerror = (error) => {
          console.error("Metrics SSE error:", error);
          setIsConnected(false);
          eventSource?.close();
          
          // Reconnect after 10 seconds
          reconnectTimeout = setTimeout(connectSSE, 10000);
        };
      } catch (error) {
        console.error("Failed to connect to Metrics SSE:", error);
        setIsConnected(false);
      }
    };

    connectSSE();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [maxDataPoints]);

  // Group metrics by name for different charts
  const metricGroups = metrics.reduce((groups, metric) => {
    if (!groups[metric.name]) {
      groups[metric.name] = [];
    }
    groups[metric.name].push({
      time: new Date(metric.ts).toLocaleTimeString(),
      p50: metric.p50,
      p95: metric.p95
    });
    return groups;
  }, {} as Record<string, any[]>);

  const getMetricColor = (metricName: string) => {
    const colors = {
      'ack_p95_ms': '#10B981', // green
      'event_to_db_p95_ms': '#3B82F6', // blue
      'ingest_lag_p95_s': '#F59E0B', // amber
      'reject_rate_pct': '#EF4444', // red
      'slippage_p95_bps': '#8B5CF6', // purple
      'clock_drift_ms_p95': '#06B6D4' // cyan
    };
    return colors[metricName as keyof typeof colors] || '#6B7280';
  };

  const getMetricUnit = (metricName: string) => {
    if (metricName.includes('ms')) return 'ms';
    if (metricName.includes('s')) return 's';
    if (metricName.includes('pct')) return '%';
    if (metricName.includes('bps')) return 'bps';
    return '';
  };

  return (
    <div className="p-6 rounded-2xl border border-zinc-700/50 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Metrics Panel</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400" : "bg-red-400"}`}></div>
          <span className="text-sm text-neutral-400">
            {isConnected ? "Live" : "Disconnected"}
          </span>
          <Activity className="w-4 h-4 text-blue-400" />
        </div>
      </div>

      {Object.keys(metricGroups).length === 0 ? (
        <div className="text-center py-8 text-neutral-400">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Waiting for metrics data...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(metricGroups).map(([metricName, data]) => (
            <div key={metricName} className="bg-neutral-800/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-sm">{metricName.replace(/_/g, ' ').toUpperCase()}</h4>
                <span className="text-xs text-neutral-400">{getMetricUnit(metricName)}</span>
              </div>
              
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="time" 
                    stroke="#9CA3AF" 
                    fontSize={10}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis 
                    stroke="#9CA3AF" 
                    fontSize={10}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: '#9CA3AF' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="p50" 
                    stroke={getMetricColor(metricName)} 
                    strokeWidth={2}
                    dot={false}
                    name="P50"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="p95" 
                    stroke={getMetricColor(metricName)} 
                    strokeWidth={1}
                    strokeDasharray="5 5"
                    dot={false}
                    name="P95"
                  />
                </LineChart>
              </ResponsiveContainer>
              
              <div className="flex justify-between text-xs text-neutral-400 mt-2">
                <span>P50: {data[data.length - 1]?.p50?.toFixed(2) || 'N/A'}</span>
                <span>P95: {data[data.length - 1]?.p95?.toFixed(2) || 'N/A'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 text-xs text-neutral-500">
        Showing {metrics.length} data points • Auto-refresh 10s
      </div>
    </div>
  );
} 