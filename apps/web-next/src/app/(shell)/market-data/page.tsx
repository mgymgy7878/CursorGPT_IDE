'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import MarketDataTable from '@/components/marketdata/MarketDataTable';
import { EmptyState } from '@/components/ui/states';
import { CompactPageHeader } from '@/components/core/CompactPageHeader';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Input } from '@/components/ui/Input';
import { Surface } from '@/components/ui/Surface';
import dynamic from 'next/dynamic';
import TechnicalOverview from '@/components/charts/TechnicalOverview';
import { IconSearch } from '@/components/ui/LocalIcons';
import { LS_RIGHT_RAIL_OPEN } from '@/components/layout/layout-tokens';
import { formatPriceUsd, formatCompactUsd, formatSignedPct } from '@/lib/format';

// Dynamic import for MarketChartWorkspace (SSR-safe)
const MarketChartWorkspace = dynamic(
  () => import('@/components/market/MarketChartWorkspace'),
  { ssr: false }
);
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
  const pathname = usePathname();

  // UI-1: Document title (SEO + browser tabs)
  useEffect(() => {
    document.title = 'Piyasa Verileri — Spark Trading';
  }, []);

  const [loading, setLoading] = useState(false);
  const [hasData, setHasData] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [marketFilter, setMarketFilter] = useState<string | null>(null);

  // URL'den state'i oku
  const urlView = searchParams.get('view') || 'list';
  const urlSymbol = searchParams.get('symbol');

  // View mode: 'list' (default), 'workspace', or 'full'
  const viewMode = urlView === 'workspace' ? 'workspace' : urlView === 'full' ? 'full' : 'list';
  // Mini Grafik toggle (only for list mode)
  const [showMiniChart, setShowMiniChart] = useState(true);
  // Selected symbol for chart view (normalize BTC%2FUSDT -> BTC/USDT)
  const normalizeSymbol = (sym: string | null) => {
    if (!sym) return null;
    return sym.replace(/%2F/g, '/').replace(/%2f/g, '/');
  };
  const selectedSymbol = normalizeSymbol(urlSymbol) || 'BTC/USDT';

  // PATCH X: MarketData'da Copilot panelini varsayılan açık yap (desktop genişlikte)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Desktop genişlik kontrolü (>= 1024px)
    const isDesktop = window.innerWidth >= 1024;
    if (!isDesktop) return;

    // MarketData sayfasında Copilot panelini varsayılan açık yap
    const currentState = localStorage.getItem(LS_RIGHT_RAIL_OPEN);
    // Eğer daha önce kullanıcı tarafından kapatılmadıysa (null veya 'true'), açık yap
    if (currentState === null || currentState === 'true') {
      localStorage.setItem(LS_RIGHT_RAIL_OPEN, 'true');
    }
  }, []);

  // URL'i güncelle (view + symbol)
  const updateUrl = (view: 'list' | 'workspace' | 'full', symbol: string | null) => {
    const params = new URLSearchParams();
    // Symbol her zaman URL'de tutulacak
    if (symbol) {
      params.set('symbol', symbol);
    }
    // View parametresi (list default, eklenmez)
    if (view !== 'list') {
      params.set('view', view);
    }
    const queryString = params.toString();
    const newUrl = queryString ? `/market-data?${queryString}` : '/market-data';
    router.replace(newUrl, { scroll: false });
  };

  // Category options for segmented control (Figma parity)
  const categoryOptions = [
    { value: 'crypto', label: 'Kripto' },
    { value: 'bist', label: 'BIST' },
    { value: 'stock', label: 'Hisse' },
    { value: 'forex', label: 'Forex' },
    { value: 'commodity', label: 'Emtia' },
    { value: 'futures', label: 'Vadeli' },
  ];

  // Row click handler - workspace'e geç
  const handleRowClick = (symbol: string) => {
    updateUrl('workspace', symbol);
  };

  // Chart icon click handler - workspace'e geç
  const handleViewChart = (symbol: string) => {
    updateUrl('workspace', symbol);
  };

  // Back to list
  const handleBackToList = () => {
    updateUrl('list', selectedSymbol);
  };

  // Toggle view buttons
  const handleToggleView = (view: 'list' | 'full') => {
    if (view === 'list') {
      updateUrl('list', selectedSymbol);
    } else {
      // Full screen requires symbol
      if (!selectedSymbol) {
        // Default to first symbol if none selected
        updateUrl('full', 'BTC/USDT');
      } else {
        updateUrl('full', selectedSymbol);
      }
    }
  };

  // ESC key handler for fullscreen exit
  useEffect(() => {
    if (viewMode !== 'full') return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        updateUrl('workspace', selectedSymbol);
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [viewMode, selectedSymbol]);

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

  // Get market data for selected symbol (from mock data)
  const getMarketDataForSymbol = (symbol: string | null) => {
    if (!symbol) return null;
    // Mock data from MarketDataTable
    const MOCK_DATA = [
      { symbol: 'BTC/USDT', price: 42150.00, change: 1.2, changeAbs: 1024.50, volume: 1250000000, rsi: 67, signal: 'BUY', high: 43245, low: 41200 },
      { symbol: 'ETH/USDT', price: 2250.00, change: -0.5, changeAbs: -11.25, volume: 850000000, rsi: 58, signal: 'BUY', high: 2280, low: 2200 },
      { symbol: 'SOL/USDT', price: 98.50, change: 5.2, changeAbs: 4.88, volume: 320000000, rsi: 72, signal: 'STRONG BUY', high: 102, low: 94 },
      { symbol: 'BNB/USDT', price: 315.75, change: 0.8, changeAbs: 2.52, volume: 180000000, rsi: 55, signal: 'HOLD', high: 320, low: 310 },
      { symbol: 'ADA/USDT', price: 0.485, change: -2.1, changeAbs: -0.0102, volume: 95000000, rsi: 45, signal: 'HOLD', high: 0.50, low: 0.47 },
    ];
    return MOCK_DATA.find(d => d.symbol === symbol) || null;
  };

  const marketData = getMarketDataForSymbol(selectedSymbol);

  return (
    <div className={cn("h-full", viewMode === 'full' ? "overflow-hidden h-screen w-screen" : "overflow-y-auto")}>
      <div className={cn(viewMode === 'full' ? "h-full w-full p-0" : "container mx-auto px-4 py-3")}>
        {/* List View Header */}
        {viewMode === 'list' && (
          <>
            {/* PATCH: Figma Parity Header - flex-wrap ile çakışma önleme (P0) */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                {/* Sol: Başlık + Arama */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <h1 className="text-[22px] font-semibold tracking-[-0.02em] leading-none text-neutral-200 shrink-0">
                    Piyasa Verileri
                  </h1>
                  <div className="flex-1 min-w-[220px] max-w-[520px] min-w-0 relative">
                    {/* PATCH V: Search input with left icon */}
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <IconSearch size={14} className="text-neutral-400" />
                    </div>
                    <Input
                      type="text"
                      placeholder="Sembol ara..."
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      className="h-[var(--control-h,36px)] text-xs pl-9 w-full"
                    />
                  </div>
                </div>

                {/* Sağ: View Toggle (Primary/Secondary Button) - ml-auto ile dar alanda alta düşer */}
                <div className="ml-auto flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleView('list')}
                    className={cn(
                      "px-3 py-1.5 text-[11px] font-medium rounded-lg transition-colors h-9",
                      "bg-blue-600 hover:bg-blue-700 text-white"
                    )}
                  >
                    {showMiniChart ? 'Mini Grafik' : 'Tablo'}
                  </button>
                  <button
                    onClick={() => handleToggleView('full')}
                    className={cn(
                      "px-3 py-1.5 text-[11px] font-medium rounded-lg transition-colors h-9",
                      "bg-[#111318] border border-white/10 text-[#9CA3AF] hover:text-[#E5E7EB] hover:bg-white/5"
                    )}
                  >
                    Tam Ekran
                  </button>
                </div>
              </div>

              {/* PATCH U: Kategori Selector (Segmented Pill) - Figma parity: beyaz pill aktif */}
              <div className="flex items-center gap-2">
                <SegmentedControl
                  options={categoryOptions}
                  value={marketFilter || 'crypto'}
                  onChange={(v) => setMarketFilter(v === 'crypto' ? null : v)}
                  size="md"
                />
              </div>
            </div>
          </>
        )}

        {/* Workspace View Header - UI-1: "Tabloya Dön" sticky (solda) */}
        {viewMode === 'workspace' && (
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={handleBackToList}
              className="sticky left-0 z-10 flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium text-neutral-400 hover:text-neutral-200 hover:bg-white/5 transition-colors bg-neutral-950/95 backdrop-blur-sm"
            >
              ← Tabloya Dön
            </button>
            <button
              onClick={() => handleToggleView('full')}
              className={cn(
                "px-3 py-1.5 text-[11px] font-medium rounded-lg transition-colors h-9",
                "bg-[#111318] border border-white/10 text-[#9CA3AF] hover:text-[#E5E7EB] hover:bg-white/5"
              )}
            >
              Tam Ekran
            </button>
          </div>
        )}

        {/* Workspace View: Büyük grafik + detay kartları */}
        {viewMode === 'workspace' ? (
          <div className="h-full flex flex-col gap-4">
            {selectedSymbol ? (
              <>
                {/* Chart Area */}
                <div className="flex-1 min-h-0 overflow-hidden rounded-2xl border border-white/10 bg-[#0b0d10]">
                  <MarketChartWorkspace
                    symbol={selectedSymbol}
                    timeframe="1D"
                    onTimeframeChange={(tf: string) => {
                      console.log('Timeframe changed:', tf);
                    }}
                    onClose={handleBackToList}
                  />
                </div>

                {/* Detay Kartları (2 satırlık grid) */}
                {marketData && (
                  <div className="grid grid-cols-2 gap-3">
                    {/* Satır 1: Price, Change%, High/Low, Volume */}
                    <Surface variant="card" className="p-4">
                      <div className="space-y-2">
                        <div className="text-[10px] text-neutral-500">Last Price</div>
                        <div className="text-[18px] font-semibold text-neutral-200">{formatPriceUsd(marketData.price)}</div>
                      </div>
                    </Surface>
                    <Surface variant="card" className="p-4">
                      <div className="space-y-2">
                        <div className="text-[10px] text-neutral-500">24h Change</div>
                        <div className={cn(
                          "text-[18px] font-semibold",
                          marketData.change >= 0 ? "text-emerald-400" : "text-red-400"
                        )}>
                          {formatSignedPct(marketData.change, { input: 'pct' })}
                        </div>
                      </div>
                    </Surface>
                    <Surface variant="card" className="p-4">
                      <div className="space-y-2">
                        <div className="text-[10px] text-neutral-500">24h High / Low</div>
                        <div className="text-[14px] font-medium text-neutral-300">
                          {formatPriceUsd(marketData.high)} / {formatPriceUsd(marketData.low)}
                        </div>
                      </div>
                    </Surface>
                    <Surface variant="card" className="p-4">
                      <div className="space-y-2">
                        <div className="text-[10px] text-neutral-500">Volume</div>
                        <div className="text-[14px] font-medium text-neutral-300">{formatCompactUsd(marketData.volume)}</div>
                      </div>
                    </Surface>

                    {/* Satır 2: RSI, Signal, Regime, Volatility */}
                    <Surface variant="card" className="p-4">
                      <div className="space-y-2">
                        <div className="text-[10px] text-neutral-500">RSI (14)</div>
                        <div className={cn(
                          "text-[18px] font-semibold",
                          marketData.rsi > 70 ? "text-red-400" :
                          marketData.rsi < 30 ? "text-emerald-400" :
                          "text-neutral-200"
                        )}>
                          {marketData.rsi}
                        </div>
                      </div>
                    </Surface>
                    <Surface variant="card" className="p-4">
                      <div className="space-y-2">
                        <div className="text-[10px] text-neutral-500">Signal</div>
                        <div className={cn(
                          "text-[14px] font-medium",
                          marketData.signal === 'BUY' || marketData.signal === 'STRONG BUY' ? "text-emerald-400" :
                          marketData.signal === 'SELL' ? "text-red-400" :
                          "text-amber-400"
                        )}>
                          {marketData.signal}
                        </div>
                      </div>
                    </Surface>
                    <Surface variant="card" className="p-4">
                      <div className="space-y-2">
                        <div className="text-[10px] text-neutral-500">Regime</div>
                        <div className="text-[14px] font-medium text-neutral-300">Trend</div>
                      </div>
                    </Surface>
                    <Surface variant="card" className="p-4">
                      <div className="space-y-2">
                        <div className="text-[10px] text-neutral-500">Volatility</div>
                        <div className="text-[14px] font-medium text-neutral-300">High</div>
                      </div>
                    </Surface>
                  </div>
                )}
              </>
            ) : (
              <Surface variant="card" className="p-6">
                <div className="flex flex-col items-center justify-center h-[400px] text-center">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center mb-4">
                    <span className="text-2xl">📈</span>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-200 mb-2">
                    Sembol Seçin
                  </h3>
                  <p className="text-sm text-neutral-500 max-w-md">
                    Tablodaki bir sembolün grafik butonuna tıklayarak workspace görünümüne geçin.
                  </p>
                </div>
              </Surface>
            )}
          </div>
        ) : viewMode === 'full' ? (
          /* Fullscreen Chart View - AppFrame chrome gizlenecek */
          <div className="h-screen w-screen flex flex-col overflow-hidden p-0">
            {selectedSymbol ? (
              <div className="flex-1 min-h-0 overflow-hidden">
                <MarketChartWorkspace
                  symbol={selectedSymbol}
                  timeframe="1D"
                  onTimeframeChange={(tf: string) => {
                    console.log('Timeframe changed:', tf);
                  }}
                  onClose={() => updateUrl('workspace', selectedSymbol)}
                  isFullscreen={true}
                />
              </div>
            ) : (
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
            {/* Main content: Table (full-width when preview closed) - Figma parity: rounded-2xl, px-5 py-4 */}
            <div className="w-full">
              {/* Market Data Table */}
              <Surface variant="card" className="overflow-hidden w-full rounded-2xl border border-white/10 bg-[#0b0d10] px-5 py-4">
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
                    onRowClick={handleRowClick}
                    selectedSymbol={selectedSymbol}
                  />
                )}
              </Surface>

              {/* Embedded Chart Preview (Figma Parity P0) - Default kapalı */}
              <Surface variant="card" className="p-3 hidden flex-col">
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

        {/* Footer hint - sadece list view'da */}
        {viewMode === 'list' && (
          <div className="mt-4 text-center text-[10px] text-neutral-500">
            Piyasa analizi için sağdaki SPARK COPILOT'u kullanın
          </div>
        )}
      </div>
    </div>
  );
}
