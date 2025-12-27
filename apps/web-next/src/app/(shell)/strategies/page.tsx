'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import MyStrategiesPage from '@/components/strategies/MyStrategiesPage';
import StrategyLabHeader from '@/components/strategy-lab/StrategyLabHeader';
import StrategyLabContent, { StrategyLabState } from '@/components/strategy-lab/StrategyLabContent';
import { cn } from '@/lib/utils';

type StrategyTab = 'list' | 'lab';

export default function StrategiesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<StrategyTab>(
    (searchParams?.get('tab') as StrategyTab) || 'list'
  );
  const [labActiveStep, setLabActiveStep] = useState<'ai' | 'backtest' | 'optimize' | 'best-of'>('ai');
  const [labState, setLabState] = useState<StrategyLabState>('default');

  const handleTabChange = (tab: StrategyTab) => {
    setActiveTab(tab);
    router.push(`/strategies?tab=${tab}`, { scroll: false });
  };

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Tabs */}
      <div className="sticky top-0 z-40 bg-neutral-950/95 backdrop-blur-sm border-b border-neutral-800">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTabChange('list')}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'list'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-neutral-400 hover:text-neutral-300'
              )}
            >
              Liste
            </button>
            <button
              onClick={() => handleTabChange('lab')}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'lab'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-neutral-400 hover:text-neutral-300'
              )}
            >
              Lab
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'list' && <MyStrategiesPage />}

        {activeTab === 'lab' && (
          <>
            <StrategyLabHeader
              currentStep={labActiveStep}
              onStepClick={(step) => setLabActiveStep(step)}
            />
            <div className="container mx-auto px-4 py-6">
              <StrategyLabContent activeTab={labActiveStep} state={labState} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
