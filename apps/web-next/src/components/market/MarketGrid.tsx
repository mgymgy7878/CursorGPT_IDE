'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';

type MockMarketData = {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  sparkline: number[];
};

const MOCK_SYMBOLS: MockMarketData[] = [
  { symbol: 'BTCUSDT', price: 42500.00, change24h: 2.3, volume24h: 28500000000, sparkline: [40000, 41000, 40500, 42000, 41800, 42500] },
  { symbol: 'ETHUSDT', price: 2650.50, change24h: -1.2, volume24h: 15200000000, sparkline: [2700, 2680, 2650, 2640, 2655, 2650] },
  { symbol: 'BNBUSDT', price: 312.80, change24h: 0.8, volume24h: 1800000000, sparkline: [310, 311, 312, 311, 313, 312] },
  { symbol: 'SOLUSDT', price: 98.45, change24h: 5.2, volume24h: 3200000000, sparkline: [93, 95, 96, 97, 99, 98] },
  { symbol: 'XRPUSDT', price: 0.62, change24h: -0.5, volume24h: 2100000000, sparkline: [0.63, 0.62, 0.625, 0.62, 0.618, 0.62] },
  { symbol: 'ADAUSDT', price: 0.52, change24h: 3.8, volume24h: 980000000, sparkline: [0.50, 0.51, 0.515, 0.52, 0.525, 0.52] },
];

/**
 * MarketGrid - Mock market data display
 *
 * Features:
 * - 6 major symbols with mock data
 * - Tabular price formatting
 * - 24h change percentage (colored)
 * - Mini SVG sparkline
 * - Quick alert CTA
 */
export default function MarketGrid() {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: price < 1 ? 4 : 2,
    }).format(price);
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(1)}B`;
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(1)}M`;
    return `$${volume}`;
  };

  // Generate simple SVG sparkline path
  const getSparklinePath = (data: number[]) => {
    if (data.length === 0) return '';
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const width = 60;
    const height = 24;

    const points = data.map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {MOCK_SYMBOLS.map((item) => {
        const isPositive = item.change24h >= 0;
        const changeColor = isPositive ? 'text-green-400' : 'text-red-400';
        const sparklineColor = isPositive ? '#16a34a' : '#dc2626'; // PR-8.5: Use semantic tokens

        return (
          <article
            key={item.symbol}
            className="rounded-xl bg-card/60 border border-zinc-800 pad-md hover:border-zinc-700 transition-colors flex flex-col"
            style={{ height: '180px' }}
          >
            {/* Header - symbol + change% */}
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-medium text-strong text-sm">{item.symbol}</h3>
              <div className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded ${isPositive ? 'badge-ok' : 'badge-danger'}`}>
                {isPositive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                {isPositive ? '+' : ''}{item.change24h.toFixed(1)}%
              </div>
            </div>

            {/* Price - large and prominent */}
            <div className="text-lg font-semibold tabular mb-1 text-strong">
              {formatPrice(item.price)}
            </div>

            {/* Mini sparkline - compact h-8 */}
            <div className="mb-1">
              <svg width="100%" height="32" className="opacity-60">
                <path
                  d={getSparklinePath(item.sparkline)}
                  fill="none"
                  stroke={sparklineColor}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>

            {/* Volume + Action - single line */}
            <div className="flex items-center justify-between text-xs text-muted mt-auto">
              <span>24h: <span className="text-neutral-300 tabular font-medium">{formatVolume(item.volume24h)}</span></span>
              <button
                onClick={() => window.location.href = `/alerts?symbol=${item.symbol}`}
                className="px-2 py-0.5 text-xs bg-transparent border border-zinc-700 hover:bg-zinc-800 text-neutral-300 rounded transition-colors"
              >
                Hızlı Uyarı
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

