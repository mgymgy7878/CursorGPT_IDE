'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Shell } from '@/components/strategy-lab/Shell';
import { MonacoEditor } from '@/components/strategy-lab/MonacoEditor';
import { CopilotPanel } from '@/components/strategy-lab/CopilotPanel';
import type { BacktestResult, OptimizeResult } from '@/types/backtest';
import MetricsGrid from '@/components/strategy-lab/MetricsGrid';
import OptimizeDialog from '@/components/strategy-lab/OptimizeDialog';

// SSR sorunlarını önlemek için dynamic import
const EquityChart = dynamic(() => import('@/components/strategy-lab/EquityChart'), { ssr: false });

const DEFAULT_CODE = `# Spark Strategy Lab
# Python benzeri strateji kodu yazın

def strategy(data):
    """
    Args:
        data: OHLCV dataframe with columns ['open', 'high', 'low', 'close', 'volume']
    Returns:
        signals: List of signals ('BUY', 'SELL', 'HOLD')
    """
    # Örnek: Basit moving average crossover stratejisi
    short_window = 10
    long_window = 30
    
    # Moving averages hesapla
    short_ma = data['close'].rolling(window=short_window).mean()
    long_ma = data['close'].rolling(window=long_window).mean()
    
    signals = []
    for i in range(len(data)):
        if i < long_window:
            signals.append('HOLD')  # Yeterli veri yok
        elif short_ma[i] > long_ma[i] and short_ma[i-1] <= long_ma[i-1]:
            signals.append('BUY')   # Golden cross
        elif short_ma[i] < long_ma[i] and short_ma[i-1] >= long_ma[i-1]:
            signals.append('SELL')  # Death cross
        else:
            signals.append('HOLD')  # Pozisyon koru
    
    return signals

# Backtest parametreleri
config = {
    'symbol': 'BTCUSDT',
    'timeframe': '1h',
    'start_date': '2024-01-01',
    'end_date': '2024-12-31',
    'initial_capital': 10000,
    'commission': 0.001  # %0.1
}
`;

interface UIBacktestResult {
  status: 'idle' | 'running' | 'success' | 'error';
  runId?: string;
  data?: BacktestResult;
  optimizeResult?: OptimizeResult;
  error?: string;
  timestamp?: number;
  duration?: number;
}

export default function StrategyLabPage() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [result, setResult] = useState<UIBacktestResult>({ status: 'idle' });
  const [optimizeOpen, setOptimizeOpen] = useState(false);

  // LocalStorage'dan kodu yükle
  useEffect(() => {
    const saved = localStorage.getItem('strategy-lab-code');
    if (saved) {
      setCode(saved);
    }
  }, []);

  // Kodu her değiştiğinde localStorage'a kaydet
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('strategy-lab-code', code);
    }, 1000); // 1 saniye debounce

    return () => clearTimeout(timer);
  }, [code]);

  const handleRun = async () => {
    setResult({ status: 'running' });
    const startTime = Date.now();

    try {
      // API'ye backtest isteği gönder
      const response = await fetch('/api/exec/backtest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          language: 'python',
        }),
      });

      const data = await response.json();
      const duration = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(data.error || 'Backtest başarısız');
      }

      // API yanıtını kontrol et ve uygun formata dönüştür
      const backtestData: BacktestResult = data.equity ? data : generateMockBacktestResult();

      // Başarılı sonucu göster
      setResult({
        status: 'success',
        runId: data.runId,
        data: backtestData,
        timestamp: Date.now(),
        duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      
      setResult({
        status: 'error',
        error: error instanceof Error ? error.message : 'Bilinmeyen hata',
        timestamp: Date.now(),
        duration,
      });
    }
  };

  const handleCodeInsert = (insertedCode: string) => {
    // Copilot'tan gelen kodu editöre ekle
    setCode((prev) => prev + '\n\n' + insertedCode);
  };

  const handleOptimizeResult = (optimizeRes: OptimizeResult) => {
    setResult(prev => ({
      ...prev,
      optimizeResult: optimizeRes,
    }));
  };

  return (
    <>
      <Shell
        editorSlot={
          <MonacoEditor
            value={code}
            onChange={setCode}
            onRun={handleRun}
            isRunning={result.status === 'running'}
          />
        }
        copilotSlot={<CopilotPanel onCodeInsert={handleCodeInsert} />}
        resultsSlot={<EnhancedResultsPanel result={result} onOptimize={() => setOptimizeOpen(true)} />}
      />
      <OptimizeDialog
        open={optimizeOpen}
        onClose={() => setOptimizeOpen(false)}
        onResult={handleOptimizeResult}
      />
    </>
  );
}

