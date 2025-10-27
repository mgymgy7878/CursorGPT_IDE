import React from 'react';
import { RunningTable, RunningStrategy } from '@/components/running/RunningTable';
import { formatCurrency } from '@/lib/utils/currency';

/**
 * Running Strategies Page
 * Displays active, paused, and stopped strategies with real-time PnL updates
 */

interface RunningData {
  strategies: RunningStrategy[];
  summary: {
    totalPnlUSD: number;
    activeCount: number;
    pausedCount: number;
    stoppedCount: number;
  };
  timestamp: string;
}

async function getRunningData(): Promise<RunningData> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';
  
  try {
    const res = await fetch(`${baseUrl}/api/mock/running`, {
      cache: 'no-store',
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch running strategies: ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error('Running strategies fetch error:', error);
    
    // Return fallback data
    return {
      strategies: [],
      summary: {
        totalPnlUSD: 0,
        activeCount: 0,
        pausedCount: 0,
        stoppedCount: 0,
      },
      timestamp: new Date().toISOString(),
    };
  }
}

export default async function RunningPage() {
  const data = await getRunningData();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-6 h-6 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h1 className="text-2xl font-bold text-text-strong">Çalışan Stratejiler</h1>
        </div>
        <p className="text-sm text-text-muted">Aktif, duraklatılmış ve geçmiş stratejiler</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-xs text-text-muted mb-1">Toplam PnL</p>
          <p
            className={`text-2xl font-bold tabular ${
              data.summary.totalPnlUSD >= 0 ? 'text-success' : 'text-danger'
            }`}
          >
            {formatCurrency(data.summary.totalPnlUSD, { showPositiveSign: true, decimals: 2 })}
          </p>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-xs text-text-muted mb-1">Çalışıyor</p>
          <p className="text-2xl font-bold text-success tabular">{data.summary.activeCount}</p>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-xs text-text-muted mb-1">Duraklatıldı</p>
          <p className="text-2xl font-bold text-warning tabular">{data.summary.pausedCount}</p>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-xs text-text-muted mb-1">Durduruldu</p>
          <p className="text-2xl font-bold text-danger tabular">{data.summary.stoppedCount}</p>
        </div>
      </div>

      {/* Filter Tabs (Future Enhancement) */}
      <div className="flex items-center gap-2">
        <button className="px-4 py-2 text-sm font-medium text-white bg-accent rounded-md">
          Tümü
        </button>
        <button className="px-4 py-2 text-sm font-medium text-text-base bg-bg-card-hover border border-border rounded-md hover:bg-bg-card transition-colors">
          Çalışıyor
        </button>
        <button className="px-4 py-2 text-sm font-medium text-text-base bg-bg-card-hover border border-border rounded-md hover:bg-bg-card transition-colors">
          Duraklatıldı
        </button>
        <button className="px-4 py-2 text-sm font-medium text-text-base bg-bg-card-hover border border-border rounded-md hover:bg-bg-card transition-colors">
          Durduruldu
        </button>
      </div>

      {/* Running Strategies Table */}
      <div>
        <h2 className="text-lg font-semibold text-text-strong mb-4">Stratejiler</h2>
        <RunningTable
          strategies={data.strategies}
          onTogglePause={(id) => {
            console.log('Toggle pause:', id);
            // TODO: Implement pause/resume logic
          }}
          onStop={(id) => {
            console.log('Stop strategy:', id);
            // TODO: Implement stop logic
          }}
        />
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Çalışan Stratejiler | Spark Trading',
  description: 'Aktif, duraklatılmış ve geçmiş stratejiler',
};

