'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MarketDataTable from '@/components/marketdata/MarketDataTable';
import { EmptyState } from '@/components/ui/states';
import { PageHeader } from '@/components/common/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import { Surface } from '@/components/ui/Surface';
import TechnicalOverview from '@/components/charts/TechnicalOverview';
import { cn } from '@/lib/utils';

/**
 * Market Data Page - Figma Parity v3
 *
 * Route: /market-data (shell layout'ta)
 * Features:
 * - Mini Grafik / Tablo / Tam Ekran segmented toggle
 * - Sparkline kolonu (Mini Grafik modunda, yön/renk Change'e uygun)
 * - Chart view (Tam Ekran modunda sembol seçince)
 * - URL query param: ?view=full&symbol=BTCUSDT
 */
export default function MarketData() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [hasData, setHasData] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [marketFilter, setMarketFilter] = useState<string | null>(null);

  // URL'den state'i oku
  const urlView = searchParams.get('view');
  const urlSymbol = searchParams.get('symbol');

  // View mode: 'table' (default) or 'full'
  const [viewMode, setViewMode] = useState<'table' | 'full'>(urlView === 'full' ? 'full' : 'table');
  // Mini Grafik toggle (only for table mode)
  const [showMiniChart, setShowMiniChart] = useState(true);
  // Selected symbol for chart view (default: first symbol)
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(urlSymbol || 'BTC/USDT');

  // URL'i state'e senkronize et (initial load)
  useEffect(() => {
    if (urlView === 'full') {
      setViewMode('full');
    }
    if (urlSymbol) {
      setSelectedSymbol(urlSymbol);
    }
  }, [urlView, urlSymbol]);

  // State değiştiğinde URL'i güncelle
  const updateUrl = (view: 'table' | 'full', symbol: string | null) => {
    const params = new URLSearchParams();
    if (view === 'full') {
      params.set('view', 'full');
      if (symbol) {
        params.set('symbol', symbol);
      }
    }
    const queryString = params.toString();
    const newUrl = queryString ? `/market-data?${queryString}` : '/market-data';
    router.replace(newUrl, { scroll: false });
  };

  const filterChips = [
    { id: 'crypto', label: 'Kripto', active: marketFilter === 'crypto', onClick: () => setMarketFilter(marketFilter === 'crypto' ? null : 'crypto') },
    { id: 'bist', label: 'BIST', active: marketFilter === 'bist', onClick: () => setMarketFilter(marketFilter === 'bist' ? null : 'bist') },
    { id: 'stock', label: 'Hisse', active: marketFilter === 'stock', onClick: () => setMarketFilter(marketFilter === 'stock' ? null : 'stock') },
    { id: 'forex', label: 'Forex', active: marketFilter === 'forex', onClick: () => setMarketFilter(marketFilter === 'forex' ? null : 'forex') },
    { id: 'commodity', label: 'Emtia', active: marketFilter === 'commodity', onClick: () => setMarketFilter(marketFilter === 'commodity' ? null : 'commodity') },
    { id: 'futures', label: 'Vadeli', active: marketFilter === 'futures', onClick: () => setMarketFilter(marketFilter === 'futures' ? null : 'futures') },
  ];

  const handleViewChart = (symbol: string) => {
    setSelectedSymbol(symbol);
    setViewMode('full');
    updateUrl('full', symbol);
  };

  const handleBackToTable = () => {
    setViewMode('table');
    setSelectedSymbol(null);
    updateUrl('table', null);
  };

  const handleToggleView = (view: 'miniChart' | 'table' | 'full') => {
    if (view === 'miniChart') {
      setShowMiniChart(true);
      setViewMode('table');
      updateUrl('table', null);
    } else if (view === 'table') {
      setShowMiniChart(false);
      setViewMode('table');
      updateUrl('table', null);
    } else {
      setViewMode('full');
      updateUrl('full', selectedSymbol);
    }
  };

  // Generate mock chart data based on symbol
  const generateChartData = (symbol: string) => {
    let hash = 0;
    for (let i = 0; i < symbol.length; i++) {
      hash = ((hash << 5) - hash) + symbol.charCodeAt(i);
      hash = hash & hash;
    }

    return Array.from({ length: 60 }, (_, i) => ({
      t: i,
      v: 100 + Math.sin(i / 5 + hash % 10) * 10 + (hash % 20) + (i * 0.2),
    }));
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="container mx-auto px-4 py-4">
        {/* Header - Figma style: separate buttons */}
        <div className="flex items-center justify-between mb-4">
          <PageHeader
            title="Piyasa Verileri"
            subtitle="Realtime feed & history modules"
            className="mb-0"
          />
          {/* Action buttons: Tam Ekran | Mini Grafik (Figma style - 2 separate buttons) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleToggleView('full')}
              className={cn(
                "px-3 py-1.5 text-[11px] font-medium rounded-md border transition-colors",
                viewMode === 'full'
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  : "bg-white/5 text-neutral-300 border-white/10 hover:bg-white/8 hover:text-white"
              )}
            >
              Tam Ekran
            </button>
            <button
              onClick={() => handleToggleView(showMiniChart ? 'table' : 'miniChart')}
              className={cn(
                "px-3 py-1.5 text-[11px] font-medium rounded-md border transition-colors",
                showMiniChart && viewMode === 'table'
                  ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                  : "bg-white/5 text-neutral-300 border-white/10 hover:bg-white/8 hover:text-white"
              )}
            >
              Mini Grafik
            </button>
          </div>
        </div>

        {/* Full Chart View */}
        {viewMode === 'full' ? (
          <div className="space-y-4">
            {/* Back button */}
            <button
              onClick={handleBackToTable}
              className="flex items-center gap-2 text-[12px] text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              ← Tabloya Dön
            </button>

            {selectedSymbol ? (
              /* Chart with selected symbol */
              <Surface variant="card" className="p-4">
                {/* Chart header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full text-[12px] font-semibold bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                      {selectedSymbol}
                    </span>
                    <span className="text-[11px] text-neutral-500">1D · Trend Follower v1</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-neutral-500 px-2 py-1 rounded bg-white/5 border border-white/10">
                      Mock Data
                    </span>
                  </div>
                </div>

                {/* Chart area */}
                <div className="h-[400px] bg-neutral-900/50 rounded-lg border border-white/5">
                  <TechnicalOverview data={generateChartData(selectedSymbol)} />
                </div>

                {/* Chart footer info */}
                <div className="mt-4 flex items-center justify-between text-[10px] text-neutral-500">
                  <span>TradingView entegrasyonu yakında...</span>
                  <span>Win: 68% · R:R 1:2.5 · Regime: Trend</span>
                </div>
              </Surface>
            ) : (
              /* Empty state - no symbol selected */
              <Surface variant="card" className="p-6">
                <div className="flex flex-col items-center justify-center h-[400px] text-center">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center mb-4">
                    <span className="text-2xl">📈</span>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-200 mb-2">
                    Sembol Seçin
                  </h3>
                  <p className="text-sm text-neutral-500 max-w-md">
                    Tablodaki bir sembolün grafik butonuna tıklayarak tam ekran chart görünümüne geçin.
                  </p>
                </div>
              </Surface>
            )}
          </div>
        ) : (
          <>
            {/* Filter Bar */}
            <div className="mb-4">
              <FilterBar
                chips={filterChips}
                searchPlaceholder="Sembol ara..."
                searchValue={searchValue}
                onSearchChange={setSearchValue}
              />
            </div>

            {/* Main content: Table + Chart Preview (2 columns on lg+) */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
              {/* Market Data Table */}
              <Surface variant="card" className="overflow-hidden">
                {loading ? (
                  <MarketDataTable loading={true} />
                ) : !hasData ? (
                  <div className="p-12">
                    <EmptyState
                      title="No market data available"
                      description="Market data will appear here when available"
                    />
                  </div>
                ) : (
                  <MarketDataTable
                    showSparkline={showMiniChart}
                    onViewChart={handleViewChart}
                    onRowClick={(symbol) => setSelectedSymbol(symbol)}
                    selectedSymbol={selectedSymbol}
                  />
                )}
              </Surface>

              {/* Embedded Chart Preview (Figma Parity P0) */}
              <Surface variant="card" className="p-3 hidden lg:flex flex-col">
                {/* Preview header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {selectedSymbol && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                        {selectedSymbol}
                      </span>
                    )}
                    <span className="text-[10px] text-neutral-500">1D</span>
                  </div>
                  <button
                    onClick={() => selectedSymbol && handleViewChart(selectedSymbol)}
                    className="px-2 py-1 text-[10px] font-medium rounded bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 transition-colors"
                  >
                    Tam Ekran →
                  </button>
                </div>

                {/* Preview chart */}
                <div className="flex-1 min-h-[200px] bg-neutral-900/50 rounded-lg border border-white/5">
                  {selectedSymbol ? (
                    <TechnicalOverview data={generateChartData(selectedSymbol)} />
                  ) : (
                    <div className="h-full flex items-center justify-center text-[11px] text-neutral-500">
                      Tablo'dan sembol seçin
                    </div>
                  )}
                </div>

                {/* Preview footer */}
                <div className="mt-2 text-[9px] text-neutral-500 flex items-center justify-between">
                  <span>Win: 68% · R:R 1:2.5</span>
                  <span>Regime: Trend</span>
                </div>
              </Surface>
            </div>
          </>
        )}

        {/* Footer hint */}
        <div className="mt-4 text-center text-[10px] text-neutral-500">
          Piyasa analizi için sağdaki SPARK COPILOT'u kullanın
        </div>
      </div>
    </div>
  );
}
