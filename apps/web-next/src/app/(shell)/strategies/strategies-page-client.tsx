"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MyStrategiesPage from '@/components/strategies/MyStrategiesPage';
import StrategyLabHeader from '@/components/strategy-lab/StrategyLabHeader';
import StrategyLabContent, { StrategyLabState } from '@/components/strategy-lab/StrategyLabContent';
import { cn } from '@/lib/utils';

type StrategyTab = 'list' | 'lab';

interface StrategiesPageClientProps {
  initialTab: 'list' | 'lab';
}

export default function StrategiesPageClient({ initialTab }: StrategiesPageClientProps) {
  const router = useRouter();

  // Normalize tab - ensure it's always 'list' or 'lab'
  const normalizedTab = useMemo(() => (initialTab === 'lab' ? 'lab' : 'list'), [initialTab]);

  const [activeTab, setActiveTab] = useState<StrategyTab>(normalizedTab);
  const [labActiveStep, setLabActiveStep] = useState<'ai' | 'backtest' | 'optimize' | 'best-of'>('ai');
  const [labState, setLabState] = useState<StrategyLabState>('default');

  // DEBUG: Render/mount kanıtı (dev'de görünsün)
  const showDebug = process.env.NODE_ENV !== 'production';

  // Sync activeTab with initialTab prop changes (e.g., URL navigation)
  useEffect(() => {
    if (normalizedTab !== activeTab) {
      setActiveTab(normalizedTab);
    }
  }, [normalizedTab, activeTab]);

  const handleTabChange = (newTab: StrategyTab) => {
    setActiveTab(newTab);
    router.push(`/strategies?tab=${newTab}`, { scroll: false });
  };

  return (
    <div className="relative z-10 text-white">
      {/* DEBUG PILL: Mount kanıtı - görünür olmalı */}
      {showDebug && (
        <div className="fixed left-3 top-3 z-[9999] rounded bg-black/90 px-3 py-2 text-xs text-white ring-1 ring-white/20 shadow-lg">
          strategies-page-client mounted · tab={activeTab}
        </div>
      )}
      {/* Tabs */}
      <div className="sticky top-0 z-40 bg-neutral-950/95 backdrop-blur-sm border-b border-neutral-800 relative">
        <div className="px-4 py-3">
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

      {/* Tab Content - Always render something, never return null */}
      <div className="relative z-10">
        {activeTab === 'list' && <MyStrategiesPage />}

        {activeTab === 'lab' && (
          <>
            <StrategyLabHeader
              currentStep={labActiveStep}
              onStepClick={(step) => setLabActiveStep(step)}
            />
            <div className="px-4 py-6">
              <StrategyLabContent activeTab={labActiveStep} state={labState} />
            </div>
          </>
        )}

        {/* Fallback: Should never reach here, but just in case */}
        {activeTab !== 'list' && activeTab !== 'lab' && (
          <div className="p-6">
            <div className="text-sm text-neutral-400">Geçersiz tab: {activeTab}</div>
          </div>
        )}
      </div>
    </div>
  );
}

