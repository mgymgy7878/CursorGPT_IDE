'use client';

import PageHeader from '@/components/layout/PageHeader';
import StatusPills from '@/components/layout/StatusPills';
import ErrorBudgetBadge from '@/components/ops/ErrorBudgetBadge';
import { EmptyState, ErrorState } from '@/components/ui/states';
import DashboardGrid from '@/components/dashboard/DashboardGrid';
import { t } from '@/lib/i18n';
import { useMarketStore } from '@/stores/marketStore';
import React from 'react';

export type DevState = 'loading' | 'empty' | 'error' | 'data';

interface DashboardClientProps {
  devState: DevState | null;
}

export default function DashboardClient({ devState }: DashboardClientProps) {
  // Get WS status from market store
  const wsStatus = useMarketStore(s => s.status);

  const env = 'Mock';
  const feed = wsStatus === 'healthy' ? 'Healthy' : wsStatus === 'degraded' ? 'Degraded' : 'Down';
  const broker = 'Offline';

  const p95Ms = 58;
  const stalenessMs = 0;

  // Tek kaynak: devState ?? 'data' (derived state, ilk render'da flicker yok)
  // Default state: her zaman 'data' (deterministic fixture data, Figma parity)
  // Loading/empty/error sadece ?state=loading|empty|error query param ile tetiklenir
  const panelState: DevState = devState ?? 'data';

  // Derived state (panelState'ten türetilir, useEffect yok)
  const isLoading = panelState === 'loading';
  const hasError = panelState === 'error';
  const isEmpty = panelState === 'empty';
  const hasData = panelState === 'data';

  const handleCreateStrategy = () => {
    window.location.href = '/strategy-lab';
  };

  const handleCreateAlert = () => {
    // TODO: Open alert creation modal
    console.log('Create alert');
  };

  const handleRetry = () => {
    // Retry: sayfayı yenile (state query param olmadan, default = data)
    window.location.href = '/dashboard';
  };

  return (
    <div className="w-full max-w-screen-2xl mx-auto px-6 py-6 bg-neutral-950">
      {/* Debug guard: default state sanity-check (her zaman DOM'da, sr-only ile gizli, screenshot'a etkisi yok) */}
      {/* Production-safe: Guard her zaman DOM'da dursun (ileride prod build üzerinden test çalıştırılırsa false negative olmaz) */}
      {/* data-state attribute: metin render/padding vb. hiç umrun olmaz, toHaveAttribute ile "kurşungeçirmez" test */}
      <div data-testid="dashboard-state" data-state={panelState} className="sr-only" aria-hidden="true">
        {panelState}
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

      {/* Main content - Dashboard Grid (Figma Parity) */}
      <div className="mt-6">
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="p-4 rounded-lg border border-neutral-800 bg-neutral-900/80 animate-pulse">
                <div className="h-4 bg-neutral-800 rounded w-1/3 mb-3"></div>
                <div className="h-8 bg-neutral-800 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : hasError ? (
          <ErrorState
            message="Dashboard verileri yüklenirken bir hata oluştu"
            onRetry={handleRetry}
          />
        ) : isEmpty ? (
          <EmptyState
            title="Henüz dashboard verisi yok"
            description="Veriler yüklendiğinde burada görünecek"
          />
        ) : (
          <DashboardGrid />
        )}
      </div>
    </div>
  );
}

