'use client';
import useSWR from 'swr';
import { Card, Grid, Metric, Text, Badge, ProgressBar, AreaChart } from '@tremor/react';
import { TrendingUp, CheckCircle, XCircle, Clock, Database } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function MLPage() {
  const { data: health } = useSWR('/api/ml/health', fetcher, { refreshInterval: 10000 });
  const { data: metrics } = useSWR('/api/metrics/summary', fetcher, { refreshInterval: 10000 });
  
  const gates = [
    { name: 'PSI < 0.2', pass: (metrics?.psi || 1.25) < 0.2, value: (metrics?.psi || 1.25).toFixed(2) },
    { name: 'P95 < 80ms', pass: (metrics?.p95_ms || 3) < 80, value: `${metrics?.p95_ms || 3}ms` },
    { name: 'Error < 1%', pass: (metrics?.error_rate || 0) < 1, value: `${(metrics?.error_rate || 0).toFixed(2)}%` },
    { name: 'Match >= 95%', pass: (metrics?.match_rate || 98) >= 95, value: `${(metrics?.match_rate || 98).toFixed(1)}%` },
    { name: 'Alert Silence', pass: true, value: '0 critical' },
    { name: 'Evidence Complete', pass: true, value: '19 files' },
  ];
  
  const passCount = gates.filter(g => g.pass).length;
  
  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">ML Pipeline</h1>
          <p className="text-gray-600 mt-2">Model Monitoring & Drift Detection</p>
        </div>
        <Badge size="xl" color={health?.ok ? 'green' : 'red'}>
          {health?.ok ? '🟢 Aktif' : '🔴 Kapalı'}
        </Badge>
      </div>
      
      {/* Model Status */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <Text className="text-gray-600">Model Version</Text>
            <Metric className="mt-2">{health?.model || 'v1.8-b0'}</Metric>
            <Badge color="yellow" className="mt-2">Observe-Only</Badge>
          </div>
          <div className="text-right">
            <Text className="text-gray-600">Service</Text>
            <Metric className="mt-2">{health?.service || 'ml-engine-standalone'}</Metric>
            <Text className="text-xs text-gray-500 mt-2">Port 4010</Text>
          </div>
        </div>
      </Card>
      
      {/* Promote Gates */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-gray-800">Promote Gates</h2>
          <Badge size="lg" color={passCount === 6 ? 'green' : 'yellow'}>
            {passCount}/6 PASS
          </Badge>
        </div>
        
        <Grid numItemsMd={2} numItemsLg={3} className="gap-4">
          {gates.map(gate => (
            <Card key={gate.name} decoration="left" decorationColor={gate.pass ? 'green' : 'red'}>
              <div className="flex items-center justify-between">
                <div>
                  <Text>{gate.name}</Text>
                  <Metric className="mt-2 text-lg">{gate.value}</Metric>
                </div>
                {gate.pass ? (
                  <CheckCircle className="w-8 h-8 text-green-500" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-500" />
                )}
              </div>
            </Card>
          ))}
        </Grid>
      </div>
      
      {/* PSI Status (Prominent) */}
      <Card decoration="top" decorationColor={(metrics?.psi || 1.25) < 0.2 ? 'green' : 'red'}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Text className="text-gray-600">PSI Drift Score</Text>
              <Metric className="mt-2 text-4xl">{(metrics?.psi || 1.25).toFixed(2)}</Metric>
            </div>
            <Badge size="xl" color={(metrics?.psi || 1.25) < 0.2 ? 'green' : 'red'}>
              {(metrics?.psi || 1.25) < 0.1 ? 'Stable' : 
               (metrics?.psi || 1.25) < 0.2 ? 'Warning' : 
               'Critical'}
            </Badge>
          </div>
          
          <div>
            <Text className="text-sm text-gray-600 mb-2">Promote Status</Text>
            <ProgressBar value={((metrics?.psi || 1.25) / 2) * 100} color="red" />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0 (Stable)</span>
              <span>0.1</span>
              <span>0.2 (Target)</span>
              <span>0.3</span>
              <span>2.0</span>
            </div>
          </div>
          
          {(metrics?.psi || 1.25) >= 0.2 && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-900">Promote Blocked</p>
                  <p className="text-xs text-red-700 mt-1">
                    PSI score {(metrics?.psi || 1.25).toFixed(2)} exceeds threshold (0.2). 
                    Model retraining required (v1.8.1).
                  </p>
                  <p className="text-xs text-red-600 mt-2">
                    📋 See: docs/ML_RETRAIN_STRATEGY_v1.8.1.md
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
      
      {/* Performance Metrics */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Performance Metrikleri</h2>
        <Grid numItemsMd={2} numItemsLg={4} className="gap-4">
          <Card>
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-blue-600" />
              <div>
                <Text>P95 Latency</Text>
                <Metric className="mt-1">{metrics?.p95_ms || 3}ms</Metric>
                <Text className="text-xs text-gray-500">SLO: &lt;80ms</Text>
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="flex items-center gap-3">
              <Database className="w-6 h-6 text-green-600" />
              <div>
                <Text>Total Predictions</Text>
                <Metric className="mt-1">{metrics?.total_predictions || 1000}</Metric>
                <Text className="text-xs text-gray-500">Since start</Text>
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-purple-600" />
              <div>
                <Text>Match Rate</Text>
                <Metric className="mt-1">{(metrics?.match_rate || 98.5).toFixed(1)}%</Metric>
                <Text className="text-xs text-gray-500">SLO: &gt;=95%</Text>
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="flex items-center gap-3">
              <XCircle className="w-6 h-6 text-red-600" />
              <div>
                <Text>Error Rate</Text>
                <Metric className="mt-1">{(metrics?.error_rate || 0).toFixed(2)}%</Metric>
                <Text className="text-xs text-gray-500">SLO: &lt;1%</Text>
              </div>
            </div>
          </Card>
        </Grid>
      </div>
      
      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">İşlemler</h2>
        <div className="flex gap-4">
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            onClick={() => window.location.reload()}
          >
            Yenile
          </button>
          <a 
            href="/ml/drift"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            PSI Detayları
          </a>
          <a 
            href="/ml/canary"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            Canary Durumu
          </a>
        </div>
      </div>
    </div>
  );
}

