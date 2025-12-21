'use client';

import { EmptyState, ErrorState } from '@/components/ui/states';
import GoldenDashboard from '@/components/dashboard/GoldenDashboard';
import { useMarketStore } from '@/stores/marketStore';
import React from 'react';

export type DevState = 'loading' | 'empty' | 'error' | 'data';

interface DashboardClientProps {
  devState: DevState | null;
}

/**
 * DashboardClient - Golden Master v1.0
 *
 * 1366x768 çözünürlükte ASLA scroll gerektirmeyen trader ekranı.
 * h-full + min-h-0 zinciri ile yükseklik deterministik.
 */
export default function DashboardClient({ devState }: DashboardClientProps) {
  // Get WS status from market store
  const wsStatus = useMarketStore(s => s.status);

  // Tek kaynak: devState ?? 'data' (derived state, ilk render'da flicker yok)
  const panelState: DevState = devState ?? 'data';

  // Derived state
  const isLoading = panelState === 'loading';
  const hasError = panelState === 'error';
  const isEmpty = panelState === 'empty';

  const handleRetry = () => {
    window.location.href = '/dashboard';
  };

  // Golden Master v1.0: h-full + min-h-0 zinciri
  // Container padding yok, GoldenDashboard kendi padding'ini veriyor
  return (
    <div className="h-full min-h-0 overflow-hidden bg-[#050608]">
      {/* Debug state marker */}
      <div data-testid="dashboard-state" data-state={panelState} hidden aria-hidden="true" />

      {isLoading ? (
        <div className="h-full flex items-center justify-center">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="p-4 rounded-lg border border-[#16181d] bg-[#111318] animate-pulse">
                <div className="h-4 bg-[#262626] rounded w-1/3 mb-3"></div>
                <div className="h-8 bg-[#262626] rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      ) : hasError ? (
        <div className="h-full flex items-center justify-center">
          <ErrorState
            message="Dashboard verileri yüklenirken bir hata oluştu"
            onRetry={handleRetry}
          />
        </div>
      ) : isEmpty ? (
        <div className="h-full flex items-center justify-center">
          <EmptyState
            title="Henüz dashboard verisi yok"
            description="Veriler yüklendiğinde burada görünecek"
          />
        </div>
      ) : (
        <GoldenDashboard />
      )}
    </div>
  );
}

