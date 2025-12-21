'use client';

import { useState } from 'react';
import StrategyLabHeader from '@/components/strategy-lab/StrategyLabHeader';
import StrategyLabContent, { StrategyLabState } from '@/components/strategy-lab/StrategyLabContent';

export default function StrategyLab() {
  const [activeTab, setActiveTab] = useState<'ai' | 'backtest' | 'optimize' | 'best-of'>('ai');
  const [contentState, setContentState] = useState<StrategyLabState>('default');

  // Map tab to step
  const currentStep = activeTab === 'ai' ? 'ai' : activeTab === 'backtest' ? 'backtest' : activeTab === 'optimize' ? 'optimize' : 'best-of';

  return (
    <div className="min-h-screen bg-neutral-950">
      <StrategyLabHeader
        currentStep={currentStep}
        onStepClick={(step) => setActiveTab(step)}
      />

      <div className="container mx-auto px-4 py-6">
        <StrategyLabContent activeTab={activeTab} state={contentState} />
      </div>
    </div>
  );
}
