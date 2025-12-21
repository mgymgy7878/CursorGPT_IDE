/**
 * Golden Master Market Data Route
 *
 * Statik mock data ile deterministik screenshot testleri için.
 */

'use client';

import MarketDataTable from '@/components/marketdata/MarketDataTable';

export const dynamic = 'force-dynamic';

export default function GoldenMasterMarketDataPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-neutral-200">Market Data</h1>
        <p className="text-sm text-neutral-400 mt-1">Realtime feed & history modules</p>
      </div>

      <div className="mt-6">
        <MarketDataTable />
      </div>
    </div>
  );
}

