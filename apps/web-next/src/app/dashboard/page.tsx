'use client';
export const dynamic = 'force-dynamic';

import PageHeader from '@/components/layout/PageHeader';
import StatusPills from '@/components/layout/StatusPills';
import Metric from '@/components/ui/Metric';
import LiveMarketCard from '@/components/marketdata/LiveMarketCard';
import ErrorBudgetBadge from '@/components/ops/ErrorBudgetBadge';
import { Skeleton, EmptyState, ErrorState } from '@/components/ui/states';
import { formatDuration } from '@/lib/format';
import { t } from '@/lib/i18n';
import { useMarketStore } from '@/stores/marketStore';
import React, { useState, useEffect } from 'react';

type DevState = 'loading' | 'empty' | 'error' | 'data';

// SSR-safe dev state resolver (production'da otomatik pasif)
function resolveDevState(searchParams?: { state?: string }): DevState | null {
  // Production'da dev toggle pasif
  if (process.env.NODE_ENV === 'production') return null;

  const state = searchParams?.state;
  if (state === 'loading' || state === 'empty' || state === 'error' || state === 'data') {
    return state;
  }
  return null;
}

export default function DashboardPage({
  searchParams,
}: {
  searchParams?: { state?: string };
}) {
  // Dev toggle: ?state=loading|empty|error (GIF çekmek ve regression test için)
  const devState = resolveDevState(searchParams);

  // Get WS status from market store
  const wsStatus = useMarketStore(s => s.status);

  const env = 'Mock';
  const feed = wsStatus === 'healthy' ? 'Healthy' : wsStatus === 'degraded' ? 'Degraded' : 'Down';
  const broker = 'Offline';

  const p95Ms = 58;
  const stalenessMs = 0;

  // Dev toggle: Panel state'i query param'dan al veya normal akıştan belirle
  const [panelState, setPanelState] = useState<DevState>('data');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    if (devState) {
      // Dev toggle aktif: query param'dan state'i al
      setPanelState(devState);
      setIsLoading(devState === 'loading');
      setHasError(devState === 'error');
      setHasData(devState === 'data');
    } else {
      // Normal akış: gerçek data durumuna göre belirle
      // TODO: Gerçek API çağrıları burada yapılacak
      setTimeout(() => {
        setIsLoading(false);
        setHasError(false);
        setHasData(true); // Şimdilik mock data var
        setPanelState('data');
      }, 1000);
    }
  }, [devState]);

  const handleCreateStrategy = () => {
    window.location.href = '/strategy-lab';
  };

  const handleCreateAlert = () => {
    // TODO: Open alert creation modal
    console.log('Create alert');
  };

  const handleRetry = () => {
    setIsLoading(true);
    setHasError(false);
    setTimeout(() => {
      setIsLoading(false);
      setHasData(true);
      setPanelState('data');
    }, 1000);
  };

  return (
    <div className="relative px-6 py-4 min-h-screen bg-neutral-950 overflow-hidden">
      {/* Watermark Background - Spark Mark */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <svg
            className="w-[900px] h-[900px] opacity-[0.06]"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M8 2L9.5 5.5L13 6L10.5 8.5L11.5 12L8 10L4.5 12L5.5 8.5L3 6L6.5 5.5L8 2Z"
              fill="currentColor"
              fillRule="evenodd"
            />
          </svg>
        </div>
      </div>
      <PageHeader
        title={
          <div className="flex items-center gap-2">
            Spark Trading
            <ErrorBudgetBadge />
          </div>
        }
        subtitle="Dashboard"
        chips={[
          { label: `${t('dashboard.target')}: 1200 ms`, tone: 'muted' },
          { label: `${t('dashboard.threshold')}: 30 sn`, tone: 'muted' },
        ]}
        actions={[
          { label: t('actions.createStrategy'), onClick: handleCreateStrategy },
          { label: t('actions.createAlert'), variant: 'ghost', onClick: handleCreateAlert },
        ]}
      />

      <div className="mb-4">
        <StatusPills env={env} feed={feed} broker={broker} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
        {/* Left column - Main content */}
        <div className="grid gap-4">
          {/* Metrics row */}
          <div className="grid md:grid-cols-2 gap-4">
            <Metric
              label={t('dashboard.p95')}
              value={formatDuration(p95Ms)}
              hint={`${t('dashboard.target')}: 1200 ms`}
              className="num-tight"
            />
            <Metric
              label={t('dashboard.staleness')}
              value={formatDuration(stalenessMs)}
              hint={`${t('dashboard.threshold')}: 30 sn`}
              className="num-tight"
            />
          </div>

          {/* Cards row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Alarm Drafts Card - UIStates Kit kullanımı */}
            <div className="rounded-2xl bg-card/60 p-4 min-h-[200px]">
              <div className="text-sm font-medium mb-2">{t('dashboard.alarmDrafts')}</div>
              {isLoading ? (
                <Skeleton className="mt-2" />
              ) : hasError ? (
                <ErrorState
                  error="Alarm taslakları yüklenirken bir hata oluştu"
                  onRetry={handleRetry}
                />
              ) : !hasData ? (
                <EmptyState
                  title="Henüz alarm taslağı yok"
                  description="Yeni bir alarm oluşturmak için butona tıklayın"
                  action={
                    <button
                      onClick={handleCreateAlert}
                      className="px-4 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Alarm Oluştur
                    </button>
                  }
                />
              ) : (
                <div className="text-xs text-neutral-500">{t('dashboard.noData')}</div>
              )}
            </div>

            {/* Canary Tests Card - UIStates Kit kullanımı */}
            <div className="rounded-2xl bg-card/60 p-4 min-h-[200px]">
              <div className="text-sm font-medium mb-2">{t('dashboard.canaryTests')}</div>
              {isLoading ? (
                <Skeleton className="mt-2" />
              ) : hasError ? (
                <ErrorState
                  error="Canary testleri yüklenirken bir hata oluştu"
                  onRetry={handleRetry}
                />
              ) : !hasData ? (
                <EmptyState
                  title="Henüz canary testi yok"
                  description="Yeni bir canary testi oluşturmak için butona tıklayın"
                  action={
                    <button
                      onClick={() => console.log('Create canary test')}
                      className="px-4 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Test Oluştur
                    </button>
                  }
                />
              ) : (
                <div className="text-xs text-neutral-500">{t('dashboard.noData')}</div>
              )}
            </div>
          </div>

          {/* Live Market Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LiveMarketCard symbol="BTCUSDT" />
            <LiveMarketCard symbol="ETHUSDT" />
          </div>
        </div>

        {/* Right column - Sticky sidebar */}
        <aside className="w-full lg:w-[360px] shrink-0 sticky top-24 self-start pb-40 md:pb-44 pr-2 grid gap-4 [scroll-padding-bottom:120px]">
          {/* Last Alarm Status */}
          <div className="rounded-2xl bg-card/60 p-4">
            <div className="text-sm font-medium mb-2">{t('dashboard.lastAlarm')}</div>
            <div className="text-xs text-neutral-500">{t('dashboard.noData')}</div>
          </div>

          {/* Last Canary Test */}
          <div className="rounded-2xl bg-card/60 p-4">
            <div className="text-sm font-medium mb-2">{t('dashboard.lastCanary')}</div>
            <div className="text-xs text-neutral-500">{t('dashboard.noData')}</div>
          </div>
        </aside>
      </div>
    </div>
  );
}

