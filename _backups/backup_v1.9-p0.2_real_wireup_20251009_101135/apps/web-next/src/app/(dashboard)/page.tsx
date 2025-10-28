'use client';
import useSWR from 'swr';
import Link from 'next/link';
import { Card, Grid, Metric, Text, Badge, ProgressCircle } from '@tremor/react';
import { Activity, TrendingUp, AlertCircle, CheckCircle2, Zap } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function DashboardPage() {
  const { data: health, error: healthError } = useSWR('/api/services/health', fetcher, { 
    refreshInterval: 10000,
    fallbackData: {}
  });
  
  const { data: metrics, error: metricsError } = useSWR('/api/metrics/summary', fetcher, { 
    refreshInterval: 10000,
    fallbackData: {}
  });
  
  const services = [
    { name: 'ML Engine', port: 4010, key: 'ml', status: health?.ml?.ok },
    { name: 'Executor', port: 4001, key: 'executor', status: health?.executor?.ok },
    { name: 'Export', port: 4001, key: 'export', status: health?.export?.ok },
    { name: 'Streams', port: 4002, key: 'streams', status: health?.streams?.ok },
  ];
  
  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Platform Özeti</h1>
        <p className="text-gray-600 mt-2">Spark Trading Platform - Real-time Monitoring</p>
      </div>
      
      {/* Service Health Cards */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Servis Durumu</h2>
        <Grid numItemsMd={2} numItemsLg={4} className="gap-6">
          {services.map(s => (
            <Card key={s.key} decoration="top" decorationColor={s.status ? 'green' : 'red'}>
              <div className="flex items-start justify-between">
                <div>
                  <Text className="text-gray-600">{s.name}</Text>
                  <Metric className="mt-2">:{s.port}</Metric>
                </div>
                <Badge color={s.status ? 'green' : 'red'} size="lg">
                  {s.status ? '🟢 Aktif' : '🔴 Kapalı'}
                </Badge>
              </div>
              {healthError && (
                <Text className="text-xs text-red-600 mt-2">API hatası</Text>
              )}
            </Card>
          ))}
        </Grid>
      </div>
      
      {/* Key Metrics */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Anahtar Metrikler</h2>
        <Grid numItemsMd={2} numItemsLg={4} className="gap-6">
          <MetricCard 
            title="P95 Latency"
            value={metrics?.p95_ms || 0}
            unit="ms"
            target={80}
            targetLabel="SLO"
            icon={<Zap className="w-8 h-8" />}
            good={metrics?.p95_ms < 80}
          />
          <MetricCard 
            title="Error Rate"
            value={metrics?.error_rate || 0}
            unit="%"
            target={1}
            targetLabel="Max"
            icon={<AlertCircle className="w-8 h-8" />}
            good={metrics?.error_rate < 1}
          />
          <MetricCard 
            title="PSI Score"
            value={metrics?.psi || 0}
            target={0.2}
            targetLabel="Target"
            icon={<TrendingUp className="w-8 h-8" />}
            good={metrics?.psi < 0.2}
            warning={true}
          />
          <MetricCard 
            title="Match Rate"
            value={metrics?.match_rate || 0}
            unit="%"
            target={95}
            targetLabel="Min"
            icon={<CheckCircle2 className="w-8 h-8" />}
            good={metrics?.match_rate >= 95}
          />
        </Grid>
        
        {metricsError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            ⚠️ Metrik servisi yanıt vermiyor. ML Engine çalıştığından emin olun.
          </div>
        )}
      </div>
      
      {/* PSI Status (Prominent) */}
      <Card decoration="top" decorationColor={metrics?.psi < 0.2 ? 'green' : 'red'}>
        <div className="flex items-center justify-between">
          <div>
            <Text>PSI Drift Status</Text>
            <Metric className="mt-2">{(metrics?.psi || 1.25).toFixed(2)}</Metric>
            <Text className="text-xs mt-2">
              {metrics?.psi < 0.1 ? '✅ Stable' : 
               metrics?.psi < 0.2 ? '⚠️ Warning' : 
               '❌ Critical - Retrain needed'}
            </Text>
          </div>
          <div className="flex flex-col items-end gap-2">
            <ProgressCircle 
              value={Math.min((metrics?.psi / 2) * 100, 100)} 
              color={metrics?.psi < 0.2 ? 'green' : 'red'}
              size="lg"
            >
              <span className="text-sm font-bold">
                {(metrics?.psi || 1.25).toFixed(1)}
              </span>
            </ProgressCircle>
            <Badge color={metrics?.psi < 0.2 ? 'green' : 'red'}>
              {metrics?.psi < 0.2 ? 'Promote Ready' : 'Blocked'}
            </Badge>
          </div>
        </div>
      </Card>
      
      {/* Quick Links */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Hızlı Erişim</h2>
        <Grid numItemsMd={2} numItemsLg={3} className="gap-4">
          <QuickLinkCard href="/ml" title="ML Pipeline" desc="Model durumu, PSI, canary" />
          <QuickLinkCard href="/export" title="Export İşleri" desc="CSV/PDF oluşturma" />
          <QuickLinkCard href="/optimizer" title="Optimizer" desc="İş kuyruğu, worker'lar" />
        </Grid>
      </div>
    </div>
  );
}

function MetricCard({ title, value, unit = '', target, targetLabel = 'SLO', icon, good, warning = false }: any) {
  const color = good ? 'green' : 'red';
  const displayValue = typeof value === 'number' ? value.toFixed(2) : value;
  
  return (
    <Card decoration="left" decorationColor={color}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Text className="text-gray-600">{title}</Text>
          <Metric className="mt-2">
            {displayValue}{unit}
          </Metric>
          <Text className="text-xs text-gray-500 mt-1">
            {targetLabel}: {target}{unit}
          </Text>
        </div>
        <div className={good ? 'text-green-500' : 'text-red-500'}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

function QuickLinkCard({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link href={href}>
      <Card className="hover:shadow-lg transition cursor-pointer">
        <Text className="font-semibold text-lg">{title}</Text>
        <Text className="text-sm text-gray-600 mt-1">{desc}</Text>
      </Card>
    </Link>
  );
}

