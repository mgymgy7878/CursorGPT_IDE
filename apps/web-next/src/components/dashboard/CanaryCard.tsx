import React from 'react';
import { Card } from '@/components/ui/card';

interface CanaryCardProps {
  canaryPass: number;
  canaryTotal: number;
  lastTimestamp: string;
  riskLevel: 'low' | 'medium' | 'high';
  p95Latency?: number;
  staleness?: number;
  exitCode?: number;
}

export type { CanaryCardProps };

export function CanaryCard({
  canaryPass,
  canaryTotal,
  lastTimestamp,
  riskLevel,
  p95Latency,
  staleness,
  exitCode
}: CanaryCardProps) {
  const passRate = canaryTotal > 0 ? (canaryPass / canaryTotal) * 100 : 0;
  
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'high':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  const getRiskLabel = (level: string) => {
    switch (level) {
      case 'low':
        return 'Düşük Risk';
      case 'medium':
        return 'Orta Risk';
      case 'high':
        return 'Yüksek Risk';
      default:
        return 'Bilinmiyor';
    }
  };

  const getStatusIcon = (level: string) => {
    switch (level) {
      case 'low':
        return '✅';
      case 'medium':
        return '⚠️';
      case 'high':
        return '🚨';
      default:
        return '❓';
    }
  };

  return (
    <Card className={`p-4 border-2 ${getRiskColor(riskLevel)}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getStatusIcon(riskLevel)}</span>
          <h3 className="font-semibold text-gray-900 dark:text-white">Canary Evidence</h3>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(riskLevel)}`}>
          {getRiskLabel(riskLevel)}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Test Geçme Oranı</span>
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {canaryPass}/{canaryTotal}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({passRate.toFixed(1)}%)
            </span>
          </div>
        </div>

        {p95Latency !== undefined && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">P95 Latency</span>
            <span className={`text-sm font-medium ${
              p95Latency < 1000 ? 'text-green-600 dark:text-green-400' : 
              p95Latency < 2000 ? 'text-yellow-600 dark:text-yellow-400' : 
              'text-red-600 dark:text-red-400'
            }`}>
              {p95Latency}ms
            </span>
          </div>
        )}

        {staleness !== undefined && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Staleness</span>
            <span className={`text-sm font-medium ${
              staleness < 30 ? 'text-green-600 dark:text-green-400' : 
              staleness < 60 ? 'text-yellow-600 dark:text-yellow-400' : 
              'text-red-600 dark:text-red-400'
            }`}>
              {staleness}s
            </span>
          </div>
        )}

        {exitCode !== undefined && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Exit Code</span>
            <span className={`text-sm font-medium ${
              exitCode === 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {exitCode}
            </span>
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Son Test</span>
          <span className="text-sm text-gray-900 dark:text-white">
            {new Date(lastTimestamp).toLocaleString('tr-TR')}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2">
          <button className="flex-1 px-3 py-2 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
            Kanıtı Aç
          </button>
          <button className="flex-1 px-3 py-2 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors">
            Uyarı Oluştur
          </button>
        </div>
      </div>
    </Card>
  );
}

export default CanaryCard;
