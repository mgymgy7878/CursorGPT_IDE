/**
 * StrategyLabPipeline - Backtest → Optimize → Paper Run pipeline bar
 *
 * Test mode canlandırması için görsel pipeline gösterimi.
 * Her adım: idle/running/success/error + son çalışma zamanı + küçük log linki.
 */

'use client';

import { useState, useEffect } from 'react';
import { Surface } from '@/components/ui/Surface';
import { cn } from '@/lib/utils';

type StepStatus = 'idle' | 'running' | 'success' | 'error';

interface PipelineStep {
  id: string;
  label: string;
  status: StepStatus;
  lastRun?: Date;
  logUrl?: string;
}

interface PaperState {
  cashBalance: number;
  positions: Record<string, { symbol: string; qty: number; avgPrice: number }>;
  fills: Array<{ ts: number; symbol: string; side: string; qty: number; price: number; fee: number }>;
  pnl: { unrealized: number; realized: number; total: number };
}

interface JobResult {
  trades: number;
  winRate: number;
  maxDrawdown: number;
  sharpe: number;
  totalReturn: number;
}

interface JobState {
  jobId: string;
  type: 'backtest' | 'optimize';
  status: 'queued' | 'running' | 'success' | 'error';
  progressPct: number;
  startedAt: number;
  finishedAt?: number;
  result?: JobResult;
  error?: string;
}

