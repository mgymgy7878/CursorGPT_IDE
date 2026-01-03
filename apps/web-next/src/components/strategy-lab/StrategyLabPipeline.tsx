/**
 * StrategyLabPipeline - Backtest → Optimize → Paper Run pipeline bar
 *
 * Test mode canlandırması için görsel pipeline gösterimi.
 * Her adım: idle/running/success/error + son çalışma zamanı + küçük log linki.
 */

'use client';

import { useState } from 'react';
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

export function StrategyLabPipeline() {
  const [steps, setSteps] = useState<PipelineStep[]>([
    { id: 'market-data', label: 'Market Data', status: 'idle' },
    { id: 'backtest', label: 'Backtest', status: 'idle' },
    { id: 'optimize', label: 'Optimize', status: 'idle' },
    { id: 'paper-run', label: 'Paper Run', status: 'idle' },
  ]);

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

    // Diğer step'ler: demo state (sonraki sprint'te gerçek endpoint'lere bağlanacak)
    setSteps(prev => prev.map(step => {
      if (step.id === stepId) {
        if (step.status === 'idle') {
          return { ...step, status: 'running', lastRun: new Date() };
        } else if (step.status === 'running') {
          return { ...step, status: 'success', lastRun: new Date() };
        }
      }
      return step;
    }));

    // Simulate running state
    if (steps.find(s => s.id === stepId)?.status === 'idle') {
      setTimeout(() => {
        setSteps(prev => prev.map(step => {
          if (step.id === stepId && step.status === 'running') {
            return { ...step, status: 'success', lastRun: new Date() };
          }
          return step;
        }));
      }, 2000);
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

  return (
    <Surface variant="card" className="p-3 mb-4">
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
  );
}

