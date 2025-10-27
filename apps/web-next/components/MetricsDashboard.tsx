"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface MetricsSummary {
  liveTrades24h: number;
  blocked24h: number;
  rbacBlocked24h: number;
}

interface MetricsSample {
  id: string;
  name: string;
  value: number;
  ts: string;
  source: string;
}

interface MetricsEvent {
  id: string;
  name: string;
  value: number;
  severity: string;
  createdAt: string;
}

interface MetricsThreshold {
  id: string;
  name: string;
  op: string;
  value: number;
  severity: string;
  enabled: boolean;
}

interface MetricsDashboardProps {
  user: { role: string } | null;
}

export default function MetricsDashboard({ user }: MetricsDashboardProps) {
  const [summary, setSummary] = useState<MetricsSummary | null>(null);
  const [samples, setSamples] = useState<MetricsSample[]>([]);
  const [events, setEvents] = useState<MetricsEvent[]>([]);
  const [thresholds, setThresholds] = useState<MetricsThreshold[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<string>("live_blocked_total.arm_only");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [selectedMetric]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Summary
      const summaryRes = await fetch("/api/local/metrics/summary?window=24h");
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setSummary(summaryData.summary);
      }

      // Samples (son 1 saat)
      const samplesRes = await fetch(`/api/local/metrics/samples?name=${selectedMetric}&window=1h`);
      if (samplesRes.ok) {
        const samplesData = await samplesRes.json();
        setSamples(samplesData.samples || []);
      }

      // Events (son 50)
      const eventsRes = await fetch("/api/local/metrics/events?limit=50");
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEvents(eventsData.events || []);
      }

      // Thresholds (ADMIN only)
      if (user?.role === "ADMIN") {
        const thresholdsRes = await fetch("/api/local/metrics/thresholds/list");
        if (thresholdsRes.ok) {
          const thresholdsData = await thresholdsRes.json();
          setThresholds(thresholdsData.thresholds || []);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "crit": return "bg-red-100 text-red-800";
      case "warn": return "bg-yellow-100 text-yellow-800";
      case "info": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case "crit": return "Kritik";
      case "warn": return "Uyarı";
      case "info": return "Bilgi";
      default: return "Bilinmiyor";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Metrikler yükleniyor...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center">
          <span className="text-red-600">⚠️</span>
          <span className="ml-2 text-red-800">{error}</span>
          <button 
            onClick={fetchData}
            className="ml-auto px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-green-600 text-xl">📈</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Live Trades (24h)</p>
              <p className="text-2xl font-bold text-gray-900">{summary?.liveTrades24h || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <span className="text-red-600 text-xl">🚫</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Blocked (24h)</p>
              <p className="text-2xl font-bold text-gray-900">{summary?.blocked24h || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <span className="text-yellow-600 text-xl">🔒</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">RBAC Blocks (24h)</p>
              <p className="text-2xl font-bold text-gray-900">{summary?.rbacBlocked24h || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Metrics Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Metrik Grafiği</h3>
            <div className="mt-2">
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="live_blocked_total.arm_only">Live Blocked - Arm Only</option>
                <option value="live_blocked_total.rule_violation">Live Blocked - Rule Violation</option>
                <option value="rbac_blocked_total">RBAC Blocked</option>
                <option value="backtest_runs_total">Backtest Runs</option>
                <option value="optimize_runs_total">Optimize Runs</option>
              </select>
            </div>
          </div>

          {samples.length > 0 ? (
            <div className="h-64 bg-gray-50 rounded flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-500">Grafik: {samples.length} veri noktası</p>
                <p className="text-sm text-gray-400">Son değer: {samples[0]?.value}</p>
              </div>
            </div>
          ) : (
            <div className="h-64 bg-gray-50 rounded flex items-center justify-center">
              <p className="text-gray-500">Henüz veri yok</p>
            </div>
          )}
        </div>

        {/* Thresholds Panel (ADMIN only) */}
        {user?.role === "ADMIN" && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Eşik Değerleri</h3>
            
            {thresholds.length > 0 ? (
              <div className="space-y-2">
                {thresholds.map((threshold) => (
                  <div key={threshold.id} className="p-3 bg-gray-50 rounded">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{threshold.name}</p>
                        <p className="text-xs text-gray-500">
                          {threshold.op} {threshold.value}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded ${getSeverityColor(threshold.severity)}`}>
                          {getSeverityLabel(threshold.severity)}
                        </span>
                        <button
                          onClick={() => {
                            // TODO: Delete threshold
                          }}
                          className="text-red-600 hover:text-red-800 text-xs"
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Henüz eşik değeri tanımlanmamış</p>
            )}

            <div className="mt-4 pt-4 border-t">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Yeni Eşik Ekle</h4>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Metrik adı"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                />
                <select className="w-full px-2 py-1 text-sm border border-gray-300 rounded">
                  <option value="gte">&gt;=</option>
                  <option value="gt">&gt;</option>
                  <option value="lte">&lt;=</option>
                  <option value="lt">&lt;</option>
                  <option value="eq">=</option>
                </select>
                <input
                  type="number"
                  placeholder="Değer"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                />
                <select className="w-full px-2 py-1 text-sm border border-gray-300 rounded">
                  <option value="info">Bilgi</option>
                  <option value="warn">Uyarı</option>
                  <option value="crit">Kritik</option>
                </select>
                <button className="w-full px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                  Ekle
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Metrik Olayları</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Metrik</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Değer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seviye</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    Henüz olay yok
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr key={event.id}>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {format(new Date(event.createdAt), "dd.MM.yyyy HH:mm", { locale: tr })}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {event.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {event.value}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded ${getSeverityColor(event.severity)}`}>
                        {getSeverityLabel(event.severity)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 