export function StrategyLabPipeline() {
  const [steps, setSteps] = useState<PipelineStep[]>([
    { id: 'market-data', label: 'Market Data', status: 'idle' },
    { id: 'backtest', label: 'Backtest', status: 'idle' },
    { id: 'optimize', label: 'Optimize', status: 'idle' },
    { id: 'paper-run', label: 'Paper Run', status: 'idle' },
  ]);

  const [paperState, setPaperState] = useState<PaperState | null>(null);
  const [isPaperRunning, setIsPaperRunning] = useState(false);
  const [lastMarketPrice, setLastMarketPrice] = useState<number | null>(null);
  const [backtestJob, setBacktestJob] = useState<JobState | null>(null);
  const [optimizeJob, setOptimizeJob] = useState<JobState | null>(null);
  const [backtestResult, setBacktestResult] = useState<JobResult | null>(null);
  const [optimizeResult, setOptimizeResult] = useState<JobResult | null>(null);

  const handleStepClick = async (stepId: string) => {
    // Market Data step: gerçek klines çağrısı
    if (stepId === 'market-data') {
      const step = steps.find(s => s.id === stepId);
      if (step?.status === 'idle' || step?.status === 'error') {
        setSteps(prev => prev.map(s =>
          s.id === stepId ? { ...s, status: 'running' as StepStatus } : s
        ));

        try {
          // Gerçek klines çağrısı
          const response = await fetch('/api/binance/klines?symbol=BTCUSDT&interval=1h&limit=100', {
            cache: 'no-store',
          });

          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }

          const data = await response.json();
          if (!data.klines || data.klines.length === 0) {
            throw new Error('No klines data received');
          }

          // Extract last close price for Paper Run
          const lastKline = data.klines[data.klines.length - 1];
          const lastClose = lastKline[4]; // Binance klines format: [open, high, low, close, volume, ...]
          setLastMarketPrice(parseFloat(lastClose));

          // Success
          setSteps(prev => prev.map(s =>
            s.id === stepId
              ? { ...s, status: 'success' as StepStatus, lastRun: new Date() }
              : s
          ));
        } catch (error) {
          // Error
          setSteps(prev => prev.map(s =>
            s.id === stepId
              ? { ...s, status: 'error' as StepStatus, lastRun: new Date() }
              : s
          ));
          console.error('Market data fetch error:', error);
        }
      }
      return;
    }

    // Paper Run step: gerçek sim order (Optimize result'ı parametre olarak kullanır)
    if (stepId === 'paper-run') {
      const step = steps.find(s => s.id === stepId);
      const optimizeStep = steps.find(s => s.id === 'optimize');
      
      // Dependency check: Optimize başarılı olmalı (opsiyonel, şimdilik uyarı)
      if (optimizeStep?.status !== 'success' || !optimizeResult) {
        // Uyarı ver ama engelleme (kullanıcı manuel çalıştırabilir)
        console.warn('Optimize step not completed, using default parameters');
      }

      if (step?.status === 'idle' || step?.status === 'error') {
        // Start paper run
        setIsPaperRunning(true);
        setSteps(prev => prev.map(s =>
          s.id === stepId ? { ...s, status: 'running' as StepStatus } : s
        ));

        // Calculate position size based on optimize result (if available)
        const positionSizePct = optimizeResult ? Math.min(10, Math.max(1, optimizeResult.totalReturn / 10)) : 1; // 1-10% based on return
        const qty = lastMarketPrice ? (10000 * positionSizePct / 100) / lastMarketPrice : 0.001; // Default 0.001 if no price

        // Demo: BTCUSDT buy (gerçek sim order)
        if (lastMarketPrice) {
          try {
            const response = await fetch('/api/paper/order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                symbol: 'BTCUSDT',
                side: 'buy',
                qty: qty,
                marketPrice: lastMarketPrice,
                // Optimize → Paper Run wiring: feeBps, slippageBps could come from optimize result
              }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || `API error: ${response.status}`);
            }

            const data = await response.json();
            setPaperState(data.state);

            // Success
            setSteps(prev => prev.map(s =>
              s.id === stepId
                ? { ...s, status: 'success' as StepStatus, lastRun: new Date() }
                : s
            ));
          } catch (error) {
            // Error
            setSteps(prev => prev.map(s =>
              s.id === stepId
                ? { ...s, status: 'error' as StepStatus, lastRun: new Date() }
                : s
            ));
            console.error('Paper order error:', error);
          }
        } else {
          // No market price available
          setSteps(prev => prev.map(s =>
            s.id === stepId
              ? { ...s, status: 'error' as StepStatus, lastRun: new Date() }
              : s
          ));
        }
      } else if (step?.status === 'success' || step?.status === 'running') {
        // Stop paper run
        setIsPaperRunning(false);
        setSteps(prev => prev.map(s =>
          s.id === stepId ? { ...s, status: 'idle' as StepStatus } : s
        ));
      }
      return;
    }

    // Backtest step: gerçek job API
    if (stepId === 'backtest') {
      const step = steps.find(s => s.id === stepId);
      if (step?.status === 'idle' || step?.status === 'error') {
        setSteps(prev => prev.map(s =>
          s.id === stepId ? { ...s, status: 'running' as StepStatus } : s
        ));

        try {
          // Start backtest job
          const runResponse = await fetch('/api/backtest/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              symbol: 'BTCUSDT',
              interval: '1h',
            }),
          });

          if (!runResponse.ok) {
            throw new Error(`API error: ${runResponse.status}`);
          }

          const runData = await runResponse.json();
          setBacktestJob({ jobId: runData.jobId, type: 'backtest', status: 'queued', progressPct: 0, startedAt: Date.now() });
          setBacktestResult(null); // Reset result

          // Polling will handle status updates
        } catch (error) {
          setSteps(prev => prev.map(s =>
            s.id === stepId
              ? { ...s, status: 'error' as StepStatus, lastRun: new Date() }
              : s
          ));
          console.error('Backtest run error:', error);
        }
      }
      return;
    }

    // Optimize step: gerçek job API (Backtest result'ı input olarak alır)
    if (stepId === 'optimize') {
      const step = steps.find(s => s.id === stepId);
      const backtestStep = steps.find(s => s.id === 'backtest');
      
      // Dependency check: Backtest başarılı olmalı
      if (backtestStep?.status !== 'success' || !backtestResult) {
        alert('Önce Backtest adımını başarıyla tamamlamalısınız.');
        return;
      }

      if (step?.status === 'idle' || step?.status === 'error') {
        setSteps(prev => prev.map(s =>
          s.id === stepId ? { ...s, status: 'running' as StepStatus } : s
        ));

        try {
          // Start optimize job with backtest baseline metrics
          const runResponse = await fetch('/api/optimize/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              symbol: 'BTCUSDT',
              interval: '1h',
              baselineMetrics: backtestResult, // Backtest → Optimize wiring
            }),
          });

          if (!runResponse.ok) {
            throw new Error(`API error: ${runResponse.status}`);
          }

          const runData = await runResponse.json();
          setOptimizeJob({ jobId: runData.jobId, type: 'optimize', status: 'queued', progressPct: 0, startedAt: Date.now() });
          setOptimizeResult(null); // Reset result

          // Polling will handle status updates
        } catch (error) {
          setSteps(prev => prev.map(s =>
            s.id === stepId
              ? { ...s, status: 'error' as StepStatus, lastRun: new Date() }
              : s
          ));
          console.error('Optimize run error:', error);
        }
      }
      return;
    }
  };

  const getStatusIcon = (status: StepStatus) => {
    switch (status) {
      case 'idle':
        return '○';
      case 'running':
        return '⟳';
      case 'success':
        return '✓';
      case 'error':
        return '✗';
    }
  };

  const getStatusColor = (status: StepStatus) => {
    switch (status) {
      case 'idle':
        return 'text-neutral-500 border-neutral-700';
      case 'running':
        return 'text-blue-400 border-blue-500/30 bg-blue-500/10 animate-pulse';
      case 'success':
        return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
      case 'error':
        return 'text-red-400 border-red-500/30 bg-red-500/10';
    }
  };

  const formatLastRun = (date?: Date) => {
    if (!date) return '';
    const now = Date.now();
    const diff = now - date.getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s önce`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}dk önce`;
    const hours = Math.floor(minutes / 60);
    return `${hours}sa önce`;
  };

  // Fetch paper state periodically when running
  useEffect(() => {
    if (!isPaperRunning) return;

    const fetchState = async () => {
      try {
        const response = await fetch('/api/paper/state', { cache: 'no-store' });
        if (response.ok) {
          const state = await response.json();
          setPaperState(state);
        }
      } catch (error) {
        console.error('Failed to fetch paper state:', error);
      }
    };

    fetchState();
    const interval = setInterval(fetchState, 3000); // Every 3s
    return () => clearInterval(interval);
  }, [isPaperRunning]);

  // Poll backtest job status (with timeout + abort)
  useEffect(() => {
    if (!backtestJob || backtestJob.status === 'success' || backtestJob.status === 'error') return;

    const MAX_POLL_TIME = 45000; // 45 seconds
    const POLL_INTERVAL = 2000; // 2 seconds
    const MAX_ATTEMPTS = 25; // 25 attempts max

    const startTime = Date.now();
    let attempts = 0;
    const abortController = new AbortController();

    const pollStatus = async () => {
      attempts++;
      const elapsed = Date.now() - startTime;

      // Timeout check
      if (elapsed >= MAX_POLL_TIME || attempts >= MAX_ATTEMPTS) {
        setSteps(prev => prev.map(s =>
          s.id === 'backtest'
            ? { ...s, status: 'error' as StepStatus, lastRun: new Date() }
            : s
        ));
        setBacktestJob(prev => prev ? { ...prev, status: 'error' as JobState['status'], error: 'Polling timeout' } : null);
        return;
      }

      try {
        const response = await fetch(`/api/backtest/status?jobId=${backtestJob.jobId}`, {
          cache: 'no-store',
          signal: abortController.signal,
        });
        if (response.ok) {
          const status: JobState = await response.json();
          setBacktestJob(status);

          // Update step status
          if (status.status === 'success') {
            setBacktestResult(status.result || null);
            setSteps(prev => prev.map(s =>
              s.id === 'backtest'
                ? { ...s, status: 'success' as StepStatus, lastRun: new Date() }
                : s
            ));
          } else if (status.status === 'error') {
            setSteps(prev => prev.map(s =>
              s.id === 'backtest'
                ? { ...s, status: 'error' as StepStatus, lastRun: new Date() }
                : s
            ));
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return; // Aborted, ignore
        }
        console.error('Failed to poll backtest status:', error);
      }
    };

    pollStatus();
    const interval = setInterval(pollStatus, POLL_INTERVAL);
    return () => {
      clearInterval(interval);
      abortController.abort();
    };
  }, [backtestJob]);

  // Poll optimize job status (with timeout + abort)
  useEffect(() => {
    if (!optimizeJob || optimizeJob.status === 'success' || optimizeJob.status === 'error') return;

    const MAX_POLL_TIME = 45000; // 45 seconds
    const POLL_INTERVAL = 2000; // 2 seconds
    const MAX_ATTEMPTS = 25; // 25 attempts max

    const startTime = Date.now();
    let attempts = 0;
    const abortController = new AbortController();

    const pollStatus = async () => {
      attempts++;
      const elapsed = Date.now() - startTime;

      // Timeout check
      if (elapsed >= MAX_POLL_TIME || attempts >= MAX_ATTEMPTS) {
        setSteps(prev => prev.map(s =>
          s.id === 'optimize'
            ? { ...s, status: 'error' as StepStatus, lastRun: new Date() }
            : s
        ));
        setOptimizeJob(prev => prev ? { ...prev, status: 'error' as JobState['status'], error: 'Polling timeout' } : null);
        return;
      }

      try {
        const response = await fetch(`/api/optimize/status?jobId=${optimizeJob.jobId}`, {
          cache: 'no-store',
          signal: abortController.signal,
        });
        if (response.ok) {
          const status: JobState = await response.json();
          setOptimizeJob(status);

          // Update step status
          if (status.status === 'success') {
            setOptimizeResult(status.result || null);
            setSteps(prev => prev.map(s =>
              s.id === 'optimize'
                ? { ...s, status: 'success' as StepStatus, lastRun: new Date() }
                : s
            ));
          } else if (status.status === 'error') {
            setSteps(prev => prev.map(s =>
              s.id === 'optimize'
                ? { ...s, status: 'error' as StepStatus, lastRun: new Date() }
                : s
            ));
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return; // Aborted, ignore
        }
        console.error('Failed to poll optimize status:', error);
      }
    };

    pollStatus();
    const interval = setInterval(pollStatus, POLL_INTERVAL);
    return () => {
      clearInterval(interval);
      abortController.abort();
    };
  }, [optimizeJob]);

  return (
    <div className="space-y-3 mb-4">
      {/* Pipeline Bar */}
      <Surface variant="card" className="p-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-neutral-400">Pipeline:</span>
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-2">
              <button
                onClick={() => handleStepClick(step.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5",
                  getStatusColor(step.status),
                  step.status !== 'idle' && "cursor-pointer hover:opacity-80"
                )}
                disabled={step.status === 'running'}
              >
                <span>{getStatusIcon(step.status)}</span>
                <span>{step.label}</span>
                {step.lastRun && (
                  <span className="text-[10px] opacity-70">
                    {formatLastRun(step.lastRun)}
                  </span>
                )}
              </button>
              {index < steps.length - 1 && (
                <span className="text-neutral-600 text-xs">→</span>
              )}
            </div>
          ))}
        </div>
      </Surface>

      {/* Backtest Result Chips */}
      {backtestJob?.result && steps.find(s => s.id === 'backtest')?.status === 'success' && (
        <Surface variant="card" className="p-3">
          <div className="text-xs font-medium text-neutral-400 mb-2">Backtest Results:</div>
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 rounded bg-neutral-800 text-xs">
              Trades: {backtestJob.result.trades}
            </span>
            <span className={cn(
              "px-2 py-1 rounded text-xs",
              backtestJob.result.winRate >= 50 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
            )}>
              Win Rate: {backtestJob.result.winRate.toFixed(1)}%
            </span>
            <span className="px-2 py-1 rounded bg-neutral-800 text-xs">
              Max DD: {backtestJob.result.maxDrawdown.toFixed(1)}%
            </span>
            <span className="px-2 py-1 rounded bg-neutral-800 text-xs">
              Sharpe: {backtestJob.result.sharpe.toFixed(2)}
            </span>
            <span className={cn(
              "px-2 py-1 rounded text-xs",
              backtestJob.result.totalReturn >= 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
            )}>
              Return: {backtestJob.result.totalReturn >= 0 ? '+' : ''}{backtestJob.result.totalReturn.toFixed(1)}%
            </span>
          </div>
        </Surface>
      )}

      {/* Optimize Result Chips */}
      {optimizeJob?.result && steps.find(s => s.id === 'optimize')?.status === 'success' && (
        <Surface variant="card" className="p-3">
          <div className="text-xs font-medium text-neutral-400 mb-2">Optimize Results:</div>
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 rounded bg-neutral-800 text-xs">
              Trades: {optimizeJob.result.trades}
            </span>
            <span className={cn(
              "px-2 py-1 rounded text-xs",
              optimizeJob.result.winRate >= 50 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
            )}>
              Win Rate: {optimizeJob.result.winRate.toFixed(1)}%
            </span>
            <span className="px-2 py-1 rounded bg-neutral-800 text-xs">
              Max DD: {optimizeJob.result.maxDrawdown.toFixed(1)}%
            </span>
            <span className="px-2 py-1 rounded bg-neutral-800 text-xs">
              Sharpe: {optimizeJob.result.sharpe.toFixed(2)}
            </span>
            <span className={cn(
              "px-2 py-1 rounded text-xs",
              optimizeJob.result.totalReturn >= 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
            )}>
              Return: {optimizeJob.result.totalReturn >= 0 ? '+' : ''}{optimizeJob.result.totalReturn.toFixed(1)}%
            </span>
          </div>
        </Surface>
      )}

      {/* Paper State Panel (sadece paper-run success olduğunda göster) */}
      {paperState && steps.find(s => s.id === 'paper-run')?.status === 'success' && (
        <Surface variant="card" className="p-3">
          <div className="text-xs font-medium text-neutral-400 mb-2">Paper Ledger:</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <div className="text-neutral-500 mb-0.5">Cash</div>
              <div className="text-neutral-200 font-mono">
                ${paperState.cashBalance.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-neutral-500 mb-0.5">Positions</div>
              <div className="text-neutral-200">
                {Object.keys(paperState.positions).length > 0
                  ? Object.values(paperState.positions)
                      .map(p => `${p.symbol}: ${p.qty > 0 ? '+' : ''}${p.qty.toFixed(4)}`)
                      .join(', ')
                  : 'None'}
              </div>
            </div>
            <div>
              <div className="text-neutral-500 mb-0.5">Unrealized PnL</div>
              <div className={cn(
                "font-mono",
                paperState.pnl.unrealized >= 0 ? "text-emerald-400" : "text-red-400"
              )}>
                {paperState.pnl.unrealized >= 0 ? '+' : ''}${paperState.pnl.unrealized.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-neutral-500 mb-0.5">Last Fill</div>
              <div className="text-neutral-200 text-[10px]">
                {paperState.fills.length > 0
                  ? `${paperState.fills[paperState.fills.length - 1].symbol} ${paperState.fills[paperState.fills.length - 1].side} @ $${paperState.fills[paperState.fills.length - 1].price.toFixed(2)}`
                  : '—'}
              </div>
            </div>
          </div>
        </Surface>
      )}
    </div>
  );
}

