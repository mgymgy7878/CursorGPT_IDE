import React from 'react';
import { formatCurrency, formatPercent } from '@/lib/utils/currency';

export interface MarketTicker {
  symbol: string;
  price: number;
  changePct: number;
  stalenessSec: number;
}

export interface MarketMiniProps {
  tickers: MarketTicker[];
}

/**
 * Mini market data widget for homepage
 * Shows real-time crypto prices with staleness indicator
 */
export function MarketMini({ tickers }: MarketMiniProps) {
  return (
    <section className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <h2 className="text-lg font-semibold text-text-strong">Piyasa Verileri</h2>
      </div>

      <div className="space-y-4">
        {tickers.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-4">Veri yüklenemedi</p>
        ) : (
          tickers.map((ticker) => (
            <div key={ticker.symbol}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-text-strong">{ticker.symbol}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
                    ticker.stalenessSec < 5
                      ? 'bg-success/10 text-success'
                      : 'bg-warning/10 text-warning'
                  }`}
                  aria-label={`Son güncelleme: ${ticker.stalenessSec} saniye önce`}
                >
                  {'<'}
                  {ticker.stalenessSec}s
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-semibold text-text-strong tabular">
                  {formatCurrency(ticker.price, { decimals: 2 })}
                </span>
                <span className="text-sm font-medium text-success">
                  ▲ {formatPercent(ticker.changePct, { decimals: 2, showSign: false })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <button className="w-full mt-4 text-sm text-accent hover:text-accent-hover transition-colors text-center">
        Tüm Piyasalar →
      </button>
    </section>
  );
}