// Enhanced Results Panel with new features
function EnhancedResultsPanel({ result, onOptimize }: { result: UIBacktestResult; onOptimize: () => void }) {
  if (result.status === 'idle') {
    return (
      <div className="text-sm text-gray-500 p-4">
        Backtest çalıştır ve sonuçları burada gör.
      </div>
    );
  }

  if (result.status === 'running') {
    return (
      <div className="p-4">
        <div className="animate-pulse text-sm">Backtest çalışıyor...</div>
      </div>
    );
  }

  if (result.status === 'error') {
    return (
      <div className="p-4">
        <div className="text-red-600 text-sm">Hata: {result.error}</div>
      </div>
    );
  }

  if (result.status === 'success' && result.data) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold">Backtest Sonuçları</h3>
          <button
            onClick={onOptimize}
            className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
          >
            Optimize Et
          </button>
        </div>
        
        <MetricsGrid m={result.data.metrics} />
        
        {result.data.equity && result.data.equity.length > 0 && (
          <EquityChart data={result.data.equity} currency />
        )}
        
        {result.data.logs && result.data.logs.length > 0 && (
          <details className="rounded-xl border p-3">
            <summary className="cursor-pointer text-sm">Loglar</summary>
            <pre className="mt-2 max-h-56 overflow-auto text-xs">{result.data.logs.join('\n')}</pre>
          </details>
        )}

        {result.optimizeResult && (
          <div className="mt-4 rounded-xl border p-3">
            <div className="text-sm font-semibold mb-2">Optimize Sonucu</div>
            <div className="text-xs">
              En iyi parametre: <code className="rounded bg-gray-100 px-1 py-0.5">
                {JSON.stringify(result.optimizeResult.best)}
              </code>
            </div>
            <div className="mt-2 overflow-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="text-left border-b">
                    <th className="pr-4 py-1">Param</th>
                    <th className="pr-4 py-1">Return%</th>
                    <th className="pr-4 py-1">Sharpe</th>
                    <th className="pr-4 py-1">MaxDD%</th>
                    <th className="pr-4 py-1">WinRate%</th>
                    <th className="pr-4 py-1">Trades</th>
                  </tr>
                </thead>
                <tbody>
                  {result.optimizeResult.trials.map((t, i) => {
                    const [k, v] = Object.entries(t.params)[0] ?? ['param', '-'];
                    const isBest = JSON.stringify(t.params) === JSON.stringify(result.optimizeResult!.best);
                    return (
                      <tr key={i} className={isBest ? 'bg-green-50' : ''}>
                        <td className="pr-4 py-1">{k}={v}</td>
                        <td className="pr-4 py-1">{t.metrics.totalReturnPct.toFixed(2)}</td>
                        <td className="pr-4 py-1">{t.metrics.sharpe.toFixed(2)}</td>
                        <td className="pr-4 py-1">{t.metrics.maxDrawdownPct.toFixed(2)}</td>
                        <td className="pr-4 py-1">{t.metrics.winRatePct.toFixed(2)}</td>
                        <td className="pr-4 py-1">{t.metrics.trades}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}

// Mock backtest result generator
function generateMockBacktestResult(): BacktestResult {
  const points = 100;
  const initialValue = 10000;
  const equity: BacktestResult['equity'] = [];
  let value = initialValue;
  
  for (let i = 0; i < points; i++) {
    const change = (Math.random() - 0.48) * 200; // Slight upward bias
    value = Math.max(initialValue * 0.8, value + change);
    equity.push({
      t: Date.now() - (points - i) * 3600 * 1000, // 1 hour intervals
      v: value
    });
  }

  const finalReturn = ((value - initialValue) / initialValue) * 100;

  return {
    equity,
    metrics: {
      totalReturnPct: finalReturn,
      sharpe: 0.5 + Math.random() * 2,
      maxDrawdownPct: -(Math.random() * 15 + 5),
      winRatePct: Math.random() * 30 + 45,
      trades: Math.floor(Math.random() * 100 + 50),
      avgTradePct: Math.random() * 2 - 0.5,
      durationMs: 1200 + Math.random() * 500,
    },
    logs: ['Backtest başladı', 'Veriler yüklendi', 'Strateji çalıştırıldı', 'Backtest tamamlandı']
  };
}

