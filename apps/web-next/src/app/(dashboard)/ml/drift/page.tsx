'use client';
import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Card, Grid, Metric, Text, Badge, ProgressBar } from '@tremor/react';
import { TrendingUp, RefreshCw, ShieldAlert, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function DriftPage() {
  const { data: snapshot, error, isLoading } = useSWR('/api/ml/psi', fetcher, { 
    refreshInterval: 60000, // 1 min
    fallbackData: null
  });
  
  const PSI_STABLE = 0.1;
  const PSI_WARN = 0.2;
  const PSI_CRIT = 0.3;
  
  const overall = snapshot?.overall_psi || 1.25;
  const features = snapshot?.features || {
    mid: { psi: 4.87, status: 'critical' },
    spreadBp: { psi: 0.05, status: 'stable' },
    vol1m: { psi: 0.01, status: 'stable' },
    rsi14: { psi: 0.08, status: 'stable' }
  };
  
  const getStatusColor = (psi: number) => {
    if (psi < PSI_STABLE) return 'green';
    if (psi < PSI_WARN) return 'yellow';
    return 'red';
  };
  
  const getStatusIcon = (psi: number) => {
    if (psi < PSI_STABLE) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (psi < PSI_WARN) return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    return <XCircle className="w-5 h-5 text-red-600" />;
  };
  
  const getStatusText = (psi: number) => {
    if (psi < PSI_STABLE) return 'Stable';
    if (psi < PSI_WARN) return 'Warning';
    return 'Critical';
  };
  
  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">PSI Drift Monitoring</h1>
          <p className="text-gray-600 mt-2">Population Stability Index - Feature Distribution Drift</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="p-2 rounded-lg hover:bg-gray-100 transition"
          title="Yenile"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      {/* Overall PSI Status */}
      <Card decoration="top" decorationColor={getStatusColor(overall)}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Text className="text-gray-600">Overall PSI Score</Text>
              <Metric className="mt-2 text-5xl">{overall.toFixed(2)}</Metric>
            </div>
            <div className="flex flex-col items-end gap-2">
              {getStatusIcon(overall)}
              <Badge size="xl" color={getStatusColor(overall)}>
                {getStatusText(overall)}
              </Badge>
            </div>
          </div>
          
          <div>
            <Text className="text-sm text-gray-600 mb-2">PSI Thresholds</Text>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Current: {overall.toFixed(2)}</span>
                <div className="flex gap-4">
                  <span className="text-green-600">✅ &lt;{PSI_STABLE} Stable</span>
                  <span className="text-yellow-600">⚠️ {PSI_STABLE}-{PSI_WARN} Warning</span>
                  <span className="text-red-600">❌ &gt;{PSI_WARN} Critical</span>
                </div>
              </div>
              <ProgressBar 
                value={Math.min((overall / 2) * 100, 100)} 
                color={getStatusColor(overall)}
              />
            </div>
          </div>
          
          {overall >= PSI_WARN && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-900">Promote Blocked</p>
                  <p className="text-xs text-red-700 mt-1">
                    PSI score {overall.toFixed(2)} exceeds promote gate threshold ({PSI_WARN}). 
                    Model retraining required before v1.8.1 promote.
                  </p>
                  <p className="text-xs text-red-600 mt-2">
                    📋 Retrain plan: <code className="bg-red-100 px-1 rounded">docs/ML_RETRAIN_STRATEGY_v1.8.1.md</code>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
      
      {/* Per-Feature PSI */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Feature-Level Drift</h2>
        <Grid numItemsMd={2} numItemsLg={4} className="gap-4">
          {Object.entries(features).map(([name, data]: [string, any]) => {
            const psi = data.psi || 0;
            const status = data.status || getStatusText(psi).toLowerCase();
            
            return (
              <Card key={name} decoration="left" decorationColor={getStatusColor(psi)}>
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <Text className="font-mono text-sm">{name}</Text>
                      <Metric className="mt-2">{psi.toFixed(4)}</Metric>
                    </div>
                    {getStatusIcon(psi)}
                  </div>
                  
                  <Badge color={getStatusColor(psi)} size="sm">
                    {getStatusText(psi)}
                  </Badge>
                  
                  {psi >= PSI_WARN && (
                    <Text className="text-xs text-gray-600">
                      {name === 'mid' ? 'Price distribution shifted (market volatility)' : 
                       'Distribution drift detected'}
                    </Text>
                  )}
                </div>
              </Card>
            );
          })}
        </Grid>
      </div>
      
      {/* Promote Gate Summary */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <Text className="text-gray-600">Promote Gate Status</Text>
            <Metric className="mt-2 text-3xl">
              {overall < PSI_WARN ? 'PASS ✅' : 'BLOCKED ❌'}
            </Metric>
            <Text className="text-sm text-gray-600 mt-2">
              Gate Threshold: PSI &lt; {PSI_WARN}
            </Text>
          </div>
          <div className="text-right space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Current:</span>
              <Badge size="lg" color={getStatusColor(overall)}>
                {overall.toFixed(2)}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Target:</span>
              <Badge size="lg" color="green">
                &lt; {PSI_WARN}
              </Badge>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Recommendations */}
      {overall >= PSI_WARN && (
        <Card decoration="top" decorationColor="yellow">
          <h3 className="text-lg font-semibold mb-3">📋 Recommended Actions</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="font-semibold text-yellow-700">1.</span>
              <span>Continue monitoring in observe-only mode (safe, zero production impact)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-yellow-700">2.</span>
              <span>Collect 14 days of feature data for v1.8.1 retraining</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-yellow-700">3.</span>
              <span>Implement drift-robust features (log-returns, rolling z-scores)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-yellow-700">4.</span>
              <span>Re-validate with mini-canary (3 phases, 90 min)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-yellow-700">5.</span>
              <span>Promote to v1.8.1 production after PSI &lt; 0.2 validated</span>
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-600">
            Timeline: 2-3 weeks | See: <code className="bg-gray-100 px-1 rounded">V1_8_1_QUICK_START.md</code>
          </div>
        </Card>
      )}
      
      {/* Timestamp */}
      {snapshot?.timestamp && (
        <Text className="text-xs text-gray-500 text-right">
          Last updated: {new Date(snapshot.timestamp).toLocaleString('tr-TR')}
        </Text>
      )}
    </div>
  );
}

