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
      <div className="container mx-auto px-4 py-4">
        {/* Top Row: Title + Status + Actions */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-200">Strategy Lab</h1>
            <p className="text-sm text-neutral-400 mt-1">AI → Backtest → Optimize → Best-of</p>
          </div>
          {/* Status pills only - Ops Hızlı Yardım tek otorite olarak FAB'da */}
          <div className="flex items-center gap-3">
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

