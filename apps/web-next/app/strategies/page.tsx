import React from 'react';
import { StrategyCard, StrategyCardData } from '@/components/strategies/StrategyCard';

/**
 * Strategies Page
 * Grid view of user-created strategies with filters
 */

interface StrategiesData {
  filters: {
    market: string[];
    type: string[];
  };
  items: StrategyCardData[];
  total: number;
  timestamp: string;
}

async function getStrategiesData(): Promise<StrategiesData> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';
  
  try {
    const res = await fetch(`${baseUrl}/api/mock/strategies`, {
      cache: 'no-store',
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch strategies: ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error('Strategies fetch error:', error);
    
    // Return fallback data
    return {
      filters: {
        market: ['kripto', 'bist', 'hisse'],
        type: ['scalping', 'grid', 'spot', 'swing'],
      },
      items: [],
      total: 0,
      timestamp: new Date().toISOString(),
    };
  }
}

export default async function StrategiesPage() {
  const data = await getStrategiesData();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-6 h-6 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h1 className="text-2xl font-bold text-text-strong">Stratejilerim</h1>
          </div>
          <p className="text-sm text-text-muted">Oluşturulmuş strateji listesi</p>
        </div>

        {/* New Strategy Button */}
        <button
          className="px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-hover rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-page"
          onClick={() => console.log('New strategy')}
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Yeni Strateji
          </span>
        </button>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Market Filters */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-text-muted min-w-[80px]">Piyasa:</span>
          <div className="flex flex-wrap gap-2">
            <button
              className="px-3 py-1.5 text-xs font-medium text-white bg-accent rounded-md"
              role="button"
              aria-pressed="true"
            >
              Tümü
            </button>
            {data.filters.market.map((market) => (
              <button
                key={market}
                className="px-3 py-1.5 text-xs font-medium text-text-base bg-bg-card-hover border border-border rounded-md hover:bg-bg-card transition-colors capitalize"
                role="button"
                aria-pressed="false"
              >
                {market}
              </button>
            ))}
          </div>
        </div>

        {/* Type Filters */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-text-muted min-w-[80px]">Tür:</span>
          <div className="flex flex-wrap gap-2">
            <button
              className="px-3 py-1.5 text-xs font-medium text-white bg-success rounded-md"
              role="button"
              aria-pressed="true"
            >
              Tümü
            </button>
            {data.filters.type.map((type) => (
              <button
                key={type}
                className="px-3 py-1.5 text-xs font-medium text-text-base bg-bg-card-hover border border-border rounded-md hover:bg-bg-card transition-colors capitalize"
                role="button"
                aria-pressed="false"
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Strategies Grid */}
      {data.items.length === 0 ? (
        <div className="bg-card rounded-lg border border-border p-8 text-center">
          <p className="text-text-muted">Henüz strateji oluşturulmamış</p>
          <button className="mt-4 px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-hover rounded-md transition-colors">
            İlk Stratejiyi Oluştur
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.items.map((strategy) => (
            <StrategyCard
              key={strategy.id}
              strategy={strategy}
              onEdit={(id) => {
                console.log('Edit strategy:', id);
                // TODO: Navigate to edit page
              }}
              onRun={(id) => {
                console.log('Run strategy:', id);
                // TODO: Show confirmation modal
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export const metadata = {
  title: 'Stratejilerim | Spark Trading',
  description: 'Oluşturulmuş strateji listesi',
};

