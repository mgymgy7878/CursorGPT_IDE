'use client';

import { useState } from 'react';
import { Card, Metric, Text, Badge, Grid } from '@tremor/react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

interface BacktestResult {
  status: 'idle' | 'running' | 'success' | 'error';
  runId?: string;
  metrics?: {
    totalReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    winRate: number;
    totalTrades: number;
    avgReturn: number;
  };
  error?: string;
  timestamp?: number;
  duration?: number;
}

interface ResultsPanelProps {
  result: BacktestResult;
}

export function ResultsPanel({ result }: ResultsPanelProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'trades' | 'logs'>('summary');

  if (result.status === 'idle') {
    return (
      <div className="h-full flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <Activity className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Stratejiyi çalıştırmak için yukarıdaki "Çalıştır" butonuna tıklayın</p>
          <p className="text-sm text-gray-500 mt-2">Kısayol: Ctrl+Enter</p>
        </div>
      </div>
    );
  }

  if (result.status === 'running') {
    return (
      <div className="h-full flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-3"></div>
          <p className="text-gray-300 font-medium">Backtest çalıştırılıyor...</p>
          <p className="text-sm text-gray-500 mt-2">Bu birkaç saniye sürebilir</p>
        </div>
      </div>
    );
  }

  if (result.status === 'error') {
    return (
      <div className="h-full flex items-center justify-center bg-gray-950">
        <div className="text-center max-w-md">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-400 font-medium mb-2">Hata Oluştu</p>
          <pre className="text-sm text-gray-400 bg-gray-900 p-4 rounded overflow-auto text-left">
            {result.error}
          </pre>
        </div>
      </div>
    );
  }

  // Success durumu
  const metrics = result.metrics!;
  const isPositive = metrics.totalReturn > 0;

  return (
    <div className="h-full flex flex-col bg-gray-950">
      {/* Tabs */}
      <div className="h-12 bg-gray-900 border-b border-gray-800 flex items-center px-4 gap-4">
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-3 py-1.5 text-sm rounded transition-colors ${
            activeTab === 'summary'
              ? 'bg-gray-800 text-white'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Özet
        </button>
        <button
          onClick={() => setActiveTab('trades')}
          className={`px-3 py-1.5 text-sm rounded transition-colors ${
            activeTab === 'trades'
              ? 'bg-gray-800 text-white'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          İşlemler
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-3 py-1.5 text-sm rounded transition-colors ${
            activeTab === 'logs'
              ? 'bg-gray-800 text-white'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Loglar
        </button>

        {/* Status Badge */}
        <div className="ml-auto flex items-center gap-2">
          <Badge color="green" size="sm">
            <CheckCircle className="h-3 w-3 mr-1 inline" />
            Başarılı
          </Badge>
          {result.duration && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {(result.duration / 1000).toFixed(1)}s
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'summary' && (
          <div className="space-y-4">
            {/* Main Metric Card */}
            <Card 
              decoration="top" 
              decorationColor={isPositive ? 'green' : 'red'}
              className="bg-gray-900 border-gray-800"
            >
              <div className="flex items-start justify-between">
                <div>
                  <Text className="text-gray-400">Toplam Getiri</Text>
                  <Metric className={`text-3xl ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {isPositive ? '+' : ''}{metrics.totalReturn.toFixed(2)}%
                  </Metric>
                </div>
                {isPositive ? (
                  <TrendingUp className="h-8 w-8 text-green-400" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-red-400" />
                )}
              </div>
            </Card>

            {/* Metrics Grid */}
            <Grid numItemsSm={2} numItemsLg={3} className="gap-4">
              <Card className="bg-gray-900 border-gray-800">
                <Text className="text-gray-400 text-sm">Sharpe Ratio</Text>
                <Metric className="text-gray-100">{metrics.sharpeRatio.toFixed(2)}</Metric>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <Text className="text-gray-400 text-sm">Max Drawdown</Text>
                <Metric className="text-red-400">{metrics.maxDrawdown.toFixed(2)}%</Metric>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <Text className="text-gray-400 text-sm">Kazanma Oranı</Text>
                <Metric className="text-gray-100">{metrics.winRate.toFixed(1)}%</Metric>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <Text className="text-gray-400 text-sm">Toplam İşlem</Text>
                <Metric className="text-gray-100">{metrics.totalTrades}</Metric>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <Text className="text-gray-400 text-sm">Ort. Getiri</Text>
                <Metric className="text-gray-100">{metrics.avgReturn.toFixed(2)}%</Metric>
              </Card>
            </Grid>

            {/* Info */}
            <div className="mt-4 p-3 bg-gray-900 border border-gray-800 rounded">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
                <div className="text-sm text-gray-400">
                  <p className="font-medium text-gray-300 mb-1">Backtest Bilgisi</p>
                  <p>Run ID: <code className="text-blue-400">{result.runId}</code></p>
                  <p className="mt-1">
                    Çalıştırma: {result.timestamp ? new Date(result.timestamp).toLocaleString('tr-TR') : '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trades' && (
          <div className="text-center py-12">
            <p className="text-gray-400">İşlem detayları yakında eklenecek</p>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="bg-gray-900 rounded p-4 font-mono text-xs text-gray-300">
            <p>[{new Date().toISOString()}] Backtest başlatıldı</p>
            <p>[{new Date().toISOString()}] Strateji yüklendi</p>
            <p>[{new Date().toISOString()}] {metrics.totalTrades} işlem simüle edildi</p>
            <p className="text-green-400">[{new Date().toISOString()}] Backtest başarıyla tamamlandı</p>
          </div>
        )}
      </div>
    </div>
  );
}

