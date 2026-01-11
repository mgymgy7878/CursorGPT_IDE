/**
 * StrategyLabHeader - Sticky header with stepper and status pills
 *
 * Figma parity: Title + Stepper + Status pills + Actions
 */

'use client';

import { Stepper, StepperStep } from '@/components/ui/Stepper';
import { StatusPill } from '@/components/ui/StatusPill';
import { Button } from '@/components/ui/button';

export interface StrategyLabHeaderProps {
  currentStep?: 'ai' | 'backtest' | 'optimize' | 'best-of';
  feedStatus?: 'healthy' | 'degraded' | 'down';
  brokerStatus?: 'online' | 'offline';
  env?: string;
  onStepClick?: (step: 'ai' | 'backtest' | 'optimize' | 'best-of') => void;
}

export default function StrategyLabHeader({
  currentStep = 'ai',
  feedStatus = 'healthy',
  brokerStatus = 'offline',
  env = 'Mock',
  onStepClick,
}: StrategyLabHeaderProps) {
  const steps: StepperStep[] = [
    {
      id: 'ai',
      label: 'AI',
      completed: currentStep !== 'ai',
      active: currentStep === 'ai',
    },
    {
      id: 'backtest',
      label: 'Backtest',
      completed: ['optimize', 'best-of'].includes(currentStep),
      active: currentStep === 'backtest',
      disabled: currentStep === 'ai' && !onStepClick, // Allow click if handler provided
    },
    {
      id: 'optimize',
      label: 'Optimize',
      completed: currentStep === 'best-of',
      active: currentStep === 'optimize',
      disabled: !['optimize', 'best-of'].includes(currentStep) && !onStepClick,
    },
    {
      id: 'best-of',
      label: 'Best-of',
      active: currentStep === 'best-of',
      disabled: currentStep !== 'best-of' && !onStepClick,
    },
  ];

  const feedTone = feedStatus === 'healthy' ? 'success' : feedStatus === 'degraded' ? 'warn' : 'error';
  const brokerTone = brokerStatus === 'online' ? 'success' : 'warn';

  return (
    <div className="sticky top-0 z-40 bg-neutral-950/95 backdrop-blur-sm border-b border-neutral-800">
      <div
        className="container mx-auto px-4"
        style={{
          paddingTop: 'var(--summary-strip-py, 10px)',
          paddingBottom: 'var(--summary-strip-py, 10px)',
        }}
      >
        {/* Top Row: Density Title + Status */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-baseline gap-2">
            <h1 className="text-[18px] font-semibold tracking-[-0.02em] leading-none text-neutral-200">Strategy Lab</h1>
            <span className="text-[11px] text-neutral-400 leading-none">AI → Backtest → Optimize → Best-of</span>
          </div>
          {/* Status pills */}
          <div className="flex items-center gap-2">
            <StatusPill label="Feed" value={feedStatus === 'healthy' ? 'Healthy' : feedStatus === 'degraded' ? 'Degraded' : 'Down'} tone={feedTone} />
            <StatusPill label="Broker" value={brokerStatus === 'online' ? 'Online' : 'Offline'} tone={brokerTone} />
            <StatusPill label="Env" value={env} tone="muted" />
          </div>
        </div>

        {/* Stepper */}
        <Stepper steps={steps} onStepClick={(stepId: string) => onStepClick?.(stepId as 'ai' | 'backtest' | 'optimize' | 'best-of')} />
      </div>
    </div>
  );
}

