"use client";
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, DollarSign, Clock, BarChart3 } from 'lucide-react';

interface SessionData {
  tradeCount: number;
  avgTradeSize: number;
  totalVolume: number;
  lotFlow: number;
  topGainers: Array<{ symbol: string; change: number }>;
  topLosers: Array<{ symbol: string; change: number }>;
  sessionStart: string;
  lastUpdate: string;
}

export default function SessionAnalysis() {
  const [sessionData, setSessionData] = useState<SessionData>({
    tradeCount: 0,
    avgTradeSize: 0,
    totalVolume: 0,
    lotFlow: 0,
    topGainers: [],
    topLosers: [],
    sessionStart: new Date().toISOString(),
    lastUpdate: new Date().toISOString()
  });

  // Mock data - would be replaced with real API calls
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionData(prev => ({
        ...prev,
        tradeCount: prev.tradeCount + Math.floor(Math.random() * 3),
        avgTradeSize: 1250 + Math.random() * 500,
        totalVolume: prev.totalVolume + Math.random() * 10000,
        lotFlow: prev.lotFlow + (Math.random() - 0.5) * 1000,
        topGainers: [
          { symbol: 'BTCUSDT', change: 2.3 + Math.random() * 2 },
          { symbol: 'ETHUSDT', change: 1.8 + Math.random() * 1.5 },
          { symbol: 'ADAUSDT', change: 3.2 + Math.random() * 2 }
        ].sort((a, b) => b.change - a.change),
        topLosers: [
          { symbol: 'XRPUSDT', change: -1.2 - Math.random() * 1 },
          { symbol: 'SOLUSDT', change: -0.8 - Math.random() * 0.8 },
          { symbol: 'BNBUSDT', change: -0.5 - Math.random() * 0.5 }
        ].sort((a, b) => a.change - b.change),
        lastUpdate: new Date().toISOString()
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <BarChart3 className="size-5" />
          Seans İçi Analiz
        </h3>
        <div className="text-xs text-neutral-400 flex items-center gap-1">
          <Clock className="size-3" />
          {formatTime(sessionData.lastUpdate)}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-neutral-800/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="size-4 text-blue-400" />
            <span className="text-xs text-neutral-400">İşlem Sayısı</span>
          </div>
          <div className="text-xl font-semibold text-white">{sessionData.tradeCount}</div>
        </div>

        <div className="bg-neutral-800/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="size-4 text-green-400" />
            <span className="text-xs text-neutral-400">Ort. İşlem</span>
          </div>
          <div className="text-xl font-semibold text-white">
            {formatCurrency(sessionData.avgTradeSize)}
          </div>
        </div>

        <div className="bg-neutral-800/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="size-4 text-purple-400" />
            <span className="text-xs text-neutral-400">Toplam Hacim</span>
          </div>
          <div className="text-xl font-semibold text-white">
            {formatCurrency(sessionData.totalVolume)}
          </div>
        </div>

        <div className="bg-neutral-800/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="size-4 text-orange-400" />
            <span className="text-xs text-neutral-400">Lot Akışı</span>
          </div>
          <div className={`text-xl font-semibold ${
            sessionData.lotFlow >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {sessionData.lotFlow >= 0 ? '+' : ''}{sessionData.lotFlow.toFixed(0)}
          </div>
        </div>
      </div>

      {/* Top Gainers/Losers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Gainers */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="size-4 text-green-400" />
            <span className="text-sm font-medium text-white">Hızlı Yükselenler</span>
          </div>
          <div className="space-y-2">
            {sessionData.topGainers.map((item, index) => (
              <div key={index} className="flex items-center justify-between bg-green-600/10 border border-green-600/20 rounded-lg p-2">
                <span className="text-sm font-medium text-white">{item.symbol}</span>
                <span className="text-sm font-semibold text-green-400">
                  +{item.change.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Losers */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="size-4 text-red-400" />
            <span className="text-sm font-medium text-white">Hızlı Düşenler</span>
          </div>
          <div className="space-y-2">
            {sessionData.topLosers.map((item, index) => (
              <div key={index} className="flex items-center justify-between bg-red-600/10 border border-red-600/20 rounded-lg p-2">
                <span className="text-sm font-medium text-white">{item.symbol}</span>
                <span className="text-sm font-semibold text-red-400">
                  {item.change.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Session Info */}
      <div className="mt-4 pt-3 border-t border-neutral-700">
        <div className="text-xs text-neutral-400">
          Seans başlangıcı: {formatTime(sessionData.sessionStart)}
        </div>
      </div>
    </div>
  );
}
