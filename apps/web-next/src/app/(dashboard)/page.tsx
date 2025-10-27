'use client';

import { Grid, Card, Metric, Text } from '@tremor/react';
import { Activity, TrendingUp, DollarSign, Layers } from 'lucide-react';
import { useApi } from '@/lib/useApi';
import { MarketWatch } from '@/components/dashboard/MarketWatch';
import { SystemHealthDot } from '@/components/dashboard/SystemHealthDot';
import ObservabilityPanel from '@/components/observability/ObservabilityPanel';
import SystemMonitor from '@/components/SystemMonitor';

interface MetricsSummary {
  activeStrategies: number;
  totalStrategies: number;
  totalTrades: number;
  dailyPnL: string;
  systemUptime: string;
}

export default function DashboardPage() {
  const { data: metrics, isLoading } = useApi<MetricsSummary>('/api/metrics/summary', {
    refreshInterval: 10000
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Platform Özeti
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Spark Trading Platform v1.9-p3
          </p>
        </div>
        <SystemHealthDot />
      </div>

      {/* Key Metrics */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
          Anahtar Metrikler
        </h2>
        <Grid numItemsMd={2} numItemsLg={4} className="gap-4">
          <Card decoration="top" decorationColor="blue">
            <div className="flex items-start justify-between">
              <div>
                <Text>Aktif Stratejiler</Text>
                <Metric className="mt-2">
                  {isLoading ? '...' : metrics?.activeStrategies || 0}
                </Metric>
                <Text className="text-xs text-gray-500 mt-1">
                  Toplam: {metrics?.totalStrategies || 0}
                </Text>
              </div>
              <Activity className="h-6 w-6 text-blue-500" />
            </div>
          </Card>

          <Card decoration="top" decorationColor="green">
            <div className="flex items-start justify-between">
              <div>
                <Text>Günlük İşlem</Text>
                <Metric className="mt-2">
                  {isLoading ? '...' : metrics?.totalTrades || 0}
                </Metric>
              </div>
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
          </Card>

          <Card decoration="top" decorationColor={
            metrics && parseFloat(metrics.dailyPnL) >= 0 ? 'green' : 'red'
          }>
            <div className="flex items-start justify-between">
              <div>
                <Text>Günlük P/L</Text>
                <Metric className={`mt-2 ${
                  metrics && parseFloat(metrics.dailyPnL) >= 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {isLoading ? '...' : (
                    `${parseFloat(metrics?.dailyPnL || '0') >= 0 ? '+' : ''}${parseFloat(metrics?.dailyPnL || '0').toFixed(2)} USD`
                  )}
                </Metric>
              </div>
              <DollarSign className={`h-6 w-6 ${
                metrics && parseFloat(metrics.dailyPnL) >= 0 
                  ? 'text-green-500' 
                  : 'text-red-500'
              }`} />
            </div>
          </Card>

          <Card decoration="top" decorationColor="purple">
            <div className="flex items-start justify-between">
              <div>
                <Text>Sistem Çalışma</Text>
                <Metric className="mt-2">
                  {isLoading ? '...' : `${metrics?.systemUptime || '0'}%`}
                </Metric>
                <Text className="text-xs text-gray-500 mt-1">Son 24 saat</Text>
              </div>
              <Layers className="h-6 w-6 text-purple-500" />
            </div>
          </Card>
        </Grid>
      </div>

      {/* Observability Panel */}
      <ObservabilityPanel />

      {/* System Monitor */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
          Sistem Durumu
        </h2>
        <SystemMonitor />
      </div>

      <Grid numItemsMd={2} className="gap-6">
        {/* Market Watch */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
            Piyasa Takip
          </h2>
          <MarketWatch symbols={['BTCUSDT', 'ETHUSDT']} />
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
            Hızlı Erişim
          </h2>
          <div className="space-y-3">
            <Card className="hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer">
              <a href="/strategy-lab" className="block">
                <Text className="font-semibold">🧪 Strateji Lab</Text>
                <Text className="text-sm text-gray-500 mt-1">
                  Yeni strateji oluştur veya mevcut stratejileri düzenle
                </Text>
              </a>
            </Card>

            <Card className="hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer">
              <a href="/strategies" className="block">
                <Text className="font-semibold">📋 Stratejilerim</Text>
                <Text className="text-sm text-gray-500 mt-1">
                  Tüm stratejileri görüntüle ve yönet
                </Text>
              </a>
            </Card>

            <Card className="hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer">
              <a href="/portfolio" className="block">
                <Text className="font-semibold">💼 Portföy</Text>
                <Text className="text-sm text-gray-500 mt-1">
                  Varlıklarını ve kazançlarını takip et
                </Text>
              </a>
            </Card>
          </div>
        </div>
      </Grid>
    </div>
  );
}
