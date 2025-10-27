"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface BacktestRun {
  id: string;
  symbol: string;
  timeframe: string;
  strategyName?: string;
  createdAt: string;
  summary: {
    sharpe: number;
    totalReturn: number;
    maxDrawdown: number;
    winRate: number;
    totalTrades: number;
  };
}

interface BacktestRunsProps {
  user: { role: string } | null;
}

export default function BacktestRuns({ user }: BacktestRunsProps) {
  const [runs, setRuns] = useState<BacktestRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string>("");
  const [symbols, setSymbols] = useState<string[]>([]);

  useEffect(() => {
    fetchRuns();
  }, [selectedSymbol]);

  const fetchRuns = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedSymbol) params.append("symbol", selectedSymbol);
      params.append("limit", "50");

      const response = await fetch(`/api/local/strategy/backtest/list?${params}`);
      if (!response.ok) throw new Error("Backtest listesi alınamadı");

      const data = await response.json();
      setRuns(data.runs || []);
      
      // Unique symbols
      const uniqueSymbols = [...new Set(data.runs?.map((run: BacktestRun) => run.symbol) || [])];
      setSymbols(uniqueSymbols as any);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd.MM.yyyy HH:mm", { locale: tr });
  };

  const formatMetric = (value: number, type: "percent" | "number" | "decimal") => {
    if (type === "percent") return `${(value * 100).toFixed(1)}%`;
    if (type === "decimal") return value.toFixed(2);
    return value.toFixed(0);
  };

  const getSharpeColor = (sharpe: number) => {
    if (sharpe >= 1.5) return "text-green-600";
    if (sharpe >= 1.0) return "text-yellow-600";
    return "text-red-600";
  };

  const getReturnColor = (return_: number) => {
    if (return_ >= 10) return "text-green-600";
    if (return_ >= 0) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Backtest geçmişi yükleniyor...</span>
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
            onClick={fetchRuns}
            className="ml-auto px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtreler */}
      <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Sembol:</label>
          <select
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="">Tümü</option>
            {symbols.map(symbol => (
              <option key={symbol} value={symbol}>{symbol}</option>
            ))}
          </select>
        </div>
        <button
          onClick={fetchRuns}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          Yenile
        </button>
      </div>

      {/* Tablo */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tarih
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sembol
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Strateji
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sharpe
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Getiri
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Max DD
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {runs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  Henüz backtest çalıştırılmamış
                </td>
              </tr>
            ) : (
              runs.map((run) => (
                <tr key={run.id} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {formatDate(run.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {run.symbol}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {run.strategyName || "İsimsiz Strateji"}
                  </td>
                  <td className={`px-4 py-3 text-sm font-medium ${getSharpeColor(run.summary.sharpe)}`}>
                    {formatMetric(run.summary.sharpe, "decimal")}
                  </td>
                  <td className={`px-4 py-3 text-sm font-medium ${getReturnColor(run.summary.totalReturn)}`}>
                    {formatMetric(run.summary.totalReturn, "percent")}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {formatMetric(run.summary.maxDrawdown, "percent")}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {run.summary.totalTrades}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* İstatistikler */}
      {runs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-blue-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{runs.length}</div>
            <div className="text-sm text-gray-600">Toplam Run</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatMetric(runs.reduce((sum, run) => sum + run.summary.sharpe, 0) / runs.length, "decimal")}
            </div>
            <div className="text-sm text-gray-600">Ortalama Sharpe</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {formatMetric(runs.reduce((sum, run) => sum + run.summary.totalReturn, 0) / runs.length, "percent")}
            </div>
            <div className="text-sm text-gray-600">Ortalama Getiri</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {runs.reduce((sum, run) => sum + run.summary.totalTrades, 0)}
            </div>
            <div className="text-sm text-gray-600">Toplam İşlem</div>
          </div>
        </div>
      )}
    </div>
  );
} 