'use client';

import { useState, useEffect } from "react";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { LazyWidget } from "@/components/ui/LazyWidget";
import ActiveStrategiesWidget from "@/components/dashboard/ActiveStrategiesWidget";
import MarketsHealthWidget from "@/components/dashboard/MarketsHealthWidget";
import AlarmCard from "@/components/dashboard/AlarmCard";
import SmokeCard from "@/components/dashboard/SmokeCard";
import { CanaryCard } from "@/components/dashboard/CanaryCard";
import { MarketCard } from "@/components/marketdata/MarketCard";
import { CopilotPanel } from "@/components/copilot/CopilotPanel";

interface MetricsData {
  p95Latency?: number;
  staleness?: number;
  exitCode?: number;
  canaryPass?: number;
  canaryTotal?: number;
}

interface TickerData {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
}

export default function DashboardPage() {
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [metrics, setMetrics] = useState<MetricsData>({});
  const [ticker, setTicker] = useState<TickerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch metrics from executor
        const metricsRes = await fetch('http://127.0.0.1:4001/metrics');
        if (metricsRes.ok) {
          const metricsText = await metricsRes.text();
          const lines = metricsText.split('\n');
          const metricsData: MetricsData = {};
          
          lines.forEach(line => {
            if (line.includes('latency_p95_ms')) {
              const value = parseFloat(line.split(' ')[1]);
              if (!isNaN(value)) metricsData.p95Latency = value;
            }
            if (line.includes('staleness_seconds')) {
              const value = parseFloat(line.split(' ')[1]);
              if (!isNaN(value)) metricsData.staleness = value;
            }
            if (line.includes('exit_code')) {
              const value = parseInt(line.split(' ')[1]);
              if (!isNaN(value)) metricsData.exitCode = value;
            }
          });
          
          setMetrics(metricsData);
        }

        // Mock ticker data for now
        setTicker({
          symbol: "BTCUSDT",
          price: 42500,
          change24h: 2.1,
          volume24h: 1250000,
          high24h: 43000,
          low24h: 42000
        });

      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <AppShell>
      <PageHeader
        title="Dashboard"
        subtitle="Son alarm ve canary durumu"
        chips={
          <>
            <span className="text-neutral-400">P95: 58ms</span>
            <span className="text-neutral-600">•</span>
            <span className="text-neutral-400">Staleness: 0s</span>
          </>
        }
        actions={
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors">
              Strateji Oluştur
            </button>
            <button className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white text-sm font-medium rounded-lg transition-colors">
              Uyarı Oluştur
            </button>
          </div>
        }
      />

      {/* Kritik kartlar (responsive grid) */}
      <div className="grid auto-rows-auto grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        <Card title="Son Alarm Durumu">
          <LazyWidget>
            <AlarmCard />
          </LazyWidget>
        </Card>
        
        <Card title="Son Canary Smoke">
          <LazyWidget>
            <SmokeCard />
          </LazyWidget>
        </Card>

        <LazyWidget>
          {metrics.p95Latency !== undefined ? (
            <CanaryCard 
              canaryPass={metrics.canaryPass || 5}
              canaryTotal={metrics.canaryTotal || 6}
              lastTimestamp="2025-01-17T20:15:00Z"
              riskLevel="low"
              p95Latency={metrics.p95Latency}
              staleness={metrics.staleness || 0}
              exitCode={metrics.exitCode || 0}
            />
          ) : (
            <Card title="Canary Evidence">
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p>Metrics yükleniyor...</p>
              </div>
            </Card>
          )}
        </LazyWidget>
        
        <LazyWidget>
          {ticker ? (
            <MarketCard 
              exchange="BTCTurk"
              ticker={{
                symbol: ticker.symbol,
                price: ticker.price,
                change24h: ticker.change24h,
                volume24h: ticker.volume24h,
                high24h: ticker.high24h,
                low24h: ticker.low24h
              }}
              orderBook={{
                bids: [
                  { price: 42450, amount: 0.5, total: 21225 },
                  { price: 42400, amount: 1.2, total: 50880 },
                  { price: 42350, amount: 0.8, total: 33880 }
                ],
                asks: [
                  { price: 42550, amount: 0.3, total: 12765 },
                  { price: 42600, amount: 0.7, total: 29820 },
                  { price: 42650, amount: 1.1, total: 46915 }
                ]
              }}
              trades={[
                { id: "1", price: 42500, amount: 0.1, side: "buy", timestamp: Date.now() - 1000 },
                { id: "2", price: 42480, amount: 0.2, side: "sell", timestamp: Date.now() - 2000 },
                { id: "3", price: 42520, amount: 0.15, side: "buy", timestamp: Date.now() - 3000 }
              ]}
              isLoading={isLoading}
            />
          ) : (
            <Card title="BTCTurk Market Data">
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p>Market verileri yükleniyor...</p>
              </div>
            </Card>
          )}
        </LazyWidget>
        
        <LazyWidget>
          <MarketCard 
            exchange="BIST"
            ticker={{
              symbol: "THYAO",
              price: 125.50,
              change24h: -0.8,
              volume24h: 2500000,
              high24h: 127.20,
              low24h: 124.80
            }}
          />
        </LazyWidget>

        <Card title="Aktif Stratejiler">
          <LazyWidget>
            <ActiveStrategiesWidget />
          </LazyWidget>
        </Card>
        
        <Card title="Pazar Sağlığı">
          <LazyWidget>
            <MarketsHealthWidget />
          </LazyWidget>
        </Card>
      </div>
      
      <div className="mt-6">
        <button
          onClick={() => setIsCopilotOpen(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Open Copilot Assistant
        </button>
      </div>
      
      <CopilotPanel 
        isOpen={isCopilotOpen} 
        onClose={() => setIsCopilotOpen(false)} 
      />
    </AppShell>
  );
}